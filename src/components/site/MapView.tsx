"use client";
import dynamic from "next/dynamic";
import type { MapPoint } from "./MapInner";

const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-[inherit] bg-sunk" aria-label="Cargando mapa" />,
});

export type { MapPoint };

export default function MapView(props: {
  points: MapPoint[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  mode?: "price" | "dot";
  zoom?: number;
  interactive?: boolean;
  className?: string;
}) {
  return (
    <div className={props.className ?? "h-80 w-full overflow-hidden rounded-[14px]"}>
      <MapInner {...props} />
    </div>
  );
}
