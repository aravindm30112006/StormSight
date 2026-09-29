import React from 'react';
import { Activity, Satellite, Zap, Globe, RefreshCw } from 'lucide-react';

const SOURCES_CONFIG = [
  { key: 'radar',     Icon: Activity,   label: 'IMD Doppler Radar',   getExtra: s => `${s?.stations || 0} stations online` },
  { key: 'satellite', Icon: Satellite,  label: 'INSAT-3D Satellite',  getExtra: s => s?.channel || 'IR/WV bands' },
  { key: 'lightning', Icon: Zap,        label: 'Lightning Network',   getExtra: s => `${s?.strikes_last_hour || 0} strikes/hr` },
  { key: 'nwp',       Icon: Globe,      label: 'NWP (NCUM/WRF)',      getExtra: s => s?.model || 'NCUM' },
];

function SourceCard({ Icon, label, status, extra }) {
  const active = status === 'active';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 12px', borderRadius: '8px', marginBottom: '6px',
      background: '#ffffff',
      border: `1px solid ${active ? '#e2e8f0' : '#fecaca'}`,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
      transition: 'all 0.2s',
    }}>
      {/* Icon bubble */}
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
        background: active ? '#e0f2fe' : '#fef2f2',
        border: `1px solid ${active ? '#bae6fd' : '#fecaca'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} color={active ? '#0284c7' : '#e11d48'} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </div>
        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
          {extra}
        </div>
      </div>

      {/* Status dot */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <div style={{
          width: '7px', height: '7px', borderRadius: '50%',
          background: active ? '#059669' : '#e11d48',
          boxShadow: active ? '0 0 6px rgba(5, 150, 105, 0.4)' : 'none',
        }} className={active ? 'live-dot' : ''} />
      </div>
    </div>
  );
}

export default function DataSourcesPanel({ sources }) {
  const all = sources || {};
  const activeCount = Object.values(all).filter(s => s?.status === 'active').length;
  const totalCount = SOURCES_CONFIG.length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div className="section-header" style={{ margin: 0, flex: 1 }}>
          <RefreshCw size={11} color="#0284c7" />
          Data Sources
        </div>
        <span style={{
          fontSize: '10px', fontWeight: 800, fontFamily: 'var(--font-mono)',
          padding: '2px 8px', borderRadius: '10px',
          background: activeCount === totalCount ? '#ecfdf5' : '#fef3c7',
          color: activeCount === totalCount ? '#047857' : '#b45309',
          border: `1px solid ${activeCount === totalCount ? '#a7f3d0' : '#fde68a'}`,
        }}>
          {activeCount}/{totalCount}
        </span>
      </div>

      {SOURCES_CONFIG.map(({ key, Icon, label, getExtra }) => (
        <SourceCard
          key={key}
          Icon={Icon}
          label={label}
          status={all[key]?.status}
          extra={getExtra(all[key])}
        />
      ))}
    </div>
  );
}
