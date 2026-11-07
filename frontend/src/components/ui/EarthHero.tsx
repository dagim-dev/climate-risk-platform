"use client";

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import base1200Avif from "@/assets/earth/base-1200.avif";
import base1200Webp from "@/assets/earth/base-1200.webp";
import base2200Avif from "@/assets/earth/base-2200.avif";
import base2200Webp from "@/assets/earth/base-2200.webp";
import base3400Avif from "@/assets/earth/base-3400.avif";
import clouds1200Avif from "@/assets/earth/clouds-1200.avif";
import clouds1200Webp from "@/assets/earth/clouds-1200.webp";
import clouds2200Avif from "@/assets/earth/clouds-2200.avif";
import clouds2200Webp from "@/assets/earth/clouds-2200.webp";
import { startCloudDrift } from "@/lib/earth-clouds";
import { earthView, projectToImage } from "@/lib/earth-view";

export interface EarthFocus {
  latitude: number;
  longitude: number;
}

interface EarthHeroProps {
  /** Location to pin, e.g. the address that was just analyzed. */
  focus?: EarthFocus | null;
  /** The hero copy. On large screens the Earth slides over if a pin would land under it. */
  avoidRef: RefObject<HTMLElement | null>;
}

interface LayerSources {
  avif: { small: string; large: string };
  webp: string;
  fallback: string;
}

const BASE: LayerSources = {
  avif: {
    small: `${base1200Avif.src} 1200w, ${base2200Avif.src} 2200w`,
    large: `${base2200Avif.src} 2200w, ${base3400Avif.src} 3400w`,
  },
  webp: `${base1200Webp.src} 1200w, ${base2200Webp.src} 2200w`,
  fallback: base2200Webp.src,
};

const CLOUDS: LayerSources = {
  avif: {
    small: `${clouds1200Avif.src} 1200w`,
    large: `${clouds2200Avif.src} 2200w`,
  },
  webp: `${clouds1200Webp.src} 1200w, ${clouds2200Webp.src} 2200w`,
  fallback: clouds2200Webp.src,
};

// Rendered width of the image; keep in step with --earth-radius in globals.css. Small screens
// never get the largest files, however dense the display: at that size nobody could tell.
const SIZES = "(min-width: 1024px) 137vw, min(232vw, 1267px)";
const LARGE_SCREEN = "(min-width: 1024px)";

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
// Room for the pin above its tip, so it doesn't touch the copy or the header.
const PIN_HEIGHT = 44;

function LayerImage({
  sources,
  alt = "",
  imgRef,
  priority = false,
  className = "",
}: {
  sources: LayerSources;
  alt?: string;
  imgRef?: RefObject<HTMLImageElement | null>;
  priority?: boolean;
  className?: string;
}) {
  return (
    <picture>
      <source type="image/avif" media={LARGE_SCREEN} srcSet={sources.avif.large} sizes={SIZES} />
      <source type="image/avif" srcSet={sources.avif.small} sizes={SIZES} />
      <source type="image/webp" srcSet={sources.webp} sizes={SIZES} />
      <img
        ref={imgRef}
        src={sources.fallback}
        alt={alt}
        width={earthView.width}
        height={earthView.height}
        decoding="async"
        fetchPriority={priority ? "high" : "low"}
        className={`absolute inset-0 h-full w-full ${className}`}
      />
    </picture>
  );
}

/**
 * Photorealistic Earth rising from the bottom of the hero, framed on the U.S. It's a baked image
 * (scripts/render_earth_hero.py), so it costs a download rather than a render, and the page works
 * with it missing. Where motion is welcome, a small WebGL canvas takes over the cloud layer and
 * drifts it. Without WebGL or with reduced motion the still clouds stay. Decorative: everything
 * it shows is stated in the copy, and the pin repeats the address already on the page.
 */
export function EarthHero({ focus = null, avoidRef }: EarthHeroProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cloudImageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drifting, setDrifting] = useState(false);

  const latitude = focus?.latitude ?? null;
  const longitude = focus?.longitude ?? null;
  const pin =
    latitude === null || longitude === null ? null : projectToImage(latitude, longitude);
  const pinX = pin?.x ?? null;
  const pinY = pin?.y ?? null;

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
          if (cancelled) return;
          stop = startCloudDrift(canvas, image, {
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
  }, []);

  // A pin can be under the copy (the West Coast on a small laptop) or out of frame (Alaska,
  // Hawaii, Puerto Rico), so the Earth slides just far enough to bring it into the clear.
  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root) return;
    const place = () => {
      const copy = avoidRef.current;
      if (pinX === null || pinY === null || !stage || !copy) {
        root.style.setProperty("--earth-pan-x", "0px");
        root.style.setProperty("--earth-pan-y", "0px");
        return;
      }
      // Offsets, because a measured box would include a slide still in progress.
      const origin = root.getBoundingClientRect();
      const x = origin.left + stage.offsetLeft + stage.offsetWidth * (pinX - 0.5);
      const y = origin.top + stage.offsetTop + stage.offsetHeight * pinY;

      // The clear area: right of the copy on large screens, the gap in it on small ones.
      const sideBySide = window.matchMedia(LARGE_SCREEN).matches;
      const frame = (sideBySide ? root : (root.parentElement ?? root)).getBoundingClientRect();
      const left = (sideBySide ? copy.getBoundingClientRect().right : 0) + PIN_MARGIN;
      const right = window.innerWidth - PIN_MARGIN;
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
    return () => resize.disconnect();
  }, [pinX, pinY, avoidRef]);

  return (
    <div ref={rootRef} className="earth-hero" aria-hidden="true">
      <div ref={stageRef} className="earth-stage" style={STAGE_STYLE}>
        <div className="earth-placeholder" style={PLACEHOLDER_STYLE} />
        <LayerImage sources={BASE} priority />
        <LayerImage
          sources={CLOUDS}
          imgRef={cloudImageRef}
          className={drifting ? "invisible" : ""}
        />
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
