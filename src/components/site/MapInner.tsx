"use client";
import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
  off?: boolean;
}

function Fit({ points, zoom }: { points: MapPoint[]; zoom?: number }) {
  const map = useMap();
  const key = points.map((p) => p.id).join(",");
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1 || zoom) {
      map.setView([points[0].lat, points[0].lng], zoom ?? 15, { animate: false });
      return;
    }
    map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])), { padding: [40, 40], maxZoom: 14, animate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

export default function MapInner({
  points,
  activeId,
  onSelect,
  mode = "price",
  zoom,
  interactive = true,
}: {
  points: MapPoint[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  mode?: "price" | "dot";
  zoom?: number;
  interactive?: boolean;
}) {
  const icons = useMemo(
    () =>
      points.map((p) =>
        L.divIcon({
          className: "",
          iconSize: [0, 0],
          html:
            mode === "dot"
              ? `<span class="dot-pin ${p.off ? "is-off" : ""}"></span>`
              : `<span class="price-pin ${p.id === activeId ? "is-on" : ""} ${p.off ? "is-off" : ""}">${p.label}</span>`,
        }),
      ),
    [points, activeId, mode],
  );
  const center: [number, number] = points.length ? [points[0].lat, points[0].lng] : [20.6597, -103.3496];
  return (
    <MapContainer
      center={center}
      zoom={zoom ?? 11}
      scrollWheelZoom={false}
      dragging={interactive}
      zoomControl={interactive}
      doubleClickZoom={interactive}
      attributionControl
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        attribution="Mapa base &copy; Esri, HERE, Garmin, &copy; colaboradores de OpenStreetMap"
        maxZoom={16}
      />
      <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}" maxZoom={16} />
      <Fit points={points} zoom={zoom} />
      {points.map((p, i) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={icons[i]}
          zIndexOffset={p.id === activeId ? 1000 : p.off ? -100 : 0}
          eventHandlers={onSelect ? { click: () => onSelect(p.id) } : undefined}
          keyboard={false}
        />
      ))}
    </MapContainer>
  );
}
