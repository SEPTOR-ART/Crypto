import { useState, useMemo } from 'react';
import styles from '../styles/Trade.module.css';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { useCryptoPrices } from '../hooks/useCryptoPrices';

export default function Margin() {
  const { user, loading: authLoading } = useAuth();
  const { prices, loading: pricesLoading } = useCryptoPrices();
  const [pair, setPair] = useState('BTC/USD');
  const [leverage, setLeverage] = useState(2);
  const [position, setPosition] = useState('long');
  const [entryPrice, setEntryPrice] = useState('45000');
  const [amount, setAmount] = useState('0.5');
  const rates = { BTC: { borrow: 0.08, lend: 0.03 }, ETH: { borrow: 0.1, lend: 0.04 }, LTC: { borrow: 0.12, lend: 0.05 }, XRP: { borrow: 0.15, lend: 0.06 } };
  const asset = pair.split('/')[0];

  const maintenance = 0.005;
  const calc = useMemo(() => {
    const ep = parseFloat(entryPrice) || 0;
    const a = parseFloat(amount) || 0;
    const L = parseFloat(leverage) || 1;
    const notional = ep * a;
    const margin = notional / L;
    const liq = position === 'long' ? ep * (1 - (1 / L) + maintenance) : ep * (1 + (1 / L) - maintenance);
    return { notional: notional.toFixed(2), margin: margin.toFixed(2), liquidation: liq.toFixed(2) };
  }, [entryPrice, amount, leverage, position]);

  if (authLoading || pricesLoading) {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className={styles.loading}>Loading...</div>
      </ProtectedRoute>
    );
  }

  if (!user) {
    return (
      <ProtectedRoute requireAuth={true}>
        <div></div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth={true}>
      <div className={styles.container}>
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.label}>MARGIN LAB</span>
            <h1 className={styles.title}>Margin Trading</h1>
            <p className={styles.subtitle}>Manage leveraged positions with risk tools</p>
          </div>
        </div>

        <div className={styles.tradingInterface}>
          <div className={styles.leftPanel}>
            <div className={styles.pairSelector}>
              <select value={pair} onChange={(e)=>setPair(e.target.value)} className={styles.cryptoSelect}>
                {['BTC/USD','ETH/USD','LTC/USD','XRP/USD'].map(p => <option key={p}>{p}</option>)}
              </select>
              <div className={styles.priceDisplay}>
                <span className={styles.currentPrice}>${parseFloat(prices[asset]||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                <span className={styles.priceChange}>+2.5%</span>
              </div>
            </div>

            <div className={styles.tradingPanel}>
              <div className={styles.panelHeader}>
                <button className={`${styles.panelTab} ${position==='long'?styles.activeTab:''}`} onClick={()=>setPosition('long')}>Long</button>
                <button className={`${styles.panelTab} ${position==='short'?styles.activeTab:''}`} onClick={()=>setPosition('short')}>Short</button>
              </div>
              <div className={styles.panelContent}>
                <div className={styles.tradeForm}>
                  <div className={styles.formGroup}>
                    <label>Leverage</label>
                    <select value={leverage} onChange={(e)=>setLeverage(Number(e.target.value))} className={styles.formControl}>
                      <option value={2}>2x</option>
                      <option value={5}>5x</option>
                      <option value={10}>10x</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Entry Price</label>
                    <input type="number" value={entryPrice} onChange={(e)=>setEntryPrice(e.target.value)} className={styles.formControl} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Amount</label>
                    <div className={styles.inputWithAddon}>
                      <input type="number" value={amount} onChange={(e)=>setAmount(e.target.value)} className={styles.formControl} />
                      <span className={styles.addon}>{asset}</span>
                    </div>
                  </div>
                  <div className={styles.balanceInfo}>
                    <span>Notional</span>
                    <span>${calc.notional}</span>
                  </div>
                  <div className={styles.balanceInfo}>
                    <span>Initial Margin</span>
                    <span>${calc.margin}</span>
                  </div>
                  <div className={styles.balanceInfo}>
                    <span>Liquidation Price</span>
                    <span>${calc.liquidation}</span>
                  </div>
                  <button type="button" className={`${styles.tradeButton} ${styles.buyButton}`}>Open {position} {asset}</button>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.rightPanel}>
            <div className={styles.quickStats}>
              <h3>Borrow/Lend Rates</h3>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}><span className={styles.statLabel}>Borrow</span><span className={styles.statValue}>{(rates[asset]?.borrow*100).toFixed(2)}%</span></div>
                <div className={styles.statItem}><span className={styles.statLabel}>Lend</span><span className={styles.statValue}>{(rates[asset]?.lend*100).toFixed(2)}%</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
