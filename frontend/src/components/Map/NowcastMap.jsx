import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, ImageOverlay, useMap } from 'react-leaflet';
import L from 'leaflet';
import { dbzToColor } from './RadarCanvas';
import TimelineSlider from '../Dashboard/TimelineSlider';
import LocationSearch from './LocationSearch';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Radar overlay using Leaflet native ImageOverlay (100% geographic alignment) ──
function RadarOverlay({ frame }) {
  const dataUrl = useMemo(() => {
    if (!frame?.reflectivity) return null;
    const { reflectivity, rows = 64, cols = 64 } = frame;
    const tmp = document.createElement('canvas');
    tmp.width = cols;
    tmp.height = rows;
    const tCtx = tmp.getContext('2d');
    const img = tCtx.createImageData(cols, rows);
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = reflectivity[r]?.[c] ?? 0;
        const [R, G, B, A] = dbzToColor(val);
        img.data[i++] = R;
        img.data[i++] = G;
        img.data[i++] = B;
        img.data[i++] = Math.floor(A * 255);
      }
    }
    tCtx.putImageData(img, 0, 0);
    return tmp.toDataURL();
  }, [frame]);

  if (!dataUrl || !frame) return null;

  return (
    <ImageOverlay
      url={dataUrl}
      bounds={[
        [frame.lat_min, frame.lon_min],
        [frame.lat_max, frame.lon_max],
      ]}
      opacity={0.85}
      zIndex={400}
    />
  );
}

// ── Lead-time → color palette (Vibrant on Light Map) ────────
const LEAD_PALETTE = {
  0:   { ring: '#e11d48', core: '#e11d48', glow: 'rgba(225, 29, 72, 0.15)', path: '#f43f5e', label: 'LIVE',   pulse: '1.4s' },
  30:  { ring: '#0284c7', core: '#0284c7', glow: 'rgba(2, 132, 199, 0.15)', path: '#0284c7', label: 'T+30m',  pulse: '1.8s' },
  60:  { ring: '#2563eb', core: '#2563eb', glow: 'rgba(37, 99, 235, 0.15)', path: '#2563eb', label: 'T+1h',   pulse: '2.0s' },
  90:  { ring: '#7c3aed', core: '#7c3aed', glow: 'rgba(124, 58, 237, 0.15)', path: '#7c3aed', label: 'T+1.5h', pulse: '2.2s' },
  120: { ring: '#9333ea', core: '#9333ea', glow: 'rgba(147, 51, 234, 0.15)', path: '#9333ea', label: 'T+2h',   pulse: '2.4s' },
  180: { ring: '#64748b', core: '#64748b', glow: 'rgba(100, 116, 139, 0.15)', path: '#64748b', label: 'T+3h',   pulse: '2.8s' },
};

// ── Storm cell icon — changes by lead time ─────────────────
const makeStormIcon = (severity, leadTime = 0) => {
  const pal = LEAD_PALETTE[leadTime] || LEAD_PALETTE[0];
  // Extreme cells get a slightly larger icon
  const size  = severity === 'Extreme' ? 26 : 22;
  const inner = severity === 'Extreme' ? 9  : 7;

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:${size}px; height:${size}px; border-radius:50%;
        background:${pal.glow};
        border:2.5px solid ${pal.ring};
        box-shadow: 0 2px 6px rgba(0,0,0,0.18);
        animation:pulse-ring ${pal.pulse} ease-in-out infinite;
        display:flex; align-items:center; justify-content:center;
        transition: background 0.3s, border-color 0.3s;
      ">
        <div style="
          width:${inner}px; height:${inner}px; border-radius:50%;
          background:${pal.core};
          border: 1.5px solid #ffffff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
          transition: background 0.3s;
        "></div>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

const LightningIcon = L.divIcon({
  className: 'lightning-flash',
  html: `<span style="font-size:18px; line-height:1; filter:drop-shadow(0 0 4px #fbbf24);">⚡</span>`,
  iconSize: [18, 18], iconAnchor: [9, 9],
});

const LEGEND = [
  { label: '60+ dBZ', color: '#cc00ff', opacity: 0.9 },
  { label: '50–60',   color: '#ff0000', opacity: 0.85 },
  { label: '40–50',   color: '#ff8800', opacity: 0.8 },
  { label: '30–40',   color: '#ffff00', opacity: 0.7 },
  { label: '20–30',   color: '#00d400', opacity: 0.6 },
  { label: '10–20',   color: '#a0f0ff', opacity: 0.4 },
];

// ── Map Controller for smooth flyTo animations ──────────
function MapController({ targetLocation, resetTrigger }) {
  const map = useMap();

  useEffect(() => {
    if (targetLocation) {
      map.flyTo([targetLocation.lat, targetLocation.lon], 9, {
        duration: 1.4,
        easeLinearity: 0.25,
      });
    }
  }, [targetLocation, map]);

  useEffect(() => {
    if (resetTrigger) {
      map.flyTo([22.0, 79.5], 5, {
        duration: 1.4,
        easeLinearity: 0.25,
      });
    }
  }, [resetTrigger, map]);

  return null;
}

// ── Target Location Reticle Pin ──────────────────────────
const makeTargetPinIcon = (threat) => {
  const color = threat ? (threat.severity === 'Extreme' ? '#e11d48' : '#ea580c') : '#0284c7';
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center;">
        <div style="
          position:absolute; width:36px; height:36px; border-radius:50%;
          border:2.5px solid ${color}; background:${color}22;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          animation: pulse-ring 1.5s infinite;
        "></div>
        <div style="
          position:absolute; width:14px; height:14px; border-radius:50%;
          background:${color}; box-shadow:0 2px 8px rgba(0,0,0,0.3);
          border:2.5px solid #ffffff;
        "></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

// ── Main map component ───────────────────────────────────
export default function NowcastMap({ wsData, selectedLeadTime, onSelectLead }) {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [resetCount, setResetCount] = useState(0);
  const [layers, setLayers] = useState({
    radar: true,
    lightning: true,
    cells: true,
    alerts: true,
  });

  const toggleLayer = (layerKey) => {
    setLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // Choose frame to display
  let displayFrame = null;
  if (wsData?.current_frame) {
    if (selectedLeadTime === 0) {
      displayFrame = wsData.current_frame;
    } else {
      const ff = wsData.forecast_frames?.find(f => f.lead_minutes === selectedLeadTime);
      if (ff) {
        displayFrame = {
          ...ff,
          lat_min: wsData.current_frame.lat_min, lat_max: wsData.current_frame.lat_max,
          lon_min: wsData.current_frame.lon_min, lon_max: wsData.current_frame.lon_max,
          rows: wsData.current_frame.rows, cols: wsData.current_frame.cols,
        };
      }
    }
  }

  const handleSelectLocation = (loc) => {
    setSelectedLocation(loc);
  };

  const handleResetView = () => {
    setSelectedLocation(null);
    setResetCount(c => c + 1);
  };

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {/* ── Location Search Bar ─────────────────────────────── */}
      <LocationSearch
        onSelectLocation={handleSelectLocation}
        onResetView={handleResetView}
        activeAlerts={wsData?.alerts || []}
        stormCells={wsData?.storm_cells || []}
      />

      {/* ── Layer Toggles Toolbar (Top Right) ──────────────── */}
      <div
        style={{
          position: 'absolute',
          top: '48px',
          right: '12px',
          zIndex: 800,
          display: 'flex',
          gap: '4px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '4px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        }}
      >
        {[
          { key: 'radar', label: 'Radar', icon: '📡' },
          { key: 'lightning', label: 'Lightning', icon: '⚡' },
          { key: 'cells', label: 'Cells', icon: '🎯' },
          { key: 'alerts', label: 'Alerts', icon: '⭕' },
        ].map(({ key, label, icon }) => {
          const active = layers[key];
          return (
            <button
              key={key}
              onClick={() => toggleLayer(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 9px',
                borderRadius: '6px',
                border: 'none',
                background: active ? '#e0f2fe' : 'transparent',
                color: active ? '#0284c7' : '#64748b',
                fontSize: '11px',
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title={`Toggle ${label} Layer`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <MapContainer
        center={[22.0, 79.5]} zoom={5}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={true}
      >
        <MapController targetLocation={selectedLocation} resetTrigger={resetCount} />

        {/* Natural Light OSM basemap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Radar reflectivity canvas */}
        {layers.radar && displayFrame && <RadarOverlay frame={displayFrame} />}

        {/* Highlighted Selected Location Pin */}
        {selectedLocation && (
          <Marker
            position={[selectedLocation.lat, selectedLocation.lon]}
            icon={makeTargetPinIcon(selectedLocation.threat)}
          >
            <Popup autoPan={true}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', minWidth: '190px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '6px', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '14px', color: '#111' }}>{selectedLocation.name}</strong>
                  <span style={{ fontSize: '10px', color: '#666' }}>{selectedLocation.state}</span>
                </div>

                <div style={{ marginBottom: '6px' }}>
                  {selectedLocation.threat ? (
                    <div style={{
                      padding: '4px 8px', borderRadius: '4px',
                      background: selectedLocation.threat.severity === 'Extreme' ? '#fee2e2' : '#ffedd5',
                      color: selectedLocation.threat.severity === 'Extreme' ? '#b91c1c' : '#c2410c',
                      fontWeight: 700, fontSize: '11px'
                    }}>
                      ⚠️ {selectedLocation.threat.severity.toUpperCase()} THUNDERSTORM RISK
                      {selectedLocation.threat.distance && (
                        <div style={{ fontWeight: 500, fontSize: '10px', marginTop: '2px' }}>
                          Storm cell within ~{selectedLocation.threat.distance} km
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      padding: '4px 8px', borderRadius: '4px',
                      background: '#dcfce7', color: '#15803d',
                      fontWeight: 700, fontSize: '11px'
                    }}>
                      🟢 CLEAR — No Storm Imminent
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.4' }}>
                  Coordinates: {selectedLocation.lat.toFixed(2)}°N, {selectedLocation.lon.toFixed(2)}°E
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Storm cells + predicted paths — color changes with selectedLeadTime */}
        {layers.cells && wsData?.storm_cells?.map(cell => {
          const pal = LEAD_PALETTE[selectedLeadTime] || LEAD_PALETTE[0];
          return (
            <React.Fragment key={`${cell.id}-${selectedLeadTime}`}>
              <Marker
                position={[cell.lat, cell.lon]}
                icon={makeStormIcon(cell.severity, selectedLeadTime)}
              >
                <Popup>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', minWidth: '170px' }}>
                    {/* Header */}
                    <div style={{ fontWeight: 700, marginBottom: '6px', color: '#111', borderBottom: '1px solid #eee', paddingBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Storm Cell {cell.id}</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px', background: pal.glow, color: pal.ring, border: `1px solid ${pal.ring}` }}>
                        {pal.label}
                      </span>
                    </div>
                    <div>⚡ <strong>{cell.intensity_dbz.toFixed(0)} dBZ</strong></div>
                    <div>📏 Radius: {cell.radius_km.toFixed(0)} km</div>
                    <div>💨 Speed: {cell.motion_speed_kmh} km/h</div>
                    <div>🧭 Dir: {cell.motion_dir_deg}°</div>
                    <div style={{ marginTop: '4px', fontWeight: 600, color: cell.severity === 'Extreme' ? '#dc2626' : '#ea580c' }}>
                      {cell.severity}
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Predicted path — color matches lead time */}
              {cell.predicted_path && (
                <Polyline
                  positions={[[cell.lat, cell.lon], ...cell.predicted_path.map(p => [p.lat, p.lon])]}
                  pathOptions={{ color: pal.path, dashArray: '6 8', weight: 2, opacity: 0.75 }}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Lightning strikes (only for current observation) */}
        {layers.lightning && selectedLeadTime === 0 && wsData?.lightning?.map((s, idx) => (
          <Marker key={`ls-${idx}`} position={[s.lat, s.lon]} icon={LightningIcon} />
        ))}

        {/* Alert zone circles */}
        {layers.alerts && wsData?.alerts?.map(alert => {
          const cfg = {
            Extreme: { color: '#ef4444', fill: '#ef4444', opacity: 0.35 },
            Severe:  { color: '#f97316', fill: '#f97316', opacity: 0.25 },
            Moderate:{ color: '#f59e0b', fill: '#f59e0b', opacity: 0.15 },
            Low:     { color: '#10b981', fill: '#10b981', opacity: 0.1  },
          }[alert.severity] || { color: '#f97316', fill: '#f97316', opacity: 0.2 };

          return (
            <Circle
              key={alert.id}
              center={[alert.lat, alert.lon]}
              radius={25000}
              pathOptions={{ color: cfg.color, fillColor: cfg.fill, fillOpacity: cfg.opacity, weight: 1.5 }}
            >
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>
                  <strong>{alert.severity}</strong> — {alert.district}, {alert.state}<br />
                  <span style={{ color: '#555' }}>{alert.message}</span>
                </div>
              </Popup>
            </Circle>
          );
        })}
      </MapContainer>

      {/* ── dBZ Legend (Clean White Floating Card) ────────── */}
      <div style={{
        position: 'absolute', bottom: '100px', right: '12px', zIndex: 800,
        background: '#ffffff',
        border: '1px solid #e2e8f0', borderRadius: '8px',
        padding: '10px 12px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
      }}>
        <div style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.08em', color: '#64748b', marginBottom: '7px' }}>
          REFLECTIVITY (dBZ)
        </div>
        {LEGEND.map(({ label, color, opacity }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
            <div style={{ width: '14px', height: '10px', borderRadius: '2px', background: color, opacity }} />
            <span style={{ fontSize: '11px', color: '#334155', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Map overlay info badge — color matches lead time ── */}
      {(() => {
        const pal = LEAD_PALETTE[selectedLeadTime] || LEAD_PALETTE[0];
        return (
          <div style={{
            position: 'absolute', top: '12px', right: '12px', zIndex: 800,
            background: '#ffffff',
            border: `1.5px solid ${pal.ring}`, borderRadius: '8px',
            padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '7px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: pal.ring,
            }} className={selectedLeadTime === 0 ? 'live-dot' : ''} />
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: pal.ring, fontWeight: 800, letterSpacing: '0.05em' }}>
              {selectedLeadTime === 0 ? 'LIVE COMPOSITE' : `FORECAST ${pal.label}`}
            </span>
          </div>
        );
      })()}

      {/* ── Storm cell count badge — placed right next to search bar ── */}
      {wsData?.storm_cells?.length > 0 && (() => {
        const pal = LEAD_PALETTE[selectedLeadTime] || LEAD_PALETTE[0];
        return (
          <div style={{
            position: 'absolute', top: '12px', left: '344px', zIndex: 800,
            background: '#ffffff',
            border: `1px solid #cbd5e1`, borderRadius: '8px',
            padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: pal.ring }} />
            <span style={{ fontSize: '11px', color: '#0f172a', fontWeight: 700, letterSpacing: '0.03em' }}>
              {wsData.storm_cells.length} CELLS ALL-INDIA · <span style={{ color: pal.ring }}>{pal.label}</span>
            </span>
          </div>
        );
      })()}

      {/* ── Timeline slider (absolute positioned on map) ─ */}
      {wsData?.forecast_frames?.length > 0 && (
        <TimelineSlider
          selectedLead={selectedLeadTime}
          onSelectLead={onSelectLead}
          availableLeads={wsData.forecast_frames}
        />
      )}
    </div>
  );
}

