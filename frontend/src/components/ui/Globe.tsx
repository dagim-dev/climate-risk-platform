"use client";

import createGlobe, { type Globe as CobeGlobe, type Marker } from "cobe";
import { useEffect, useRef } from "react";

export interface GlobeFocus {
  latitude: number;
  longitude: number;
}

interface GlobeProps {
  /** Location to turn to and pin, e.g. the address that was just analyzed. */
  focus?: GlobeFocus | null;
  className?: string;
}

// The example-address cities, so the resting globe shows places a visitor can try.
const EXAMPLE_MARKERS: Marker[] = [
  { location: [29.95, -90.07], size: 0.035 },
  { location: [38.98, -76.49], size: 0.035 },
  { location: [34.24, -116.91], size: 0.035 },
  { location: [33.45, -112.07], size: 0.035 },
  { location: [43.07, -89.4], size: 0.035 },
];

// Amber (Tailwind amber-400), kept apart from the risk palette so the pin doesn't read as a score.
const PIN_COLOR: [number, number, number] = [0.98, 0.75, 0.14];
// cobe exposes `--cobe-focus` as a CSS anchor for the marker with this id.
const PIN_ID = "focus";

const TAU = Math.PI * 2;
const EASE = 0.06;
const SETTLED = 0.001;
// Pixels of drag per radian of rotation.
const DRAG_SPEED = 200;
// Tilt limit while dragging (about 69°), so the globe can't flip over a pole.
const THETA_LIMIT = 1.2;
// Tilt range when turning to a pin, so northern addresses still sit near the middle.
const FOCUS_THETA: [number, number] = [-0.6, 0.9];
// How long the globe waits after a drag before turning back to the pin.
const DRIFT_DELAY = 3000;

/** Globe rotation that brings a lat/lon to the front (from the cobe docs). */
function locationToAngles(latitude: number, longitude: number): [number, number] {
  return [Math.PI - ((longitude * Math.PI) / 180 - Math.PI / 2), (latitude * Math.PI) / 180];
}

function shortestTurn(from: number, to: number): number {
  return ((((to - from + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
}

function clamp(value: number, [min, max]: [number, number]): number {
  return Math.max(min, Math.min(max, value));
}

function markersFor(focus: GlobeFocus | null): Marker[] {
  if (!focus) return EXAMPLE_MARKERS;
  // With anchor positioning the HTML pin does the work, so the dot under it stays small.
  const anchored = CSS.supports("anchor-name: --a");
  return [
    ...EXAMPLE_MARKERS,
    {
      location: [focus.latitude, focus.longitude],
      size: anchored ? 0.05 : 0.09,
      color: PIN_COLOR,
      id: PIN_ID,
    },
  ];
}

/**
 * Decorative WebGL globe (cobe). It holds still until dragged (both axes, mouse or touch),
 * turns to `focus` when one is given and pins it, and drifts back to the pin a few seconds
 * after a drag. It only draws while something moves, pauses off screen and turns instantly
 * for reduced motion. Without WebGL it shows a static CSS sphere instead.
 */
export function Globe({ focus = null, className = "" }: GlobeProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<CobeGlobe | null>(null);
  const focusRef = useRef<GlobeFocus | null>(focus);
  const seekRef = useRef<(() => void) | null>(null);

  // Keyed on the numbers, since callers pass a fresh object on every render.
  const latitude = focus?.latitude ?? null;
  const longitude = focus?.longitude ?? null;

  useEffect(() => {
    const next = latitude === null || longitude === null ? null : { latitude, longitude };
    focusRef.current = next;
    globeRef.current?.update({ markers: markersFor(next) });
    seekRef.current?.();
  }, [latitude, longitude]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const small = window.matchMedia("(max-width: 640px)").matches;

    const probe = document.createElement("canvas");
    if (!probe.getContext("webgl2") && !probe.getContext("webgl")) {
      wrapper.dataset.fallback = "true";
      return;
    }

    // Start over North America.
    let [phi, theta] = locationToAngles(38, -96);
    theta = 0.3;
    // CSS pixels; cobe applies the device pixel ratio itself.
    let size = canvas.offsetWidth;
    let resized = false;
    let drag: { x: number; y: number; phi: number; theta: number } | null = null;
    let seeking = focusRef.current !== null;
    let idleTimer: number | undefined;
    let visible = true;
    let frame = 0;

    let globe: CobeGlobe;
    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: size,
        height: size,
        phi,
        theta,
        dark: 1,
        diffuse: 1.4,
        mapSamples: small ? 12000 : 20000,
        mapBrightness: 5.5,
        mapBaseBrightness: 0.04,
        baseColor: [0.11, 0.2, 0.34],
        markerColor: [0.22, 0.74, 0.97],
        glowColor: [0.2, 0.42, 0.72],
        markers: markersFor(focusRef.current),
      });
    } catch {
      wrapper.dataset.fallback = "true";
      return;
    }
    globeRef.current = globe;

    // cobe has no loop of its own (each update draws), so frames are only requested while
    // something changes: a drag, a turn to the pin or a resize.
    const draw = () => {
      frame = 0;
      if (!visible) return;
      const target = focusRef.current;
      if (seeking && !target) seeking = false;
      if (seeking && target) {
        const [targetPhi, targetTheta] = locationToAngles(target.latitude, target.longitude);
        const turn = shortestTurn(phi, targetPhi);
        const tilt = clamp(targetTheta, FOCUS_THETA) - theta;
        if (reducedMotion || (Math.abs(turn) < SETTLED && Math.abs(tilt) < SETTLED)) {
          phi += turn;
          theta += tilt;
          seeking = false;
        } else {
          phi += turn * EASE;
          theta += tilt * EASE;
        }
      }
      // Resizing the canvas clears it, so only pass a size when it changed.
      globe.update({ phi, theta, ...(resized ? { width: size, height: size } : {}) });
      resized = false;
      wrapper.dataset.ready = "true";
      if (seeking) requestRender();
    };
    const requestRender = () => {
      if (!frame && visible) frame = requestAnimationFrame(draw);
    };
    const startSeek = () => {
      window.clearTimeout(idleTimer);
      if (drag) return;
      seeking = true;
      requestRender();
    };
    seekRef.current = startSeek;
    requestRender();

    const resize = new ResizeObserver(() => {
      if (canvas.offsetWidth !== size) {
        size = canvas.offsetWidth;
        resized = true;
        requestRender();
      }
    });
    resize.observe(canvas);

    const onScreen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      requestRender();
    });
    onScreen.observe(canvas);

    const onPointerDown = (event: PointerEvent) => {
      drag = { x: event.clientX, y: event.clientY, phi, theta };
      seeking = false;
      window.clearTimeout(idleTimer);
      canvas.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!drag) return;
      phi = drag.phi + (event.clientX - drag.x) / DRAG_SPEED;
      theta = clamp(drag.theta + (event.clientY - drag.y) / DRAG_SPEED, [-THETA_LIMIT, THETA_LIMIT]);
      requestRender();
    };
    const onPointerUp = () => {
      if (!drag) return;
      drag = null;
      if (focusRef.current) idleTimer = window.setTimeout(startSeek, DRIFT_DELAY);
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(idleTimer);
      resize.disconnect();
      onScreen.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      globe.destroy();
      globeRef.current = null;
      seekRef.current = null;
    };
  }, []);

  return (
    <div ref={wrapperRef} className={`group relative aspect-square ${className}`} aria-hidden="true">
      {/* Atmosphere glow behind the sphere. */}
      <div className="absolute inset-[6%] rounded-full bg-brand-accent/20 blur-3xl" />
      {/* Static sphere: shown until the first WebGL frame, and instead of it without WebGL. */}
      <div className="absolute inset-[4%] rounded-full bg-[radial-gradient(circle_at_35%_30%,#1f6fb2_0%,#123a6b_45%,#071a36_75%)] shadow-[inset_-24px_-24px_60px_rgb(0_0_0/0.55),0_0_60px_rgb(56_189_248/0.25)] transition-opacity duration-1000 group-data-[ready=true]:opacity-0" />
      <canvas
        ref={canvasRef}
        className="relative h-full w-full cursor-grab opacity-0 transition-opacity duration-1000 active:cursor-grabbing group-data-[fallback=true]:hidden group-data-[ready=true]:opacity-100"
        style={{ contain: "layout paint size", touchAction: "none" }}
      />
      {/* Address pin, tied to cobe's marker anchor (styles in globals.css). Kept last and always
          mounted: cobe moves the canvas into a wrapper of its own, which React doesn't know about. */}
      <div className={`globe-pin ${focus ? "" : "hidden"}`}>
        <span className="globe-pin-pulse" />
        <svg viewBox="0 0 24 32" className="relative h-9 w-7 drop-shadow-[0_2px_4px_rgb(0_0_0/0.5)]">
          <path
            d="M12 1C6.2 1 1.5 5.6 1.5 11.4c0 7.5 9 18.3 9.6 19a1.2 1.2 0 0 0 1.8 0c.6-.7 9.6-11.5 9.6-19C22.5 5.6 17.8 1 12 1z"
            fill="#fbbf24"
            stroke="#0a1428"
            strokeWidth="1.5"
          />
          <circle cx="12" cy="11.2" r="4" fill="#fff" />
        </svg>
      </div>
    </div>
  );
}
