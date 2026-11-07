import view from "@/assets/earth/view.json";

export { view as earthView };

type Vector = [number, number, number];

const DEGREES = Math.PI / 180;

function latLonToVector(latitude: number, longitude: number): Vector {
  const lat = latitude * DEGREES;
  const lon = longitude * DEGREES;
  return [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
}

function dot(a: Vector, b: Vector): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** World axes of the camera, the same as `camera_basis` in scripts/render_earth_hero.py. */
function cameraBasis(): { right: Vector; up: Vector; toward: Vector } {
  const toward = latLonToVector(view.centerLat, view.centerLon);
  const lon = view.centerLon * DEGREES;
  const east: Vector = [-Math.sin(lon), Math.cos(lon), 0];
  const north: Vector = [
    toward[1] * east[2] - toward[2] * east[1],
    toward[2] * east[0] - toward[0] * east[2],
    toward[0] * east[1] - toward[1] * east[0],
  ];
  const roll = view.roll * DEGREES;
  const [sin, cos] = [Math.sin(roll), Math.cos(roll)];
  return {
    right: [0, 1, 2].map((i) => cos * east[i] + sin * north[i]) as Vector,
    up: [0, 1, 2].map((i) => -sin * east[i] + cos * north[i]) as Vector,
    toward,
  };
}

const basis = cameraBasis();

/** Earth's north axis in camera space, which is what the clouds turn around. */
export const earthAxis: Vector = [basis.right[2], basis.up[2], basis.toward[2]];

/**
 * Where a place sits in the Earth image, as 0-1 fractions of its width and height. Returns null
 * for the far side of the planet, since an image of this side can't show those places.
 */
export function projectToImage(
  latitude: number,
  longitude: number,
): { x: number; y: number } | null {
  const point = latLonToVector(latitude, longitude);
  const depth = dot(point, basis.toward);
  // The horizon seen from a finite distance is short of the 90-degree line.
  if (depth < 1 / view.distance) return null;
  const scale = Math.sqrt(view.distance ** 2 - 1) / (view.distance - depth);
  const u = dot(point, basis.right) * scale;
  const v = dot(point, basis.up) * scale;
  return {
    x: (u + view.halfWidth) / (2 * view.halfWidth),
    y: (view.top - v) / (view.top - view.bottom),
  };
}
