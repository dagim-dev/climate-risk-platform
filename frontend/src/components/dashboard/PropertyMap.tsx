"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Verdict } from "@/types/risk";

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  address: string;
  verdict: Verdict;
  overallScore: number;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

const FEMA_NFHL_URL =
  "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query";

const VERDICT_COLORS: Record<Verdict, string> = {
  Go: "#22c55e",
  Caution: "#f59e0b",
  Avoid: "#ef4444",
};

async function fetchFloodZonePolygons(
  lat: number,
  lng: number,
): Promise<GeoJSON.FeatureCollection | null> {
  const buffer = 0.015;
  const envelope = `${lng - buffer},${lat - buffer},${lng + buffer},${lat + buffer}`;

  const params = new URLSearchParams({
    where: "1=1",
    geometry: envelope,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    outSR: "4326",
    outFields: "FLD_ZONE,ZONE_SUBTY",
    returnGeometry: "true",
    f: "geojson",
  });

  try {
    const res = await fetch(`${FEMA_NFHL_URL}?${params.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.type === "FeatureCollection") return data as GeoJSON.FeatureCollection;
    return null;
  } catch {
    return null;
  }
}

function floodZoneColor(zone: string): string {
  switch (zone) {
    case "A":
    case "AE":
    case "AH":
    case "AO":
    case "V":
    case "VE":
      return "rgba(30, 100, 200, 0.35)";
    case "X":
      return "rgba(180, 180, 180, 0.2)";
    default:
      return "rgba(100, 100, 100, 0.15)";
  }
}

export function PropertyMap({
  latitude,
  longitude,
  address,
  verdict,
  overallScore,
}: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [longitude, latitude],
      zoom: 13,
      attributionControl: true,
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    const markerEl = document.createElement("div");
    markerEl.style.width = "28px";
    markerEl.style.height = "28px";
    markerEl.style.borderRadius = "50%";
    markerEl.style.backgroundColor = VERDICT_COLORS[verdict];
    markerEl.style.border = "3px solid white";
    markerEl.style.boxShadow = "0 2px 6px rgba(0,0,0,0.35)";
    markerEl.style.cursor = "pointer";

    const popup = new mapboxgl.Popup({ offset: 20, closeButton: false }).setHTML(
      `<div style="font-family:system-ui,sans-serif;padding:4px 0">
        <strong style="font-size:13px">${address}</strong>
        <div style="margin-top:4px;font-size:12px;color:#555">
          Risk Score: <strong>${overallScore}/100</strong> &middot;
          <span style="color:${VERDICT_COLORS[verdict]};font-weight:600">${verdict}</span>
        </div>
      </div>`,
    );

    new mapboxgl.Marker({ element: markerEl })
      .setLngLat([longitude, latitude])
      .setPopup(popup)
      .addTo(map);

    map.on("load", async () => {
      const floodData = await fetchFloodZonePolygons(latitude, longitude);
      if (!floodData || floodData.features.length === 0) return;

      for (const feature of floodData.features) {
        if (feature.properties) {
          feature.properties._fillColor = floodZoneColor(
            feature.properties.FLD_ZONE ?? "",
          );
        }
      }

      map.addSource("fema-flood-zones", {
        type: "geojson",
        data: floodData,
      });

      map.addLayer({
        id: "flood-zone-fill",
        type: "fill",
        source: "fema-flood-zones",
        paint: {
          "fill-color": ["get", "_fillColor"],
          "fill-opacity": 0.6,
        },
      });

      map.addLayer({
        id: "flood-zone-outline",
        type: "line",
        source: "fema-flood-zones",
        paint: {
          "line-color": "#3b82f6",
          "line-width": 1,
          "line-opacity": 0.7,
        },
      });

      const legendSource = map.getSource("fema-flood-zones");
      if (legendSource && "getClusterExpansionZoom" in legendSource === false) {
        map.on("click", "flood-zone-fill", (e) => {
          const props = e.features?.[0]?.properties;
          if (!props) return;

          new mapboxgl.Popup({ closeButton: true })
            .setLngLat(e.lngLat)
            .setHTML(
              `<div style="font-family:system-ui,sans-serif;padding:4px 0">
                <strong style="font-size:13px">FEMA Flood Zone ${props.FLD_ZONE ?? "N/A"}</strong>
                ${props.ZONE_SUBTY ? `<div style="font-size:12px;color:#555;margin-top:2px">${props.ZONE_SUBTY}</div>` : ""}
              </div>`,
            )
            .addTo(map);
        });

        map.on("mouseenter", "flood-zone-fill", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "flood-zone-fill", () => {
          map.getCanvas().style.cursor = "";
        });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, address, verdict, overallScore]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-sm text-zinc-500">
        Map unavailable — set <code className="mx-1 rounded bg-zinc-200 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> in your environment.
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-brand-primary">Property Map</h3>
      <div
        ref={containerRef}
        className="h-[400px] w-full overflow-hidden rounded-lg border border-zinc-200 shadow-sm"
      />
      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
        <span className="font-medium">FEMA Flood Zones:</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: "rgba(30,100,200,0.5)" }} />
          High Risk (A/AE/V/VE)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: "rgba(180,180,180,0.4)" }} />
          Minimal Risk (X)
        </span>
      </div>
    </section>
  );
}
