import React from 'react';
import { AlertTriangle, MapPin, Clock, Zap } from 'lucide-react';

const SEVERITY_CONFIG = {
  Low:      { color: '#059669', bg: '#f0fdf4', border: '#bbf7d0', icon: '🟢' },
  Moderate: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '🟡' },
  Severe:   { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', icon: '🟠' },
  Extreme:  { color: '#e11d48', bg: '#fff1f2', border: '#fecdd3', icon: '🔴' },
};

function AlertCard({ alert }) {
  const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.Moderate;
  const isCritical = alert.severity === 'Severe' || alert.severity === 'Extreme';
  const issuedTime = new Date(alert.issued_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className={isCritical ? 'pulse-alert' : ''}
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: '8px',
        padding: '10px 12px',
        marginBottom: '8px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        animation: 'slide-in 0.3s ease-out',
      }}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
        background: cfg.color,
        borderRadius: '8px 0 0 8px',
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginLeft: '8px', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '9px', fontWeight: 800, letterSpacing: '0.1em',
            color: cfg.color, background: '#ffffff',
            border: `1px solid ${cfg.border}`,
            padding: '2px 7px', borderRadius: '4px',
          }}>
            {alert.severity.toUpperCase()}
          </span>
          {isCritical && <Zap size={11} color={cfg.color} />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#64748b', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
          <Clock size={9} />
          {issuedTime}
        </div>
      </div>

      {/* Location */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px', marginBottom: '5px' }}>
        <MapPin size={11} color={cfg.color} />
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
          {alert.district}
        </span>
        <span style={{ fontSize: '11px', color: '#64748b' }}>· {alert.state}</span>
      </div>

      {/* Message */}
      <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.5', marginLeft: '8px' }}>
        {alert.message}
      </div>
    </div>
  );
}

export default function AlertFeed({ alerts }) {
  const list = alerts || [];
  const extreme = list.filter(a => a.severity === 'Extreme').length;
  const severe  = list.filter(a => a.severity === 'Severe').length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div className="section-header" style={{ margin: 0, flex: 1 }}>
          <AlertTriangle size={11} color="#f59e0b" />
          Active Alerts
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {extreme > 0 && (
            <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 7px', borderRadius: '10px',
              background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' }}>
              {extreme} EXT
            </span>
          )}
          {severe > 0 && (
            <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 7px', borderRadius: '10px',
              background: '#ffedd5', color: '#c2410c', border: '1px solid #fed7aa' }}>
              {severe} SEV
            </span>
          )}
          {list.length === 0 && (
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px',
              background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
              ALL CLEAR
            </span>
          )}
        </div>
      </div>

      {/* Alert list */}
      <div>
        {list.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '24px', textAlign: 'center', gap: '8px',
            background: '#ecfdf5', border: '1px dashed #a7f3d0', borderRadius: '8px',
          }}>
            <div style={{ fontSize: '22px' }}>✅</div>
            <div style={{ fontSize: '12px', color: '#047857', fontWeight: 700 }}>No active alerts</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Monitoring all regions across India</div>
          </div>
        ) : (
          list.map(alert => <AlertCard key={alert.id} alert={alert} />)
        )}
      </div>
    </div>
  );
}
