"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { useTheme } from "next-themes";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Fix broken Leaflet default icon paths with Webpack ───────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Job {
  id: string;
  jobNumber: string;
  title: string;
  location: string;
  status: string;
  priority: string;
  coordinates: { lat: number; lng: number } | null;
  technician?: { name: string; initials: string } | null;
}

export interface InteractiveMapRef {
  flyTo: (lat: number, lng: number) => void;
}

// ─── Priority / Status colours ────────────────────────────────────────────────

const PRIORITY_COLOR: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

const STATUS_LABEL: Record<string, string> = {
  unassigned: "Unassigned",
  in_progress: "In Progress",
  offline_syncing: "Offline Syncing",
  needs_ai_review: "Needs AI Review",
  completed: "Completed",
};

// ─── Custom SVG marker ────────────────────────────────────────────────────────

function createMarkerIcon(color: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
      <defs>
        <filter id="shadow" x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>
      <ellipse cx="16" cy="39" rx="6" ry="3" fill="rgba(0,0,0,0.25)"/>
      <path d="M16 2C9.373 2 4 7.373 4 14c0 9 12 26 12 26S28 23 28 14C28 7.373 22.627 2 16 2z"
            fill="${color}" filter="url(#shadow)"/>
      <circle cx="16" cy="14" r="5" fill="white" opacity="0.9"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -44],
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface InteractiveMapProps {
  jobs: Job[];
  onJobClick?: (job: Job) => void;
  userLocation?: { lat: number; lng: number };
}

const InteractiveMap = forwardRef<InteractiveMapRef, InteractiveMapProps>(
  ({ jobs, onJobClick, userLocation }, ref) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const tileLayerRef = useRef<L.TileLayer | null>(null);
    const markersRef = useRef<Map<string, L.Marker>>(new Map());
    const userMarkerRef = useRef<L.Marker | null>(null);
    const { resolvedTheme } = useTheme();

    // Expose flyTo to parent via ref
    useImperativeHandle(ref, () => ({
      flyTo(lat: number, lng: number) {
        mapRef.current?.flyTo([lat, lng], 15, { animate: true, duration: 1.2 });
      },
    }));

    useEffect(() => {
      if (!mapContainerRef.current || mapRef.current) return;

      // ── Initialise map ──
      const map = L.map(mapContainerRef.current, {
        center: [40.7282, -73.9941],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      mapRef.current = map;

      // ── Tile layer (CartoDB) ──
      const tiles = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19,
        }
      ).addTo(map);
      tileLayerRef.current = tiles;

      // ── Custom zoom control (bottom-right) ──
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // ── Attribution (bottom-left, minimal) ──
      L.control.attribution({ position: "bottomleft", prefix: false }).addTo(map);

      return () => {
        map.remove();
        mapRef.current = null;
        tileLayerRef.current = null;
        markersRef.current.clear();
        userMarkerRef.current = null;
      };
    }, []);

    // ── Update tiles on theme change ──
    useEffect(() => {
      if (tileLayerRef.current) {
        const url = resolvedTheme === "light"
          ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
        tileLayerRef.current.setUrl(url);
      }
    }, [resolvedTheme]);

    // ── Add/update user marker ──
    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;

      // Remove existing user marker if any
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }

      if (userLocation) {
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
          icon: L.divIcon({
            html: `
              <div style="position:relative;width:24px;height:24px;">
                <div style="position:absolute;inset:0;background:#0ea5e9;border-radius:50%;opacity:0.4;animation:pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
                <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:12px;height:12px;background:#0ea5e9;border:2px solid white;border-radius:50%;box-shadow:0 0 10px rgba(14,165,233,0.8);"></div>
              </div>
            `,
            className: "",
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
          zIndexOffset: 1000,
        }).addTo(map);

        // Auto-fly to user location when the prop arrives
        map.flyTo([userLocation.lat, userLocation.lng], 14, { animate: true, duration: 1.5 });
      }
    }, [userLocation]);

    // ── Add/update markers when jobs change ──
    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;

      // Remove old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();

      const isLight = resolvedTheme === "light";

      jobs.forEach((job) => {
        if (!job.coordinates) return;
        const { lat, lng } = job.coordinates;

        const color = PRIORITY_COLOR[job.priority] ?? "#6366f1";
        const marker = L.marker([lat, lng], { icon: createMarkerIcon(color) });

        // ── Glass popup ──
        const techName = job.technician?.name ?? "Unassigned";
        const statusLabel = STATUS_LABEL[job.status] ?? job.status;
        const priorityBadge = `
          <span style="
            background:${color}22;color:${color};border:1px solid ${color}55;
            border-radius:99px;padding:2px 8px;font-size:10px;font-weight:700;
            text-transform:uppercase;letter-spacing:0.04em;">
            ${job.priority}
          </span>`;

        const popupHTML = `
          <div style="
            font-family: system-ui,-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;
            min-width:220px;padding:0;border-radius:14px;overflow:hidden;">
            <div style="padding:12px 14px 8px;">
              <div style="font-size:11px;color:${isLight ? '#64748b' : '#94a3b8'};margin-bottom:4px;">${job.jobNumber}</div>
              <h3 style="font-size:14px;font-weight:700;color:${isLight ? '#0f172a' : '#ffffff'};margin:0 0 6px;line-height:1.2;">
                ${job.title}
              </h3>
              <div style="font-size:12px;color:${isLight ? '#475569' : '#cbd5e1'};margin-bottom:12px;display:flex;align-items:center;gap:4px;">
                <span style="opacity:0.7;">📍</span> ${job.location}
              </div>
              <div style="display:flex;gap:6px;margin-bottom:12px;">
                ${priorityBadge}
                <span style="
                  background:rgba(148,163,184,0.1);color:${isLight ? '#475569' : '#94a3b8'};border:1px solid rgba(148,163,184,0.2);
                  border-radius:99px;padding:2px 8px;font-size:10px;font-weight:600;
                  text-transform:uppercase;letter-spacing:0.04em;">
                  ${statusLabel}
                </span>
              </div>
            </div>
            <div style="
              background:${isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'};
              border-top:1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'};
              padding:10px 14px;display:flex;align-items:center;justify-content:space-between;">
              <div style="display:flex;align-items:center;gap:6px;">
                <div style="width:20px;height:20px;border-radius:10px;background:rgba(99,102,241,0.2);display:flex;align-items:center;justify-content:center;color:#6366f1;font-size:9px;font-weight:700;">
                  ${job.technician?.initials ?? "?"}
                </div>
                <span style="font-size:12px;font-weight:500;color:${isLight ? '#334155' : '#94a3b8'};">${techName}</span>
              </div>
            </div>
          </div>`;

        marker.bindPopup(L.popup({
          className: "atlas-glass-popup",
          maxWidth: 280,
          offset: [0, 0],
        }).setContent(popupHTML));

        marker.on("click", () => onJobClick?.(job));
        marker.addTo(map);
        markersRef.current.set(job.id, marker);
      });
    }, [jobs, onJobClick]);

    return (
      <div
        ref={mapContainerRef}
        style={{ width: "100%", height: "100%", background: "#05050f" }}
      />
    );
  }
);

InteractiveMap.displayName = "InteractiveMap";
export default InteractiveMap;
