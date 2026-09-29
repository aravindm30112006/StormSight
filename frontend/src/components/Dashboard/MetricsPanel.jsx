import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';

/* Circular SVG arc gauge */
function ArcGauge({ value, color, label, sublabel }) {
  const pct = Math.min(Math.max(value, 0), 100);
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const gap  = circ - dash;
  const rotation = -210;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div style={{ position: 'relative', width: '72px', height: '72px' }}>
        <svg width="72" height="72" viewBox="0 0 72 72">
          {/* Track */}
          <circle cx="36" cy="36" r={r} fill="none"
            stroke="#e2e8f0" strokeWidth="5"
            strokeDasharray={`${circ * 0.833} ${circ * 0.167}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(${rotation} 36 36)`}
          />
          {/* Fill */}
          <circle cx="36" cy="36" r={r} fill="none"
            stroke={color} strokeWidth="5"
            strokeDasharray={`${dash * 0.833} ${circ}`}
            strokeLinecap="round"
            transform={`rotate(${rotation} 36 36)`}
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        {/* Center value */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 800, color, lineHeight: 1 }}>
            {pct.toFixed(0)}
          </span>
          <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>%</span>
        </div>
      </div>
      <div style={{ fontSize: '11px', fontWeight: 800, color: '#334155', letterSpacing: '0.06em' }}>{label}</div>
      {sublabel && <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 500 }}>{sublabel}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <span style={{ color: '#0284c7', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{payload[0].value.toFixed(1)}%</span>
    </div>
  );
};

export default function MetricsPanel({ metrics }) {
  if (!metrics) {
    return (
      <div>
        <div className="section-header"><TrendingUp size={11} color="#0284c7" />Model Performance</div>
        <div style={{ height: '80px' }} className="skeleton" />
      </div>
    );
  }

  const pod = metrics.pod * 100;
  const far = metrics.far * 100;
  const csi = metrics.csi * 100;

  const skillData = [
    { name: 'T+30m', skill: (metrics.lead_30_skill || 0) * 100, color: '#0284c7' },
    { name: 'T+60m', skill: (metrics.lead_60_skill || 0) * 100, color: '#2563eb' },
    { name: 'T+90m', skill: (metrics.lead_90_skill || 0) * 100, color: '#7c3aed' },
  ];

  return (
    <div>
      <div className="section-header"><TrendingUp size={11} color="#0284c7" />Model Performance</div>

      {/* Three arc gauges */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '14px' }}>
        <ArcGauge value={pod} color="#059669" label="POD" sublabel="Detection" />
        <ArcGauge value={100 - far} color="#d97706" label="FAR" sublabel={`${far.toFixed(0)}% false`} />
        <ArcGauge value={csi} color="#0284c7" label="CSI" sublabel="Skill" />
      </div>

      {/* Skill bar chart */}
      <div style={{
        background: '#ffffff', borderRadius: '8px',
        border: '1px solid #e2e8f0', padding: '10px 12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
      }}>
        <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '8px', letterSpacing: '0.08em', fontWeight: 700 }}>
          FORECAST SKILL SCORE
        </div>
        <div style={{ height: '90px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={skillData} layout="vertical" margin={{ top: 0, right: 4, left: -10, bottom: 0 }} barSize={10}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Inter' }} width={36}
              />
              <Tooltip cursor={{ fill: '#f1f5f9' }} content={<CustomTooltip />} />
              <Bar dataKey="skill" radius={[0, 4, 4, 0]} background={{ fill: '#f1f5f9', radius: 4 }}>
                {skillData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model tag */}
      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }} className="live-dot" />
        <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
          {metrics.model || 'ConvLSTM Ensemble'}
        </span>
      </div>
    </div>
  );
}
