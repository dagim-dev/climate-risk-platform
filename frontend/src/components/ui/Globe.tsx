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

const TAU = Math.PI * 2;
const AUTO_SPIN = 0.0022;
const EASE = 0.06;

/** Globe rotation that brings a lat/lon to the front (from the cobe docs). */
function locationToAngles(latitude: number, longitude: number): [number, number] {
  return [Math.PI - ((longitude * Math.PI) / 180 - Math.PI / 2), (latitude * Math.PI) / 180];
}

function shortestTurn(from: number, to: number): number {
  return ((((to - from + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
}

function markersFor(focus: GlobeFocus | null | undefined): Marker[] {
  if (!focus) return EXAMPLE_MARKERS;
  return [
    ...EXAMPLE_MARKERS,
    { location: [focus.latitude, focus.longitude], size: 0.09, color: [1, 1, 1] },
  ];
}

/**
 * Decorative WebGL globe (cobe). It spins slowly, eases to `focus` when one is given, can be
 * dragged, pauses off screen and holds still for reduced motion. Without WebGL it shows a
 * static CSS sphere instead.
 */
export function Globe({ focus = null, className = "" }: GlobeProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<CobeGlobe | null>(null);
  const focusRef = useRef<GlobeFocus | null>(focus);

  useEffect(() => {
    focusRef.current = focus;
    globeRef.current?.update({ markers: markersFor(focus) });
  }, [focus]);

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
    let dragX: number | null = null;
    let dragDelta = 0;
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

    const render = () => {
      const target = focusRef.current;
      if (target) {
        const [targetPhi, targetTheta] = locationToAngles(target.latitude, target.longitude);
        phi += shortestTurn(phi, targetPhi + dragDelta) * EASE;
        theta += (Math.max(-0.6, Math.min(0.9, targetTheta)) - theta) * EASE;
      } else if (dragX === null && !reducedMotion) {
        phi += AUTO_SPIN;
      }
      // Resizing the canvas clears it, so only pass a size when it changed.
      globe.update({
        phi: target ? phi : phi + dragDelta,
        theta,
        ...(resized ? { width: size, height: size } : {}),
      });
      resized = false;
      wrapper.dataset.ready = "true";
      if (visible) frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    const resize = new ResizeObserver(() => {
      if (canvas.offsetWidth !== size) {
        size = canvas.offsetWidth;
        resized = true;
      }
    });
    resize.observe(canvas);

    const onScreen = new IntersectionObserver(([entry]) => {
      const wasVisible = visible;
      visible = entry.isIntersecting;
      if (visible && !wasVisible) frame = requestAnimationFrame(render);
    });
    onScreen.observe(canvas);

    const onPointerDown = (event: PointerEvent) => {
      dragX = event.clientX - dragDelta * 200;
      canvas.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (dragX !== null) dragDelta = (event.clientX - dragX) / 200;
    };
    const onPointerUp = () => {
      dragX = null;
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      onScreen.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      globe.destroy();
      globeRef.current = null;
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
        style={{ contain: "layout paint size", touchAction: "pan-y" }}
      />
    </div>
  );
}
