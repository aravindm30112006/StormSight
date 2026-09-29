import React, { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import DataSourcesPanel from './components/Dashboard/DataSourcesPanel';
import MetricsPanel from './components/Dashboard/MetricsPanel';
import AlertFeed from './components/Dashboard/AlertFeed';
import ForecastPanel from './components/Dashboard/ForecastPanel';
import NowcastMap from './components/Map/NowcastMap';
import CapFeedModal from './components/Modals/CapFeedModal';
import { CloudLightning, Wifi, WifiOff, Zap, Radio } from 'lucide-react';

const EMPTY_DATA = {
  metrics: { pod: 0, far: 0, csi: 0, lead_30_skill: 0, lead_60_skill: 0, lead_90_skill: 0, model: 'Loading…' },
  data_sources: {
    radar:     { status: 'inactive' },
    satellite: { status: 'inactive' },
    lightning: { status: 'inactive' },
    nwp:       { status: 'inactive' },
  },
  alerts: [],
  forecast_frames: [],
};

export default function App() {
  const { data: wsData, connected, lastUpdate } = useWebSocket('ws://localhost:8000/ws/nowcast');
  const [selectedLeadTime, setSelectedLeadTime] = useState(0);
  const [showCapModal, setShowCapModal] = useState(false);

  const data = wsData || EMPTY_DATA;
  const activeAlerts = (data.alerts || []).filter(
    a => a.severity === 'Severe' || a.severity === 'Extreme'
  ).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: '#ffffff', overflow: 'hidden' }}>

      {/* ── Top Header (Clean White + Color Accents) ────────── */}
      <header style={{
        height: '56px',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        position: 'relative', zIndex: 100,
      }}>
        {/* Left: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
            border: '1px solid #7dd3fc',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.15)',
          }}>
            <CloudLightning size={20} color="#0284c7" />
          </div>
          <div>
            <div style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
              Storm<span style={{ color: '#0284c7' }}>Sight</span>
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', letterSpacing: '0.06em', fontWeight: 600 }}>
              AI NOWCASTING PLATFORM
            </div>
          </div>
        </div>

        {/* Center: Alert banner */}
        {activeAlerts > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#ffe4e6', border: '1px solid #fecdd3',
            borderRadius: '20px', padding: '5px 14px',
            animation: 'pulse-ring 2s ease-in-out infinite',
          }}>
            <Zap size={14} color="#e11d48" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#be123c' }}>
              {activeAlerts} SEVERE ALERT{activeAlerts > 1 ? 'S' : ''} ACTIVE
            </span>
          </div>
        )}

        {/* Right: Actions & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* CAP 1.2 Feed Trigger Button */}
          <button
            onClick={() => setShowCapModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#0284c7',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Preview ITU/NDMA SACHET CAP v1.2 XML Feed"
          >
            <Radio size={13} color="#0284c7" />
            <span>CAP 1.2 Feed</span>
          </button>

          {lastUpdate && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
              {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST
            </div>
          )}

          {/* Live status badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: connected ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${connected ? '#a7f3d0' : '#fecaca'}`,
            padding: '5px 12px', borderRadius: '20px',
          }}>
            <div style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: connected ? '#059669' : '#e11d48',
            }} className={connected ? 'live-dot' : ''} />
            {connected ? <Wifi size={13} color="#059669" /> : <WifiOff size={13} color="#e11d48" />}
            <span style={{ fontSize: '11px', fontWeight: 700, color: connected ? '#047857' : '#b91c1c' }}>
              {connected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main 3-Panel Layout ─────────────────────────────── */}
      <main style={{ display: 'flex', flex: 1, overflow: 'hidden', gap: 0 }}>

        {/* LEFT PANEL — 300px fixed, white/slate sidebar */}
        <aside style={{
          width: '300px', flexShrink: 0,
          background: '#f8fafc',
          borderRight: '1px solid #e2e8f0',
          boxShadow: '2px 0 10px rgba(0, 0, 0, 0.03)',
          overflowY: 'auto',
          overflowX: 'hidden',
          zIndex: 10,
        }}>
          <div style={{ padding: '16px', paddingBottom: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <DataSourcesPanel sources={data.data_sources} />
            <div style={{ height: '1px', background: '#e2e8f0', margin: '8px 0' }} />
            <MetricsPanel metrics={data.metrics} />
            <div style={{ height: '1px', background: '#e2e8f0', margin: '8px 0' }} />
            <AlertFeed alerts={data.alerts} />
          </div>
        </aside>

        {/* CENTER PANEL — Map */}
        <section style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <NowcastMap wsData={data} selectedLeadTime={selectedLeadTime} onSelectLead={setSelectedLeadTime} />
        </section>

        {/* RIGHT PANEL — 240px fixed */}
        <aside style={{
          width: '240px', flexShrink: 0,
          background: '#f8fafc',
          borderLeft: '1px solid #e2e8f0',
          boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.03)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          zIndex: 10,
        }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            <ForecastPanel
              forecastFrames={data.forecast_frames}
              selectedLead={selectedLeadTime}
              onSelectLead={setSelectedLeadTime}
            />
          </div>
        </aside>
      </main>

      {/* ── NDMA SACHET CAP v1.2 Feed Modal ──────────────── */}
      <CapFeedModal isOpen={showCapModal} onClose={() => setShowCapModal(false)} />
    </div>
  );
}
