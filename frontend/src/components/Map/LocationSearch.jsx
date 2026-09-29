import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Globe, AlertTriangle, ShieldCheck } from 'lucide-react';
import { INDIA_LOCATIONS } from '../../data/indiaLocations';

export default function LocationSearch({ onSelectLocation, onResetView, activeAlerts = [], stormCells = [] }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState(null);
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter locations
  const filtered = query.trim() === ''
    ? []
    : INDIA_LOCATIONS.filter(loc =>
        loc.name.toLowerCase().includes(query.toLowerCase()) ||
        loc.state.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8);

  // Helper to check if a location has an active alert
  const getLocationThreat = (loc) => {
    // 1. Direct alert match
    const matchingAlert = activeAlerts.find(a =>
      a.district.toLowerCase() === loc.name.toLowerCase() ||
      loc.name.toLowerCase().includes(a.district.toLowerCase())
    );
    if (matchingAlert) {
      return { severity: matchingAlert.severity, distance: null };
    }

    // 2. Proximity to any storm cell (< 120km)
    let minDistance = 999;
    let closestCell = null;
    for (const cell of stormCells) {
      const dlat = (loc.lat - cell.lat) * 111;
      const dlon = (loc.lon - cell.lon) * 111 * Math.cos(loc.lat * Math.PI / 180);
      const dist = Math.sqrt(dlat * dlat + dlon * dlon);
      if (dist < minDistance) {
        minDistance = dist;
        closestCell = cell;
      }
    }

    if (closestCell && minDistance < 120) {
      return { severity: closestCell.severity || 'Severe', distance: Math.round(minDistance) };
    }

    return null;
  };

  const handleSelect = (loc) => {
    setSelectedLoc(loc);
    setQuery(loc.name);
    setIsOpen(false);
    const threat = getLocationThreat(loc);
    onSelectLocation({ ...loc, threat });
  };

  const handleClear = () => {
    setQuery('');
    setSelectedLoc(null);
    setIsOpen(false);
    onResetView();
  };

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        zIndex: 1000,
        width: '320px',
      }}
    >
      {/* Search Input Box */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          background: '#ffffff',
        }}
      >
        <Search size={16} color="#0284c7" style={{ flexShrink: 0 }} />
        
        <input
          type="text"
          value={query}
          placeholder="Search city, district (e.g. Delhi, Pune)..."
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#0f172a',
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
          }}
        />

        {query && (
          <button
            onClick={handleClear}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}

        <button
          onClick={onResetView}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: '#e0f2fe',
            border: '1px solid #bae6fd',
            borderRadius: '4px',
            color: '#0284c7',
            fontSize: '10px',
            fontWeight: 700,
            padding: '3px 8px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
          title="Zoom to All India"
        >
          <Globe size={11} />
          India
        </button>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && filtered.length > 0 && (
        <div
          style={{
            marginTop: '6px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            maxHeight: '260px',
            overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12)',
          }}
        >
          {filtered.map((loc, idx) => {
            const threat = getLocationThreat(loc);
            const isAlert = threat !== null;

            return (
              <div
                key={`${loc.name}-${idx}`}
                onClick={() => handleSelect(loc)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f1f5f9',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={13} color="#0284c7" />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                      {loc.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>
                      {loc.state} · <span style={{ opacity: 0.8 }}>{loc.type}</span>
                    </div>
                  </div>
                </div>

                {/* Threat Status Badge */}
                {isAlert ? (
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      background: threat.severity === 'Extreme' ? '#fee2e2' : '#ffedd5',
                      color: threat.severity === 'Extreme' ? '#b91c1c' : '#c2410c',
                      border: `1px solid ${threat.severity === 'Extreme' ? '#fca5a5' : '#fed7aa'}`,
                    }}
                  >
                    <AlertTriangle size={9} />
                    {threat.severity.toUpperCase()}
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      background: '#ecfdf5',
                      color: '#047857',
                      border: '1px solid #a7f3d0',
                    }}
                  >
                    <ShieldCheck size={9} />
                    CLEAR
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
