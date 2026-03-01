import { useEffect, useRef, useCallback } from 'react';
import { useAccountStore } from '../stores/accountStore';
import type { WsMessage } from '../types';

export const useWebSocket = (token: string | null) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setAccounts = useAccountStore(s => s.setAccounts);
  const updateAccounts = useAccountStore(s => s.updateAccounts);
  const setWsConnected = useAccountStore(s => s.setWsConnected);

  const connect = useCallback(() => {
    if (!token) return;

    // Close previous connection if any
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const wsUrl = `ws://localhost:4000/ws?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (wsRef.current === ws) {
        setWsConnected(true);
        console.log('[WS] Connected');
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WsMessage;
        if (msg.type === 'SNAPSHOT') setAccounts(msg.data);
        else if (msg.type === 'UPDATE') updateAccounts(msg.data);
      } catch (e) {
        console.error('[WS] Parse error', e);
      }
    };

    ws.onerror = () => {
      if (wsRef.current === ws) {
        setWsConnected(false);
      }
    };

    ws.onclose = () => {
      // Only reconnect if this is still the active connection
      if (wsRef.current === ws) {
        setWsConnected(false);
        console.log('[WS] Disconnected, reconnecting in 3s...');
        reconnectRef.current = setTimeout(connect, 3000);
      }
    };
  }, [token, setAccounts, updateAccounts, setWsConnected]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        const ws = wsRef.current;
        wsRef.current = null; // Clear ref first so onclose doesn't trigger reconnect
        ws.close();
      }
    };
  }, [connect]);
};
