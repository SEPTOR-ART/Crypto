import { useMemo } from 'react';
import styles from '../styles/Trade.module.css';
import { useMarketData } from '../hooks/useMarketData';
import Link from 'next/link';

export default function Rates() {
  const { data, metrics, history, loading, error } = useMarketData({ symbols: ['BTCUSD','ETHUSD','LTCUSD','XRPUSD'], metrics: true, history: true, refreshMs: 4000 });
  const items = useMemo(() => Array.isArray(data) ? data : [], [data]);

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.label}>RATES LAB</span>
          <h1 className={styles.title}>Real-Time Crypto Rates</h1>
          <p className={styles.subtitle}>Aggregated from multiple exchanges with verification</p>
        </div>
      </div>

      <div className={styles.marketStats}>
        {loading && <div className={styles.loading}>Loading...</div>}
        {error && <div className={styles.errorMessage}>{String(error.message || error)}</div>}
        {!loading && !error && items.map((d) => {
          const mid = d.verified?.priceMid || 0;
          const vwap = d.verified?.vwap || 0;
          const alert = d.verified?.alert;
          const disc = d.verified?.discrepancyPct || 0;
          const change = Object.values(d.sources || {}).map(s => s.change24hPct).find(v => typeof v === 'number') || 0;
          return (
            <div key={d.symbol} className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.cryptoName}>{d.symbol.replace('USD','/USD')}</span>
                <span className={styles.cryptoSymbol}>{d.symbol.slice(0,3)}</span>
              </div>
              <div className={styles.statPrice}>${mid.toFixed(2)}</div>
              <div className={styles.statChange}>{(change>=0?'+':'') + change.toFixed(2)}%</div>
              <div className={styles.statsGrid} style={{marginTop:'.75rem'}}>
                <div className={styles.statItem}><span className={styles.statLabel}>VWAP</span><span className={styles.statValue}>${vwap.toFixed(2)}</span></div>
                <div className={styles.statItem}><span className={styles.statLabel}>Discrepancy</span><span className={styles.statValue}>{disc.toFixed(2)}%</span></div>
                <div className={styles.statItem}><span className={styles.statLabel}>Sources</span><span className={styles.statValue}>{Object.keys(d.sources||{}).length}</span></div>
                <div className={styles.statItem}><span className={styles.statLabel}>Alert</span><span className={styles.statValue} style={{color: alert ? '#d63384' : '#00d488'}}>{alert ? 'Yes' : 'No'}</span></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.tradingInterface}>
        <div className={styles.rightPanel}>
          <div className={styles.quickStats}>
            <h3>System Metrics</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}><span className={styles.statLabel}>Successes</span><span className={styles.statValue}>{metrics?.successes ?? 0}</span></div>
              <div className={styles.statItem}><span className={styles.statLabel}>Failures</span><span className={styles.statValue}>{metrics?.failures ?? 0}</span></div>
              <div className={styles.statItem}><span className={styles.statLabel}>Last Duration</span><span className={styles.statValue}>{(metrics?.lastDurationMs ?? 0)}ms</span></div>
              <div className={styles.statItem}><span className={styles.statLabel}>Last Error</span><span className={styles.statValue}>{metrics?.lastError || 'None'}</span></div>
            </div>
          </div>
          <div className={styles.quickStats}>
            <h3>History (VWAP)</h3>
            <div className={styles.statsGrid}>
              {items.map((d) => {
                const h = history?.[d.symbol] || {};
                return (
                  <div key={d.symbol} className={styles.statItem}>
                    <span className={styles.statLabel}>{d.symbol.replace('USD','/USD')}</span>
                    <span className={styles.statValue}>M {Number(h.minute||0).toFixed(2)} • H {Number(h.hourly||0).toFixed(2)} • D {Number(h.daily||0).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div style={{textAlign:'center',margin:'2rem 0'}}>
        <Link href="/trade" className={styles.largeButton}>Go to Trade</Link>
      </div>
    </div>
  );
}

