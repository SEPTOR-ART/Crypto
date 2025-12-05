// Multi-exchange market data aggregator with verification, history, and metrics

const SYMBOLS = ['BTCUSD', 'ETHUSD', 'LTCUSD', 'XRPUSD'];
const CACHE_MS = 2000;
const SNAPSHOT_LIMIT = 1440;
const DISCREPANCY_ALERT_PCT = 1.5; // percent

const store = {
  last: null,
  lastAt: 0,
  metrics: {
    successes: 0,
    failures: 0,
    lastDurationMs: 0,
    lastError: null,
  },
  history: Object.fromEntries(SYMBOLS.map(s => [s, []]))
};

const timeoutFetch = async (url, init = {}, timeoutMs = 2000) => {
  const controller = AbortSignal.timeout(timeoutMs);
  return fetch(url, { ...init, signal: controller });
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
  const d = json.result[key];
  const open = parseFloat(d.o);
  const last = parseFloat(d.c?.[0]);
  const changePct = (last && open) ? ((last - open) / open) * 100 : 0;
  return {
    bid: parseFloat(d.b?.[0]),
    ask: parseFloat(d.a?.[0]),
    volume24h: parseFloat(d.v?.[1] || d.v?.[0] || 0),
    change24hPct: changePct
  };
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
  const maxDevPct = mids.length ? Math.max(...mids.map(m => Math.abs((m - med) / med) * 100)) : 0;
  const alert = maxDevPct >= DISCREPANCY_ALERT_PCT;
  return {
    symbol,
    sources,
    verified: { priceMid, vwap, discrepancyPct: maxDevPct, alert },
    timestamp: Date.now()
  };
};

const pushSnapshot = (snap) => {
  const arr = store.history[snap.symbol] || (store.history[snap.symbol] = []);
  arr.push({ t: snap.timestamp, mid: snap.verified.priceMid, vwap: snap.verified.vwap, vol: Object.values(snap.sources).reduce((a,b)=>a+(b.volume24h||0),0) });
  if (arr.length > SNAPSHOT_LIMIT) arr.shift();
};

const summarizeHistory = (symbol) => {
  const arr = store.history[symbol] || [];
  const now = Date.now();
  const oneHour = 3600000;
  const oneDay = 86400000;
  const within = (ms) => arr.filter(x => now - x.t <= ms);
  const avg = (xs, key) => xs.length ? xs.reduce((a,b)=>a+(b[key]||0),0)/xs.length : 0;
  return {
    minute: avg(within(60000), 'vwap'),
    hourly: avg(within(oneHour), 'vwap'),
    daily: avg(within(oneDay), 'vwap')
  };
};

export default async function handler(req, res) {
  try {
    const start = Date.now();
    const { metrics, history, lastAt } = store;
    const wantHistory = req.query.history === '1';
    const wantMetrics = req.query.metrics === '1';
    const symbols = (req.query.symbols ? String(req.query.symbols).split(',') : SYMBOLS).filter(Boolean);

    // Optional API key enforcement
    const key = process.env.MARKET_API_KEY;
    if (key && req.headers['x-api-key'] !== key) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Serve cached within CACHE_MS
    if (!wantHistory && !wantMetrics && store.last && (Date.now() - store.lastAt) < CACHE_MS) {
      res.status(200).json({ status: 'ok', cached: true, data: store.last, metrics, fetchedAt: store.lastAt });
      return;
    }

    const data = await Promise.all(symbols.map(aggregateSymbol));
    data.forEach(pushSnapshot);

    store.last = data;
    store.lastAt = Date.now();
    store.metrics.successes += 1;
    store.metrics.lastDurationMs = store.lastAt - start;
    store.metrics.lastError = null;

    if (wantHistory) {
      const hist = Object.fromEntries(symbols.map(s => [s, summarizeHistory(s)]));
      res.status(200).json({ status: 'ok', data, history: hist, metrics: store.metrics });
      return;
    }

    if (wantMetrics) {
      res.status(200).json({ status: 'ok', data, metrics: store.metrics });
      return;
    }

    res.status(200).json({ status: 'ok', data, fetchedAt: store.lastAt, metrics: store.metrics });
  } catch (e) {
    store.metrics.failures += 1;
    store.metrics.lastError = e.message;
    res.status(500).json({ status: 'error', message: e.message });
  }
}

