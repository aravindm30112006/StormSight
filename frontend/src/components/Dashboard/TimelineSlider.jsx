import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack } from 'lucide-react';

const LEADS = [0, 30, 60, 90, 120, 180];
const LEAD_LABELS = { 0: 'NOW', 30: '+30m', 60: '+1h', 90: '+1.5h', 120: '+2h', 180: '+3h' };
const MAX = 180;

export default function TimelineSlider({ selectedLead, onSelectLead, availableLeads }) {
  const [playing, setPlaying] = useState(false);

  const advance = useCallback(() => {
    const idx = LEADS.indexOf(selectedLead);
    onSelectLead(LEADS[(idx + 1) % LEADS.length]);
  }, [selectedLead, onSelectLead]);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(advance, 1200);
    return () => clearInterval(t);
  }, [playing, advance]);

  const conf = selectedLead === 0 ? 1.0
    : (availableLeads?.find(f => f.lead_minutes === selectedLead)?.confidence ?? 0);
  const confPct = (conf * 100).toFixed(0);
  const confColor = conf > 0.85 ? '#10b981' : conf > 0.7 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{
      position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
      width: 'min(580px, 80%)', padding: '14px 20px', zIndex: 900,
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
    }}>
      {/* Top row: controls + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        {/* Reset */}
        <button
          onClick={() => { setPlaying(false); onSelectLead(0); }}
          className="btn-icon"
          style={{ width: '28px', height: '28px', background: '#f1f5f9', color: '#475569' }}
          title="Reset to NOW"
        >
          <SkipBack size={13} />
        </button>

        {/* Play/pause */}
        <button
          onClick={() => setPlaying(p => !p)}
          className="btn-icon"
          style={{
            width: '36px', height: '36px',
            background: playing ? '#0369a1' : '#0284c7',
            color: '#ffffff',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
            border: 'none',
          }}
        >
          {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" style={{ marginLeft: '2px' }} />}
        </button>

        {/* Current label */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
            {selectedLead === 0
              ? <span style={{ color: '#0284c7' }}>CURRENT OBSERVATION</span>
              : <span>FORECAST <span style={{ color: '#0284c7', fontFamily: 'var(--font-mono)' }}>T+{selectedLead} MIN</span></span>
            }
          </div>
          {selectedLead > 0 && (
            <div style={{ fontSize: '11px', color: confColor, marginTop: '2px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              Confidence: {confPct}%
            </div>
          )}
        </div>

        {/* Confidence bar */}
        {selectedLead > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '60px', height: '5px', borderRadius: '3px', background: '#f1f5f9', overflow: 'hidden' }}>
              <div style={{
                width: `${confPct}%`, height: '100%', borderRadius: '3px',
                background: confColor,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Timeline track */}
      <div style={{ position: 'relative' }}>
        {/* Background track */}
        <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '4px', margin: '0 0 6px 0', position: 'relative' }}>
          {/* Fill */}
          <div style={{
            position: 'absolute', left: 0, top: 0, height: '100%',
            width: `${(selectedLead / MAX) * 100}%`,
            background: 'linear-gradient(90deg, #38bdf8, #0284c7)',
            borderRadius: '4px', transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Tick marks + labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {LEADS.map(l => {
            const active = selectedLead === l;
            return (
              <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', minWidth: '32px' }}
                onClick={() => onSelectLead(l)}>
                <div style={{
                  width: active ? '12px' : '7px', height: active ? '12px' : '7px',
                  borderRadius: '50%', marginTop: '-8px', marginBottom: '4px',
                  background: active ? '#0284c7' : '#cbd5e1',
                  border: '2px solid #ffffff',
                  boxShadow: active ? '0 1px 6px rgba(2, 132, 199, 0.5)' : 'none',
                  transition: 'all 0.2s',
                }} />
                <span style={{
                  fontSize: '10px', fontFamily: 'var(--font-mono)',
                  color: active ? '#0284c7' : '#64748b', fontWeight: active ? 700 : 500,
                  transition: 'color 0.2s',
                }}>
                  {LEAD_LABELS[l]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
