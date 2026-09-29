import { useState, useEffect, useRef } from 'react';
import { fetchCurrentNowcast } from '../services/api';

export function useWebSocket(url) {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);

  const connect = () => {
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      setConnected(true);
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };

    ws.current.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'nowcast_update') {
          setData(parsed);
          setLastUpdate(new Date());
        }
      } catch (e) {
        console.error('Error parsing WS message:', e);
      }
    };

    ws.current.onclose = () => {
      setConnected(false);
      // Auto-reconnect
      reconnectTimeout.current = setTimeout(connect, 3000);
    };

    ws.current.onerror = (err) => {
      console.error('WS Error:', err);
      ws.current.close();
    };
  };

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) ws.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [url]);

  // Fallback polling if WS is down
  useEffect(() => {
    let pollInterval;
    if (!connected) {
      pollInterval = setInterval(async () => {
        try {
          const apiData = await fetchCurrentNowcast();
          setData(apiData);
          setLastUpdate(new Date());
        } catch (e) {
          console.error("API fallback failed:", e);
        }
      }, 15000);
    }
    return () => clearInterval(pollInterval);
  }, [connected]);

  return { data, connected, lastUpdate };
}
