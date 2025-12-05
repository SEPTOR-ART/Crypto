const express = require('express');
const router = express.Router();

let cache = { prices: null, ts: 0 };

const timeoutFetch = async (url, init = {}, timeoutMs = 2500) => {
  const signal = AbortSignal.timeout(timeoutMs);
  const res = await fetch(url, { ...init, signal });
  return res;
};

const parseBinance = async (symbol) => {
  const pair = symbol + 'USDT';
  const [book, stats] = await Promise.all([
    timeoutFetch(`https://api.binance.com/api/v3/ticker/bookTicker?symbol=${pair}`),
    timeoutFetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`)
  ]);
  const b = await book.json();
  const s = await stats.json();
  return { bid: parseFloat(b.bidPrice), ask: parseFloat(b.askPrice), volume24h: parseFloat(s.volume) };
};

const parseCoinbase = async (symbol) => {
  const pair = symbol + '-USD';
  const [ticker, stats] = await Promise.all([
    timeoutFetch(`https://api.exchange.coinbase.com/products/${pair}/ticker`, { headers: { 'User-Agent': 'CryptoZen' } }),
    timeoutFetch(`https://api.exchange.coinbase.com/products/${pair}/stats`, { headers: { 'User-Agent': 'CryptoZen' } })
  ]);
  const t = await ticker.json();
  const s = await stats.json();
  return { bid: parseFloat(t.bid), ask: parseFloat(t.ask), volume24h: parseFloat(s.volume) };
};

const parseKraken = async (symbol) => {
  const map = { BTC: 'XBTUSD', ETH: 'ETHUSD', LTC: 'LTCUSD', XRP: 'XRPUSD' };
  const pair = map[symbol] || `${symbol}USD`;
  const res = await timeoutFetch(`https://api.kraken.com/0/public/Ticker?pair=${pair}`);
  const json = await res.json();
  const key = Object.keys(json.result || {})[0];
  const d = json.result?.[key];
  return { bid: parseFloat(d?.b?.[0]), ask: parseFloat(d?.a?.[0]), volume24h: parseFloat(d?.v?.[1] || d?.v?.[0] || 0) };
};

const aggregateSymbol = async (symbol) => {
  const results = await Promise.allSettled([
    parseBinance(symbol),
    parseCoinbase(symbol),
    parseKraken(symbol)
  ]);
  const mids = results.filter(r => r.status === 'fulfilled').map(r => {
    const v = r.value; return (v.bid + v.ask) / 2;
  }).filter(v => isFinite(v));
  if (!mids.length) return 0;
  return mids.reduce((a,b)=>a+b,0) / mids.length;
};

router.get('/', async (req, res) => {
  try {
    const now = Date.now();
    const symbolsParam = (req.query.symbols || '').toString();
    const baseSymbols = ['BTC','ETH','LTC','XRP'];
    const symbols = symbolsParam ? symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : baseSymbols;
    if (cache.prices && (now - cache.ts) < 3000) {
      const filtered = Object.fromEntries(symbols.map(s => [s, Number(cache.prices[s] || 0)]));
      return res.status(200).json({ prices: filtered });
    }
    const values = await Promise.all(symbols.map(aggregateSymbol));
    const prices = Object.fromEntries(symbols.map((s, i) => [s, Number(values[i] || 0)]));
    cache = { prices: { ...prices }, ts: now };
    res.status(200).json({ prices });
  } catch (e) {
    const fallback = cache.prices || { BTC: 0, ETH: 0, LTC: 0, XRP: 0 };
    res.status(200).json({ prices: fallback });
  }
});

module.exports = router;
