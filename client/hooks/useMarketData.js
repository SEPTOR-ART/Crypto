import { useEffect, useRef, useState } from 'react';

export const useMarketData = ({ symbols = ['BTCUSD','ETHUSD'], metrics = false, history = false, refreshMs = 2000, apiKey }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  const load = async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (symbols && symbols.length) params.set('symbols', symbols.join(','));
      if (metrics) params.set('metrics', '1');
      if (history) params.set('history', '1');
      const res = await fetch(`/api/market-data?${params.toString()}`, { headers: apiKey ? { 'x-api-key': apiKey } : undefined });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
      setData(json);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(load, refreshMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(symbols), metrics, history, refreshMs, apiKey]);

  return { data: data?.data || null, metrics: data?.metrics || null, history: data?.history || null, loading, error };
};

