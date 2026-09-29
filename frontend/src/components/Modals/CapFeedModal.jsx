import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download, Radio, ShieldAlert, ExternalLink } from 'lucide-react';

export default function CapFeedModal({ isOpen, onClose }) {
  const [xml, setXml] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/alerts/cap')
      .then(res => res.text())
      .then(data => {
        setXml(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching CAP XML:', err);
        setLoading(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(xml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IMD_StormSight_CAP_${new Date().toISOString().replace(/[:.]/g, '-')}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          width: 'min(760px, 92vw)',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          border: '1px solid #cbd5e1',
          background: '#ffffff',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Radio size={16} color="#e11d48" />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                NDMA SACHET · CAP v1.2 XML Feed
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                Standard ITU-T X.1303 / OASIS Common Alerting Protocol Output
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleCopy}
              disabled={loading}
              className="btn-icon"
              style={{
                width: '32px',
                height: '32px',
                background: '#f0f9ff',
                color: '#0284c7',
                border: '1px solid #bae6fd',
              }}
              title="Copy XML"
            >
              {copied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
            </button>

            <button
              onClick={handleDownload}
              disabled={loading}
              className="btn-icon"
              style={{
                width: '32px',
                height: '32px',
                background: '#ecfdf5',
                color: '#059669',
                border: '1px solid #a7f3d0',
              }}
              title="Download XML File"
            >
              <Download size={14} />
            </button>

            <button
              onClick={onClose}
              className="btn-icon"
              style={{
                width: '32px',
                height: '32px',
                background: '#f1f5f9',
                color: '#64748b',
                border: '1px solid #e2e8f0',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div
          style={{
            padding: '10px 20px',
            background: '#eff6ff',
            borderBottom: '1px solid #dbeafe',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: '#1e40af',
          }}
        >
          <ShieldAlert size={14} color="#2563eb" style={{ flexShrink: 0 }} />
          <span>
            This machine-readable CAP XML feed directly integrates with India's <strong>National Disaster Management Authority (NDMA)</strong> and <strong>SACHET Integrated Alert Platform</strong> for broadcast via SMS, Cell Broadcast, and Sirens.
          </span>
        </div>

        {/* XML Viewer Body */}
        <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', background: '#f8fafc' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              Fetching real-time CAP XML from backend...
            </div>
          ) : (
            <pre
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                lineHeight: '1.5',
                color: '#a7f3d0',
                background: '#0f172a',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #334155',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {xml}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#64748b',
            background: '#ffffff',
          }}
        >
          <div>Endpoint: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#0f172a' }}>GET /api/alerts/cap</code></div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
