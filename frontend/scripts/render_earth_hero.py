#!/usr/bin/env python3
"""Renders the homepage Earth (src/assets/earth/*) from NASA and NOAA imagery.

The hero has a fixed camera, so everything is baked here and the browser only downloads the
pixels it shows. Output is two layers: `base` (surface, lighting, atmosphere) and `clouds` (clouds
and their shadows, kept apart so EarthHero can drift them). The camera goes to view.json, which
lib/earth-view.ts reads, so a pin and the image can't disagree about where a place is.

Needs numpy, pillow (with AVIF) and scipy, and about 12 GB of free memory. The sources are too large
to check in. All are August 2004 / 2026-08-29T20:00Z, and NASA_DIR and GIBS_DIR keep the names below:

  surface    world.topo.bathy.200408.3x21600x21600.{A1,B1,B2}.jpg, 240 px/degree. A1 and B1 are the
             north of the western hemisphere; the frame only touches B2 in a sliver under the scrim.
             https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography-bathymetry/august/
             (NASA Blue Marble Next Generation)
  elevation  gebco_08_rev_elev_{A1,B1}_grey_geo.tif, 120 px/degree, water is 0.
             https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/topography/
             (NASA Blue Marble topography, from the GEBCO_08 grid)
  clouds     vis-{east,west}.png: GOES-{East,West}_ABI_Band2_Red_Visible_1km, its native 114 px/degree
             ir-{east,west}.png: GOES-{East,West}_ABI_Band13_Clean_Infrared, only used to cut glint
             https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi
             SERVICE=WMS REQUEST=GetMap VERSION=1.3.0 CRS=EPSG:4326 FORMAT=image/png TRANSPARENT=true
             TIME=2026-08-29T20:00:00Z BBOX=-6,-180,88,-8 and WIDTH=19570 HEIGHT=10695 for Band 2,
             WIDTH=5160 HEIGHT=2820 for Band 13.

GIBS only keeps roughly the last 75 to 90 days of GOES, so that time will disappear. To re-render after
that, pick a new day when the contiguous U.S. is mostly clear, at about 20:00Z so both satellites have
sun, then update TIME here, SUBSOLAR_LAT and SUBSOLAR_LON below, and docs/design-system.md.

Usage: render_earth_hero.py NASA_DIR GIBS_DIR OUT_DIR [--preview]
"""

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

Image.MAX_IMAGE_PIXELS = None

# Camera. Looking at a point south of the U.S. puts the country in the upper half of the disc,
# which is the half the hero shows.
VIEW = {
    "centerLat": 9.0,
    "centerLon": -97.0,
    "roll": -4.0,  # degrees; tips north slightly right, as in the reference
    "distance": 4.6,  # camera distance in Earth radii
    # Frame around the disc, in limb radii from its center.
    "halfWidth": 1.32,
    "top": 1.13,
    "bottom": -0.02,
}
# Limb radius in pixels for the largest output (the width below is 2 * halfWidth * this).
LIMB_PX = 1970
SUPERSAMPLE = 1.4
# Spacing follows real screens: EarthHero's srcset picks the first width at or above what's needed.
WIDTHS = [5200, 4200, 2500, 1800, 1200]
WEBP_WIDTHS = [2500, 1200]  # fallback for browsers without AVIF
SURFACE_PX_PER_DEGREE = 240
ELEVATION_PX_PER_DEGREE = 120
# How far south the surface tiles are read. The frame ends just above this.
SURFACE_SOUTH = 3
# GIBS crop of the cloud sources. It runs past the east limb so clouds reach it.
CLOUD_BBOX = (-6.0, -180.0, 88.0, -8.0)  # south, west, north, east
# Light from upper left and in front of the planet, so the night side falls at the lower right.
SUN = np.array([-0.56, 0.42, 0.71], dtype=np.float32)
SUN = SUN / np.linalg.norm(SUN)
# Subsolar point at the time of the cloud sources, used to even out their brightness.
SUBSOLAR_LAT, SUBSOLAR_LON = 9.2, -117.0
ATMOSPHERE = np.array([0.29, 0.60, 1.0], dtype=np.float32)
# Terrain shading: exaggeration, and the smoothing of the elevation in source pixels.
RELIEF_STRENGTH = 26.0
RELIEF_BLUR = 1.2


def smoothstep(lo, hi, x):
    t = np.clip((x - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def to_linear(srgb):
    return np.power(np.clip(srgb, 0, 1), 2.2)


def to_srgb(linear):
    # A soft shoulder, so ice and cloud tops roll off instead of clipping.
    linear = linear * 1.18
    linear = linear / (1 + linear * 0.28)
    return np.power(np.clip(linear, 0, 1), 1 / 2.2)


def latlon_vectors(lat_deg, lon_deg):
    lat, lon = np.radians(lat_deg), np.radians(lon_deg)
    return np.stack([np.cos(lat) * np.cos(lon), np.cos(lat) * np.sin(lon), np.sin(lat)], -1)


def camera_basis():
    """World axes of the camera: right, up, toward the camera (rows of the world-to-camera matrix)."""
    lat, lon = np.radians(VIEW["centerLat"]), np.radians(VIEW["centerLon"])
    toward = latlon_vectors(VIEW["centerLat"], VIEW["centerLon"])
    east = np.array([-np.sin(lon), np.cos(lon), 0.0])
    north = np.cross(toward, east)
    roll = np.radians(VIEW["roll"])
    right = np.cos(roll) * east + np.sin(roll) * north
    up = -np.sin(roll) * east + np.cos(roll) * north
    return np.stack([right, up, toward]).astype(np.float32)


def trace_sphere(u, v):
    """Hits the unit sphere from frame coordinates; returns camera-space points and a mask."""
    d = VIEW["distance"]
    k = np.sqrt(d * d - 1)
    length = np.sqrt(u * u + v * v + k * k)
    dx, dy, dz = u / length, v / length, -k / length
    # |O + tD|^2 = 1 with O = (0, 0, d)
    b = d * dz
    disc = b * b - (d * d - 1)
    hit = disc >= 0
    t = -b - np.sqrt(np.maximum(disc, 0))
    return np.stack([t * dx, t * dy, d + t * dz], -1), hit


def sample(image, rows, cols, order=1):
    channels = image[..., None] if image.ndim == 2 else image
    out = [
        ndimage.map_coordinates(
            channels[..., i], [rows, cols], order=order, mode="nearest", output=np.float32
        )
        for i in range(channels.shape[-1])
    ]
    return np.stack(out, -1) if image.ndim == 3 else out[0]


def load_surface(nasa, factor):
    """North of the western hemisphere as uint8 RGB, reduced so sampling doesn't alias."""

    def tile(name):
        return np.asarray(
            Image.open(nasa / f"world.topo.bathy.200408.3x21600x21600.{name}.jpg").reduce(factor)
        )

    a1 = tile("A1")
    size = a1.shape[0]
    south_rows = SURFACE_SOUTH * SURFACE_PX_PER_DEGREE // factor
    mosaic = np.zeros((size + south_rows, 2 * size, 3), dtype=np.uint8)
    mosaic[:size, :size] = a1
    del a1
    mosaic[:size, size:] = tile("B1")
    mosaic[size:, size:] = tile("B2")[:south_rows]
    # A2 is out of frame, so it's only filled to keep sampling from reading black.
    mosaic[size:, :size] = mosaic[size - 1, :size]
    return mosaic


def load_elevation(nasa, factor):
    def tile(name):
        return Image.open(nasa / f"gebco_08_rev_elev_{name}_grey_geo.tif").reduce(factor)

    return np.concatenate([np.asarray(tile("A1")), np.asarray(tile("B1"))], axis=1)


def load_clouds(gibs, lat, lon):
    """Stitches the two satellites at each output pixel: visible, infrared and how covered it is."""
    south, west_lon, north, east_lon = CLOUD_BBOX

    def layer(name):
        image = Image.open(gibs / name)
        rows = (north - lat) * image.height / (north - south) - 0.5
        cols = (lon - west_lon) * image.width / (east_lon - west_lon) - 0.5
        return (
            sample(np.asarray(image.getchannel("R")), rows, cols) / 255,
            sample(np.asarray(image.getchannel("A")), rows, cols) / 255,
        )

    east, east_a = layer("vis-east.png")
    west, west_a = layer("vis-west.png")
    ir_east, _ = layer("ir-east.png")
    ir_west, _ = layer("ir-west.png")
    # Each satellite sees best under itself, so hand over midway between them.
    weight = smoothstep(-114.0, -100.0, lon)
    weight_east = weight * east_a
    weight_west = (1 - weight) * west_a
    total = np.maximum(weight_east + weight_west, 1e-3)
    vis = (east * weight_east + west * weight_west) / total
    ir = (ir_east * weight_east + ir_west * weight_west) / total
    covered = np.clip(total, 0, 1)

    # Undo the low sun toward the edges of the day side (the source is square-root stretched).
    sun_dir = latlon_vectors(SUBSOLAR_LAT, SUBSOLAR_LON).astype(np.float32)
    cos_sun = np.clip(latlon_vectors(lat, lon) @ sun_dir, 0.08, 1)
    vis = np.clip(vis / np.sqrt(cos_sun) * 0.82, 0, 1)
    # Feathered so the end of the crop can't show as a line when the clouds drift.
    inside = np.minimum.reduce([lat - south, north - lat, lon - west_lon, east_lon - lon])
    return vis, ir, covered * smoothstep(0.0, 1.5, inside)


def render(limb_px, nasa, gibs):
    scale = limb_px * SUPERSAMPLE
    width = int(round(2 * VIEW["halfWidth"] * scale))
    height = int(round((VIEW["top"] - VIEW["bottom"]) * scale))
    xs = (np.arange(width) + 0.5) / scale - VIEW["halfWidth"]
    ys = VIEW["top"] - (np.arange(height) + 0.5) / scale
    u, v = np.meshgrid(xs.astype(np.float32), ys.astype(np.float32))
    radius = np.sqrt(u * u + v * v)
    # Sizes tuned in output pixels at the original 1320 limb.
    size_scale = limb_px / 1320

    points, hit = trace_sphere(u, v)
    basis = camera_basis()
    world = points @ basis  # camera to world: basis is orthonormal
    lat = np.degrees(np.arcsin(np.clip(world[..., 2], -1, 1)))
    lon = np.degrees(np.arctan2(world[..., 1], world[..., 0]))
    # About two source pixels per output pixel at the center of the disc, where it's sharpest.
    wanted = 2 * scale * np.sqrt(VIEW["distance"] ** 2 - 1) / (VIEW["distance"] - 1) / 57.3

    print("sampling surface")
    factor = max(1, int(SURFACE_PX_PER_DEGREE / wanted))
    rate = SURFACE_PX_PER_DEGREE / factor
    surface = to_linear(
        sample(load_surface(nasa, factor), (90 - lat) * rate - 0.5, (lon + 180) * rate - 0.5) / 255
    )

    print("sampling elevation")
    factor = max(1, int(ELEVATION_PX_PER_DEGREE / wanted))
    rate = ELEVATION_PX_PER_DEGREE / factor
    rows, cols = (90 - lat) * rate - 0.5, (lon + 180) * rate - 0.5
    elevation = load_elevation(nasa, factor)
    # Soft, so coasts come out antialiased rather than following source pixels.
    water = 1 - smoothstep(0.3, 0.7, sample((elevation > 0).astype(np.float32), rows, cols))
    relief = ndimage.gaussian_filter(elevation.astype(np.float32) / 255, RELIEF_BLUR)
    del elevation
    # Per degree/60, the scale relief_strength was tuned at.
    slope_north = sample(-np.gradient(relief, axis=0), rows, cols) * rate / 60
    slope_east = sample(np.gradient(relief, axis=1), rows, cols) * rate / 60
    del relief, rows, cols

    print("shading surface")
    normal = points  # unit sphere in camera space
    lat_rad, lon_rad = np.radians(lat), np.radians(lon)
    east_world = np.stack([-np.sin(lon_rad), np.cos(lon_rad), np.zeros_like(lon_rad)], -1)
    north_world = np.stack(
        [
            -np.sin(lat_rad) * np.cos(lon_rad),
            -np.sin(lat_rad) * np.sin(lon_rad),
            np.cos(lat_rad),
        ],
        -1,
    )
    east_cam, north_cam = east_world @ basis.T, north_world @ basis.T
    # Exaggerated, as the terrain would otherwise vanish at this distance.
    relief_strength = RELIEF_STRENGTH
    tilted = (
        normal
        - relief_strength * (slope_east / np.maximum(np.cos(lat_rad), 0.15))[..., None] * east_cam
        - relief_strength * slope_north[..., None] * north_cam
    )
    tilted /= np.linalg.norm(tilted, axis=-1, keepdims=True)
    del east_world, north_world, east_cam, north_cam

    sun_flat = normal @ SUN
    sun_relief = tilted @ SUN
    daylight = smoothstep(-0.12, 0.22, sun_flat)
    view_dir = np.array([0, 0, VIEW["distance"]], dtype=np.float32) - points
    view_dir /= np.linalg.norm(view_dir, axis=-1, keepdims=True)
    mu = np.clip(np.sum(normal * view_dir, -1), 0, 1)

    land_light = np.clip(sun_relief, 0, 1) ** 0.85
    light = 0.03 + land_light * 1.25
    color = surface * light[..., None]

    # Sea: flat, a little brighter than the source, with a soft glint toward the sun.
    half = SUN + view_dir
    half /= np.linalg.norm(half, axis=-1, keepdims=True)
    spec = np.clip(np.sum(normal * half, -1), 0, 1)
    glint = (0.14 * spec**120 + 0.012 * spec**20)[..., None] * np.array([0.75, 0.88, 1.0], dtype=np.float32)
    # Blue Marble's shallow water is vivid, so pull sea colour toward its own luminance.
    sea_gray = surface @ np.array([0.2, 0.5, 0.3], dtype=np.float32)
    sea_color = surface * 0.62 + sea_gray[..., None] * np.array([0.26, 0.34, 0.42], dtype=np.float32)
    sea = sea_color * (0.03 + np.clip(sun_flat, 0, 1) * 1.15)[..., None] + glint * daylight[..., None]
    color = color * (1 - water)[..., None] + sea * water[..., None]

    # Atmosphere: blue haze over everything, thickening toward the limb.
    haze = (1 - mu) ** 2.6
    veil = (0.012 + 0.62 * haze)[..., None] * ATMOSPHERE * daylight[..., None]
    color = color * (1 - 0.62 * haze * daylight)[..., None] + veil

    print("sampling clouds")
    vis_px, ir_px, cover_px = load_clouds(gibs, lat, lon)

    surface_vis = np.power(np.clip(surface[..., 0], 0, 1), 0.5)
    # Cloud density: how far the satellite's brightness rises above the known surface, so bright
    # desert and ice don't read as cloud. Infrared only cuts sun glint, which is warm.
    excess = vis_px - (0.36 + 0.6 * surface_vis * (1 - water))
    glint_cut = 0.72 + 0.28 * smoothstep(0.3, 0.5, ndimage.gaussian_filter(ir_px, 4 * size_scale))
    density = smoothstep(0.0, 0.42, excess) ** 1.15 * glint_cut
    density *= cover_px * smoothstep(84.0, 76.0, lat)

    # Cloud relief: treat density as height and light it, which gives tops some volume.
    gy, gx = np.gradient(ndimage.gaussian_filter(density, 1.2 * SUPERSAMPLE))
    sun_xy = SUN[:2] / np.linalg.norm(SUN[:2])
    tops = np.clip(1 + (gx * sun_xy[0] - gy * sun_xy[1]) * 7.0 * limb_px / 1320, 0.7, 1.2)
    # The satellite's own brightness carries the real texture of the cloud tops.
    texture = 0.5 + 0.54 * smoothstep(0.45, 1.0, vis_px)
    cloud_light = (0.05 + 1.0 * np.clip((sun_flat + 0.1) / 1.1, 0, 1) ** 0.8) * tops * texture
    cloud_color = (
        np.clip(cloud_light, 0, 1.4)[..., None] * np.array([0.98, 0.99, 1.0], dtype=np.float32)
        + (0.5 * haze)[..., None] * ATMOSPHERE * daylight[..., None]
    )

    # Shadows fall away from the sun, offset by the cloud height at this scale.
    shadow_offset = -sun_xy * 0.0035 * scale
    shadow = ndimage.shift(density, (shadow_offset[1], -shadow_offset[0]), order=1, mode="nearest")
    shadow = ndimage.gaussian_filter(shadow, 1.6 * SUPERSAMPLE * size_scale) * 0.5 * daylight

    # Outside the disc: a tight bright rim and a wide faint glow, brighter on the sunlit side.
    outside = np.maximum(radius - 1, 0)
    rim_angle = (u * SUN[0] + v * SUN[1]) / np.maximum(radius, 1e-3)
    lit_rim = 0.25 + 0.75 * smoothstep(-0.55, 0.45, rim_angle / np.linalg.norm(SUN[:2]))
    glow = (0.95 * np.exp(-outside / 0.0065) + 0.34 * np.exp(-outside / 0.03) + 0.1 * np.exp(-outside / 0.1))
    # Gone by the top of the frame, or the image's edge shows as a line across the sky.
    glow = glow * lit_rim * smoothstep(VIEW["top"], VIEW["top"] - 0.1, v)
    # Inside the limb the same rim continues as a thin bright band.
    inner = np.exp(-np.maximum(1 - radius, 0) / 0.009) * lit_rim * 0.5

    coverage = np.clip((1 - radius) * scale + 0.5, 0, 1)
    disc = color + (inner * coverage)[..., None] * ATMOSPHERE
    disc = np.where(hit[..., None], disc, 0)
    disc = np.nan_to_num(disc)

    glow_rgb = glow[..., None] * ATMOSPHERE
    base_rgb = disc * coverage[..., None] + glow_rgb * (1 - coverage)[..., None]
    # Glow is light on black, so it becomes colour plus alpha over the starfield.
    glow_alpha = np.clip(np.max(glow_rgb, -1), 0, 1)
    base_alpha = coverage + (1 - coverage) * glow_alpha
    base_srgb = to_srgb(base_rgb / np.maximum(base_alpha, 1e-3)[..., None])

    cloud_alpha = 1 - (1 - density) * (1 - shadow)
    cloud_rgb = cloud_color * (density / np.maximum(cloud_alpha, 1e-3))[..., None]
    cloud_srgb = to_srgb(cloud_rgb)
    # Drop the faintest wisps, which cost more bytes than they add, and flatten colour where
    # nothing shows so it doesn't either.
    cloud_alpha = cloud_alpha * coverage * hit * smoothstep(0.02, 0.09, cloud_alpha)
    cloud_srgb = np.where((cloud_alpha > 0.004)[..., None], cloud_srgb, 0.7)

    def pack(rgb, alpha):
        data = np.concatenate([np.clip(rgb, 0, 1), np.clip(alpha, 0, 1)[..., None]], -1)
        return Image.fromarray((np.nan_to_num(data) * 255 + 0.5).astype(np.uint8))

    size = (int(round(2 * VIEW["halfWidth"] * limb_px)), int(round((VIEW["top"] - VIEW["bottom"]) * limb_px)))
    base = pack(base_srgb, base_alpha).resize(size, Image.LANCZOS)
    clouds = pack(cloud_srgb, cloud_alpha).resize(size, Image.LANCZOS)
    return base, clouds


def sharpened(layer):
    """Restores the edge contrast that resizing and AVIF take off the terrain, leaving alpha alone."""
    rgb = layer.convert("RGB").filter(ImageFilter.UnsharpMask(radius=1.1, percent=45, threshold=2))
    rgb.putalpha(layer.getchannel("A"))
    return rgb


def base_avif(width):
    # Phones stop at 1800, and on a slow connection this file is what the page's largest paint
    # waits for, sharing the line with the page's scripts.
    return (72, "4:2:0") if width <= 1800 else (80, "4:4:4")


def clouds_avif(width):
    # Cloud detail lives in the alpha, which is most of what the bytes on this page pay for.
    return 60, "4:2:0"


def save(layer, name, out, avif, webp_quality, finish=lambda image: image):
    def resized(width):
        height = round(layer.height * width / layer.width)
        return finish(layer.resize((width, height), Image.LANCZOS))

    for width in WIDTHS:
        path = out / f"{name}-{width}.avif"
        quality, subsampling = avif(width)
        resized(width).save(path, quality=quality, speed=2, subsampling=subsampling)
        print(f"{path.name}: {path.stat().st_size // 1024} KB")
    for width in WEBP_WIDTHS:
        path = out / f"{name}-{width}.webp"
        resized(width).save(path, quality=webp_quality, method=6, alpha_quality=70)
        print(f"{path.name}: {path.stat().st_size // 1024} KB")


def main():
    nasa, gibs, out = (Path(p) for p in sys.argv[1:4])
    preview = "--preview" in sys.argv
    limb_px = 660 if preview else LIMB_PX
    base, clouds = render(limb_px, nasa, gibs)

    out.mkdir(parents=True, exist_ok=True)
    if preview:
        canvas = Image.new("RGBA", base.size, (5, 11, 24, 255))
        canvas.alpha_composite(base)
        canvas.alpha_composite(clouds)
        canvas.convert("RGB").save(out / "preview.jpg", quality=88)
        return

    save(base, "base", out, base_avif, 78, sharpened)
    save(clouds, "clouds", out, clouds_avif, 60)
    width, height = base.size
    view = {**VIEW, "width": width, "height": height}
    (out / "view.json").write_text(json.dumps(view, indent=2) + "\n")


if __name__ == "__main__":
    main()
