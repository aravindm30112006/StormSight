import React, { useEffect, useRef } from 'react';
import { dbzToColor } from '../Map/RadarCanvas';
import { Clock } from 'lucide-react';

/* Renders a mini radar map on a <canvas> */
function MiniRadarCanvas({ reflectivity, size = 90 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!reflectivity || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rows = reflectivity.length;
    const cols = reflectivity[0]?.length || 0;
    if (!rows || !cols) return;

    const tmp = document.createElement('canvas');
    tmp.width = cols; tmp.height = rows;
    const tCtx = tmp.getContext('2d');
    const img = tCtx.createImageData(cols, rows);
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const [R, G, B, A] = dbzToColor(reflectivity[r][c]);
        img.data[i++] = R; img.data[i++] = G; img.data[i++] = B;
        img.data[i++] = Math.floor(A * 255);
      }
    }
    tCtx.putImageData(img, 0, 0);

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    // Dark BG
    ctx.fillStyle = '#050914';
    ctx.fillRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(tmp, 0, 0, size, size);

    // Subtle grid overlay
    ctx.strokeStyle = 'rgba(0,212,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < size; x += size / 4) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke();
    }
    for (let y = 0; y < size; y += size / 4) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
    }
  }, [reflectivity, size]);

  return <canvas ref={canvasRef} width={size} height={size} style={{ display: 'block', width: '100%', height: `${size}px` }} />;
}

const LEAD_LABELS = { 0: 'NOW', 30: 'T+30m', 60: 'T+1h', 90: 'T+1.5h', 120: 'T+2h', 180: 'T+3h' };
const CONF_COLOR  = c => c > 0.85 ? '#10b981' : c > 0.7 ? '#f59e0b' : '#ef4444';

export default function ForecastPanel({ forecastFrames, selectedLead, onSelectLead }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="section-header"><Clock size={11} color="#0284c7" />Nowcast Sequence</div>

      {/* NOW card */}
      <div
        onClick={() => onSelectLead(0)}
        style={{
          borderRadius: '8px', marginBottom: '8px', cursor: 'pointer', overflow: 'hidden',
          background: '#ffffff',
          border: `2px solid ${selectedLead === 0 ? '#0284c7' : '#e2e8f0'}`,
          boxShadow: selectedLead === 0 ? '0 2px 10px rgba(2, 132, 199, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.2s',
        }}
      >
        <div style={{
          background: selectedLead === 0 ? '#e0f2fe' : '#f8fafc',
          padding: '7px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${selectedLead === 0 ? '#bae6fd' : '#e2e8f0'}`,
        }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: selectedLead === 0 ? '#0284c7' : '#0f172a' }}>
            NOW
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#059669', fontWeight: 700 }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }} className="live-dot" />
            LIVE
          </span>
        </div>
        {forecastFrames?.[0] && (
          <MiniRadarCanvas reflectivity={forecastFrames[0].reflectivity} />
        )}
      </div>

      {/* Forecast cards */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {(!forecastFrames || forecastFrames.length === 0) ? (
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', padding: '20px' }}>
            Waiting for forecast data…
          </div>
        ) : forecastFrames.map(frame => {
          const selected = selectedLead === frame.lead_minutes;
          const confColor = CONF_COLOR(frame.confidence);
          const label = LEAD_LABELS[frame.lead_minutes] || `T+${frame.lead_minutes}m`;

          return (
            <div
              key={frame.lead_minutes}
              onClick={() => onSelectLead(frame.lead_minutes)}
              style={{
                borderRadius: '8px', cursor: 'pointer', overflow: 'hidden',
                background: '#ffffff',
                border: `2px solid ${selected ? '#0284c7' : '#e2e8f0'}`,
                boxShadow: selected ? '0 2px 10px rgba(2, 132, 199, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.2s',
                opacity: selected ? 1 : 0.85,
              }}
            >
              {/* Card header */}
              <div style={{
                background: selected ? '#e0f2fe' : '#f8fafc',
                padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: `1px solid ${selected ? '#bae6fd' : '#e2e8f0'}`,
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: selected ? '#0284c7' : '#334155', fontFamily: 'var(--font-mono)' }}>
                  {label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: confColor }} />
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: confColor, fontWeight: 700 }}>
                    {(frame.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              {/* Mini radar */}
              <MiniRadarCanvas reflectivity={frame.reflectivity} size={80} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
