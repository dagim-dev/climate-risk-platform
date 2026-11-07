"use client";

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import base1200Avif from "@/assets/earth/base-1200.avif";
import base1200Webp from "@/assets/earth/base-1200.webp";
import base1800Avif from "@/assets/earth/base-1800.avif";
import base2500Avif from "@/assets/earth/base-2500.avif";
import base2500Webp from "@/assets/earth/base-2500.webp";
import base4200Avif from "@/assets/earth/base-4200.avif";
import base5200Avif from "@/assets/earth/base-5200.avif";
import clouds1200Avif from "@/assets/earth/clouds-1200.avif";
import clouds1200Webp from "@/assets/earth/clouds-1200.webp";
import clouds1800Avif from "@/assets/earth/clouds-1800.avif";
import clouds2500Avif from "@/assets/earth/clouds-2500.avif";
import clouds2500Webp from "@/assets/earth/clouds-2500.webp";
import clouds4200Avif from "@/assets/earth/clouds-4200.avif";
import clouds5200Avif from "@/assets/earth/clouds-5200.avif";
import { startCloudDrift } from "@/lib/earth-clouds";
import { earthView, projectToImage } from "@/lib/earth-view";

export interface EarthFocus {
  latitude: number;
  longitude: number;
}

interface EarthHeroProps {
  /** Location to pin, e.g. the address that was just analyzed. */
  focus?: EarthFocus | null;
  /** The panels over the Earth on large screens. It slides if a pin would land under either. */
  leftPanelRef: RefObject<HTMLElement | null>;
  rightPanelRef: RefObject<HTMLElement | null>;
}

interface LayerSources {
  avif: { phone: string; other: string };
  webp: string;
  fallback: string;
}

const BASE: LayerSources = {
  avif: {
    // Phones stop at 1800, which is 2x at this size. The 2500 adds over a second of download and
    // decoding to the page's largest paint on a slow phone.
    phone: `${base1200Avif.src} 1200w, ${base1800Avif.src} 1800w`,
    other: `${base1800Avif.src} 1800w, ${base2500Avif.src} 2500w, ${base4200Avif.src} 4200w, ${base5200Avif.src} 5200w`,
  },
  webp: `${base1200Webp.src} 1200w, ${base2500Webp.src} 2500w`,
  fallback: base2500Webp.src,
};

const CLOUDS: LayerSources = {
  avif: {
    phone: `${clouds1200Avif.src} 1200w, ${clouds1800Avif.src} 1800w`,
    other: `${clouds1800Avif.src} 1800w, ${clouds2500Avif.src} 2500w, ${clouds4200Avif.src} 4200w, ${clouds5200Avif.src} 5200w`,
  },
  webp: `${clouds1200Webp.src} 1200w, ${clouds2500Webp.src} 2500w`,
  fallback: clouds2500Webp.src,
};

// Rendered width of the image; keep in step with --earth-radius in globals.css.
const SIZES = "(min-width: 1024px) min(137vw, calc(237.6vh - 152px)), min(232vw, 1267px)";
const LARGE_SCREEN = "(min-width: 1024px)";
const PHONE = "(max-width: 639px)";

const STAGE_STYLE: CSSProperties = {
  width: `calc(var(--earth-radius) * ${2 * earthView.halfWidth})`,
  aspectRatio: `${earthView.width} / ${earthView.height}`,
};

// The dark disc shown until the image arrives, in percentages of the image.
const PLACEHOLDER_STYLE: CSSProperties = {
  left: `${(100 * (earthView.halfWidth - 1)) / (2 * earthView.halfWidth)}%`,
  top: `${(100 * (earthView.top - 1)) / (earthView.top - earthView.bottom)}%`,
  width: `${100 / earthView.halfWidth}%`,
};

const PIN_MARGIN = 16;
// Half the pin's pulse plus some air, so it doesn't touch a panel.
const PANEL_MARGIN = 36;
// Room for the pin above its tip, so it doesn't touch the copy or the header.
const PIN_HEIGHT = 44;

function LayerImage({
  sources,
  alt = "",
  imgRef,
  priority = false,
  className = "",
  onLoad,
}: {
  sources: LayerSources;
  alt?: string;
  imgRef?: RefObject<HTMLImageElement | null>;
  priority?: boolean;
  className?: string;
  onLoad?: () => void;
}) {
  return (
    <picture>
      <source type="image/avif" media={PHONE} srcSet={sources.avif.phone} sizes={SIZES} />
      <source type="image/avif" srcSet={sources.avif.other} sizes={SIZES} />
      <source type="image/webp" srcSet={sources.webp} sizes={SIZES} />
      <img
        ref={imgRef}
        src={sources.fallback}
        alt={alt}
        width={earthView.width}
        height={earthView.height}
        decoding="async"
        fetchPriority={priority ? "high" : "low"}
        onLoad={onLoad}
        className={`absolute inset-0 h-full w-full ${className}`}
      />
    </picture>
  );
}

/**
 * Photorealistic Earth rising from the bottom of the hero, framed on the U.S. It's a baked image
 * (scripts/render_earth_hero.py), so it costs a download rather than a render, and the page works
 * with it missing. The clouds wait for the surface to be on screen: they're the heavier file, and
 * loading both at once makes a slow connection wait for the whole planet. Where motion is welcome, a small WebGL canvas takes over the cloud layer and
 * drifts it. Without WebGL or with reduced motion the still clouds stay. Decorative: everything
 * it shows is stated in the copy, and the pin repeats the address already on the page.
 */
export function EarthHero({ focus = null, leftPanelRef, rightPanelRef }: EarthHeroProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const baseImageRef = useRef<HTMLImageElement>(null);
  const cloudImageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [surfaceReady, setSurfaceReady] = useState(false);
  const [cloudsLoaded, setCloudsLoaded] = useState(false);
  const [drifting, setDrifting] = useState(false);

  const latitude = focus?.latitude ?? null;
  const longitude = focus?.longitude ?? null;
  const pin =
    latitude === null || longitude === null ? null : projectToImage(latitude, longitude);
  const pinX = pin?.x ?? null;
  const pinY = pin?.y ?? null;

  useEffect(() => {
    let cancelled = false;
    const showClouds = () => {
      if (!cancelled) setSurfaceReady(true);
    };
    // Also settles if the image finished before hydration. Clouds still come if it failed.
    baseImageRef.current?.decode().then(showClouds, showClouds);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const image = cloudImageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let stop: (() => void) | null = null;
    // Runs after the images have painted: the drift should never compete with the page load.
    const begin = () => {
      image
        .decode()
        .then(() => {
          // The file the browser picked, without its srcset (see startCloudDrift).
          const clouds = new Image();
          clouds.src = image.currentSrc;
          return clouds.decode().then(() => clouds);
        })
        .then((clouds) => {
          if (cancelled) return;
          stop = startCloudDrift(canvas, clouds, {
            onReady: () => setDrifting(true),
            onLost: () => setDrifting(false),
          });
        })
        .catch(() => {
          // The still clouds stay, or there are none if the image failed.
        });
    };
    const idle =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(begin, { timeout: 2000 })
        : window.setTimeout(begin, 500);

    return () => {
      cancelled = true;
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      stop?.();
    };
  }, [surfaceReady]);

  // A pin can be under a panel (the coasts on a small laptop) or out of frame (Alaska, Hawaii,
  // Puerto Rico), so the Earth slides just far enough to bring it into the clear.
  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const leftPanel = leftPanelRef.current;
    const rightPanel = rightPanelRef.current;
    if (!root || !leftPanel || !rightPanel) return;
    const place = () => {
      if (pinX === null || pinY === null || !stage) {
        root.style.setProperty("--earth-pan-x", "0px");
        root.style.setProperty("--earth-pan-y", "0px");
        return;
      }
      // Offsets, because a measured box would include a slide still in progress.
      const origin = root.getBoundingClientRect();
      const x = origin.left + stage.offsetLeft + stage.offsetWidth * (pinX - 0.5);
      const y = origin.top + stage.offsetTop + stage.offsetHeight * pinY;

      // The clear area: between the panels on large screens, the gap in the copy on small ones.
      const sideBySide = window.matchMedia(LARGE_SCREEN).matches;
      const frame = (sideBySide ? root : (root.parentElement ?? root)).getBoundingClientRect();
      const left = sideBySide
        ? leftPanel.getBoundingClientRect().right + PANEL_MARGIN
        : PIN_MARGIN;
      const right = sideBySide
        ? rightPanel.getBoundingClientRect().left - PANEL_MARGIN
        : window.innerWidth - PIN_MARGIN;
      const top = frame.top + PIN_HEIGHT;
      const bottom = frame.bottom - PIN_MARGIN;
      const nextX = x < left ? left - x : x > right ? right - x : 0;
      const nextY = y < top ? top - y : y > bottom ? bottom - y : 0;
      root.style.setProperty("--earth-pan-x", `${nextX}px`);
      root.style.setProperty("--earth-pan-y", `${nextY}px`);
    };
    place();
    const resize = new ResizeObserver(place);
    resize.observe(root);
    resize.observe(leftPanel);
    resize.observe(rightPanel);
    return () => resize.disconnect();
  }, [pinX, pinY, leftPanelRef, rightPanelRef]);

  return (
    <div ref={rootRef} className="earth-hero" aria-hidden="true">
      <div ref={stageRef} className="earth-stage" style={STAGE_STYLE}>
        <div className="earth-placeholder" style={PLACEHOLDER_STYLE} />
        <LayerImage sources={BASE} imgRef={baseImageRef} priority />
        {surfaceReady && (
          <LayerImage
            sources={CLOUDS}
            imgRef={cloudImageRef}
            onLoad={() => setCloudsLoaded(true)}
            className={`transition-opacity duration-700 ${cloudsLoaded ? "" : "opacity-0"} ${
              drifting ? "invisible" : ""
            }`}
          />
        )}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full ${drifting ? "" : "invisible"}`}
        />
      </div>
      <div className="earth-scrim" />
      {/* Above the scrim, so a pin keeps its colour. */}
      <div className="earth-stage" style={STAGE_STYLE}>
        {pinX !== null && pinY !== null && (
          <div className="earth-pin" style={{ left: `${pinX * 100}%`, top: `${pinY * 100}%` }}>
            <span className="earth-pin-pulse" />
            <svg
              viewBox="0 0 24 32"
              className="relative h-9 w-7 drop-shadow-[0_2px_4px_rgb(0_0_0/0.5)]"
            >
              <path
                d="M12 1C6.2 1 1.5 5.6 1.5 11.4c0 7.5 9 18.3 9.6 19a1.2 1.2 0 0 0 1.8 0c.6-.7 9.6-11.5 9.6-19C22.5 5.6 17.8 1 12 1z"
                fill="#fbbf24"
                stroke="#0a1428"
                strokeWidth="1.5"
              />
              <circle cx="12" cy="11.2" r="4" fill="#fff" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
