import { useGetRiskScores } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { AIAssistant } from "@/components/ai-assistant";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// Fix leaflet icon paths
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

const CORRIDORS = [
  { id: "hormuz", lat: 26.5, lng: 56.5 },
  { id: "redsea", lat: 12.6, lng: 43.3 },
  { id: "persian_gulf", lat: 26, lng: 52 },
];

const PORTS = [
  { id: "mumbai", name: "Mumbai Port", lat: 18.93, lng: 72.83 },
  { id: "kandla", name: "Kandla Port", lat: 23.0, lng: 70.2 },
  { id: "vizag", name: "Vizag Port", lat: 17.7, lng: 83.3 },
];

export default function GeospatialMap() {
  const { data: scores = [] } = useGetRiskScores();

  const getScoreColor = (score: number) => {
    if (score >= 70) return "#EF4444"; // destructive
    if (score >= 40) return "#F5A623"; // warning
    return "#10B981"; // success
  };

  return (
    <Layout>
      <div className="absolute inset-0 bg-background">
        <MapContainer 
          center={[20, 65]} 
          zoom={4} 
          className="w-full h-full z-0"
          zoomControl={false}
          style={{ background: '#0B0F1A' }}
        >
          {/* Dark themed map tiles */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {CORRIDORS.map(corridor => {
            const scoreData = scores.find(s => s.corridor === corridor.id);
            const score = scoreData?.currentScore || 0;
            const color = getScoreColor(score);
            
            return (
              <CircleMarker
                key={corridor.id}
                center={[corridor.lat, corridor.lng]}
                radius={24}
                fillColor={color}
                color={color}
                weight={2}
                opacity={0.8}
                fillOpacity={0.3}
              >
                <Popup className="bg-card border border-white/10 rounded-lg p-0 text-foreground custom-popup">
                  <div className="p-3 bg-card rounded-lg min-w-[200px]">
                    <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Risk Corridor</div>
                    <h3 className="font-bold text-base mb-2">{scoreData?.label || corridor.id}</h3>
                    <div className="flex items-center justify-between border-t border-white/10 pt-2 mt-2">
                      <span className="text-xs text-muted-foreground">Threat Score</span>
                      <span className="font-mono font-bold" style={{ color }}>{score} / 100</span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {PORTS.map(port => (
            <Marker key={port.id} position={[port.lat, port.lng]}>
              <Popup className="custom-popup">
                <div className="p-2 bg-card rounded min-w-[150px]">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1">Destination Node</div>
                  <h3 className="font-semibold text-sm text-foreground">{port.name}</h3>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <style>{`
          .leaflet-container {
            font-family: var(--font-sans);
          }
          .custom-popup .leaflet-popup-content-wrapper {
            background: hsl(var(--card));
            color: hsl(var(--foreground));
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          }
          .custom-popup .leaflet-popup-tip {
            background: hsl(var(--card));
            border-bottom: 1px solid rgba(255,255,255,0.1);
            border-right: 1px solid rgba(255,255,255,0.1);
          }
          .custom-popup .leaflet-popup-content {
            margin: 0;
            padding: 0;
          }
        `}</style>
      </div>
      <AIAssistant />
    </Layout>
  );
}
