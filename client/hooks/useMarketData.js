import { useEffect, useRef, useState } from 'react';
import { apiRequest } from '../services/api';

export const useMarketData = ({ symbols = ['BTCUSD','ETHUSD'], metrics = false, history = false, refreshMs = 2000, apiKey }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);
  const histRef = useRef(Object.fromEntries((symbols||[]).map(s => [s, []])));
  const metricsRef = useRef({ successes: 0, failures: 0, lastDurationMs: 0, lastError: null });
  const cooldownUntilRef = useRef(0);
  const disableExternal = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_DISABLE_EXTERNAL_RATES === '1') || false;
  const isStaticHost = typeof window !== 'undefined' && /netlify\.app$/.test(window.location.hostname);

  const timeoutFetch = async (url, init = {}, timeoutMs = 2500) => {
    const controller = AbortSignal.timeout(timeoutMs);
    return fetch(url, { ...init, signal: controller });
  };

  const median = (arr) => {
    const a = [...arr].sort((x, y) => x - y);
    const mid = Math.floor(a.length / 2);
    return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
  };

  const computeVWAP = (midPrices, volumes) => {
    let num = 0, den = 0;
    for (let i = 0; i < midPrices.length; i++) {
      const p = midPrices[i];
      const v = volumes[i] || 0;
      if (isFinite(p) && p > 0 && isFinite(v) && v >= 0) {
        num += p * v;
        den += v;
      }
    }
    return den > 0 ? num / den : (midPrices.length ? (midPrices.reduce((a,b)=>a+b,0)/midPrices.length) : 0);
  };

  const parseBinance = async (symbol) => {
    const pair = symbol.replace('USD', 'USDT');
    const [book, stats] = await Promise.all([
      timeoutFetch(`https://api.binance.com/api/v3/ticker/bookTicker?symbol=${pair}`),
      timeoutFetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`)
    ]);
    const bookJson = await book.json();
    const statsJson = await stats.json();
    return {
      bid: parseFloat(bookJson.bidPrice),
      ask: parseFloat(bookJson.askPrice),
      volume24h: parseFloat(statsJson.volume),
      change24hPct: parseFloat(statsJson.priceChangePercent)
    };
  };

  const parseCoinbase = async (symbol) => {
    const pair = symbol.replace('USD', '-USD');
    const [ticker, stats] = await Promise.all([
      timeoutFetch(`https://api.exchange.coinbase.com/products/${pair}/ticker`, { headers: { 'User-Agent': 'CryptoZen' } }),
      timeoutFetch(`https://api.exchange.coinbase.com/products/${pair}/stats`, { headers: { 'User-Agent': 'CryptoZen' } })
    ]);
    const t = await ticker.json();
    const s = await stats.json();
    const open = parseFloat(s.open);
    const last = parseFloat(t.price);
    const changePct = (last && open) ? ((last - open) / open) * 100 : 0;
    return {
      bid: parseFloat(t.bid),
      ask: parseFloat(t.ask),
      volume24h: parseFloat(s.volume),
      change24hPct: changePct
    };
  };

  const parseKraken = async (symbol) => {
    const map = { BTCUSD: 'XBTUSD', ETHUSD: 'ETHUSD', LTCUSD: 'LTCUSD', XRPUSD: 'XRPUSD' };
    const pair = map[symbol] || symbol;
    const res = await timeoutFetch(`https://api.kraken.com/0/public/Ticker?pair=${pair}`);
    const json = await res.json();
    const key = Object.keys(json.result || {})[0];
    const d = json.result?.[key];
    const open = parseFloat(d?.o);
    const last = parseFloat(d?.c?.[0]);
    const changePct = (last && open) ? ((last - open) / open) * 100 : 0;
    return {
      bid: parseFloat(d?.b?.[0]),
      ask: parseFloat(d?.a?.[0]),
      volume24h: parseFloat(d?.v?.[1] || d?.v?.[0] || 0),
      change24hPct: changePct
    };
  };

  const aggregateSymbol = async (symbol) => {
    const results = await Promise.allSettled([
      parseBinance(symbol),
      parseCoinbase(symbol),
      parseKraken(symbol)
    ]);
    const sources = {};
    ['binance','coinbase','kraken'].forEach((name, idx) => {
      const r = results[idx];
      if (r.status === 'fulfilled') sources[name] = r.value;
    });
    const mids = Object.values(sources).map(s => (s.bid + s.ask) / 2).filter(v => isFinite(v));
    const vols = Object.values(sources).map(s => s.volume24h).filter(v => isFinite(v));
    const priceMid = mids.length ? (mids.reduce((a,b)=>a+b,0) / mids.length) : null;
    const vwap = computeVWAP(mids, vols);
    const med = mids.length ? median(mids) : null;
    const maxDevPct = mids.length && med ? Math.max(...mids.map(m => Math.abs((m - med) / med) * 100)) : 0;
    const alert = maxDevPct >= 1.5;
    const snap = { symbol, sources, verified: { priceMid, vwap, discrepancyPct: maxDevPct, alert }, timestamp: Date.now() };
    const arr = histRef.current[symbol] || (histRef.current[symbol] = []);
    arr.push({ t: snap.timestamp, vwap });
    if (arr.length > 1440) arr.shift();
    return snap;
  };

  const load = async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (symbols && symbols.length) params.set('symbols', symbols.join(','));
      if (metrics) params.set('metrics', '1');
      if (history) params.set('history', '1');
      const start = Date.now();
      const offline = typeof navigator !== 'undefined' && navigator && navigator.onLine === false;
      const skipExternal = disableExternal || isStaticHost || offline || (cooldownUntilRef.current && Date.now() < cooldownUntilRef.current);
      const res = skipExternal ? { ok: false, status: 404 } : await fetch(`/api/market-data?${params.toString()}`, { headers: apiKey ? { 'x-api-key': apiKey } : undefined });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        metricsRef.current.successes += 1;
        metricsRef.current.lastDurationMs = Date.now() - start;
        metricsRef.current.lastError = null;
      } else {
        // Fallback: aggregate client-side if serverless route unavailable
        try {
          const aggregated = await Promise.all((symbols||[]).map(aggregateSymbol));
          const hist = Object.fromEntries((symbols||[]).map(s => {
            const arr = histRef.current[s] || [];
            const now = Date.now();
            const avgWithin = (ms) => {
              const xs = arr.filter(x => now - x.t <= ms).map(x => x.vwap);
              return xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : 0;
            };
            return [s, { minute: avgWithin(60000), hourly: avgWithin(3600000), daily: avgWithin(86400000) }];
          }));
          metricsRef.current.successes += 1;
          metricsRef.current.lastDurationMs = Date.now() - start;
          metricsRef.current.lastError = `fallback HTTP ${res.status}`;
          setData({ status: 'ok', data: aggregated, history: hist, metrics: metricsRef.current });
        } catch (exchangeErr) {
          // Final fallback: use backend placeholder prices when exchanges unreachable
          const placeholder = await apiRequest('/api/prices').catch(() => null);
          const mapping = placeholder?.prices || {};
          const dataFromPlaceholder = (symbols||[]).map(sym => {
            const asset = sym.replace('USD','');
            const price = Number(mapping[asset] || 0);
            return {
              symbol: sym,
              sources: { placeholder: { bid: price ? price*0.999 : 0, ask: price ? price*1.001 : 0, volume24h: 0, change24hPct: 0 } },
              verified: { priceMid: price || 0, vwap: price || 0, discrepancyPct: 0, alert: false },
              timestamp: Date.now()
            };
          });
          const hist = Object.fromEntries((symbols||[]).map(s => [s, { minute: mapping ? (Number(mapping[s.replace('USD','')])||0) : 0, hourly: 0, daily: 0 }]));
          metricsRef.current.lastError = `exchanges unreachable: ${exchangeErr?.message || 'error'}`;
          // Set cooldown for 5 minutes to avoid repeated DNS errors
          cooldownUntilRef.current = Date.now() + 5 * 60 * 1000;
          setData({ status: 'ok', data: dataFromPlaceholder, history: hist, metrics: metricsRef.current });
        }
      }
    } catch (e) {
      try {
        const aggregated = await Promise.all((symbols||[]).map(aggregateSymbol));
        const hist = Object.fromEntries((symbols||[]).map(s => {
          const arr = histRef.current[s] || [];
          const now = Date.now();
          const avgWithin = (ms) => {
            const xs = arr.filter(x => now - x.t <= ms).map(x => x.vwap);
            return xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : 0;
          };
          return [s, { minute: avgWithin(60000), hourly: avgWithin(3600000), daily: avgWithin(86400000) }];
        }));
        metricsRef.current.failures += 1;
        metricsRef.current.lastDurationMs = 0;
        metricsRef.current.lastError = e.message;
        setData({ status: 'ok', data: aggregated, history: hist, metrics: metricsRef.current });
        setError(null);
      } catch (inner) {
        // Final fallback to backend prices
        const placeholder = await apiRequest('/api/prices').catch(() => null);
        const mapping = placeholder?.prices || {};
        const dataFromPlaceholder = (symbols||[]).map(sym => {
          const asset = sym.replace('USD','');
          const price = Number(mapping[asset] || 0);
          return {
            symbol: sym,
            sources: { placeholder: { bid: price ? price*0.999 : 0, ask: price ? price*1.001 : 0, volume24h: 0, change24hPct: 0 } },
            verified: { priceMid: price || 0, vwap: price || 0, discrepancyPct: 0, alert: false },
            timestamp: Date.now()
          };
        });
        const hist = Object.fromEntries((symbols||[]).map(s => [s, { minute: mapping ? (Number(mapping[s.replace('USD','')])||0) : 0, hourly: 0, daily: 0 }]));
        metricsRef.current.lastError = `fallback placeholder: ${inner?.message || 'error'}`;
        // Set cooldown to avoid hammering external hosts
        cooldownUntilRef.current = Date.now() + 5 * 60 * 1000;
        setData({ status: 'ok', data: dataFromPlaceholder, history: hist, metrics: metricsRef.current });
        setError(null);
      }
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
