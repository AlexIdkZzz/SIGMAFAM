import React from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";

export default function MiniMap({ lat, lng }) {
  const center = [lat, lng];

  return (
    <div className="h-[180px] rounded-xl overflow-hidden border border-slate-200">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center} />
      </MapContainer>
    </div>
  );
}