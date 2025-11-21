import { useState, useEffect } from 'react';
import styles from '../styles/Dashboard.module.css';
import Link from 'next/link';
import ChatSupport from '../components/ChatSupport';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { useCryptoPrices } from '../hooks/useCryptoPrices';
import { transactionService } from '../services/api';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [transactionsError, setTransactionsError] = useState('');
  const [accountInfo, setAccountInfo] = useState({});
  const { user, loading: authLoading } = useAuth();
  const { prices: cryptoPrices, loading: pricesLoading } = useCryptoPrices();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch user transactions and account info
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoadingTransactions(true);
        setTransactionsError('');
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }
        
        // Fetch user transactions
        const userTransactions = await transactionService.getUserTransactions(token);
        setTransactions(userTransactions);
        
        // Set account info from user data
        setAccountInfo({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          kycStatus: user.kycStatus,
          twoFactorEnabled: user.twoFactorEnabled,
          createdAt: user.createdAt
        });
        
        // Calculate portfolio value based on real user data
        // For now, we'll simulate this with mock data
        // In a real implementation, this would come from the user's actual holdings
        const mockHoldings = [
          { id: 1, name: 'Bitcoin', symbol: 'BTC', amount: 0.5, value: (0.5 * (cryptoPrices.BTC || 45000)).toFixed(2) },
          { id: 2, name: 'Ethereum', symbol: 'ETH', amount: 5, value: (5 * (cryptoPrices.ETH || 3000)).toFixed(2) },
          { id: 3, name: 'Litecoin', symbol: 'LTC', amount: 20, value: (20 * (cryptoPrices.LTC || 150)).toFixed(2) },
          { id: 4, name: 'Ripple', symbol: 'XRP', amount: 1000, value: (1000 * (cryptoPrices.XRP || 1.2)).toFixed(2) }
        ];
        setHoldings(mockHoldings);
        
        // Calculate total portfolio value
        const totalValue = mockHoldings.reduce((sum, holding) => sum + parseFloat(holding.value), 0);
        setPortfolioValue(totalValue.toFixed(2));
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setTransactionsError(err.message || 'Failed to load data');
      } finally {
        setLoadingTransactions(false);
      }
    };
    
    fetchData();
  }, [user, cryptoPrices]);

  // Show loading state
  if (authLoading || pricesLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  // Show nothing if not authenticated (redirecting)
  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <h1>CryptoZen</h1>
        </div>
        <nav className={styles.nav}>
          <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
          <Link href="/trade" className={styles.navLink}>Trade</Link>
          <Link href="/wallet" className={styles.navLink}>Wallet</Link>
          <Link href="/settings" className={styles.navLink}>Settings</Link>
          {user.email === 'admin@cryptozen.com' && (
            <Link href="/admin" className={styles.navLink}>Admin</Link>
          )}
        </nav>
        <div className={styles.userMenu}>
          <button className={styles.userButton}>
            {user.firstName ? `${user.firstName.charAt(0)}${user.lastName ? user.lastName.charAt(0) : ''}` : 'User'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Portfolio Overview */}
        <section className={styles.portfolioOverview}>
          <div className={styles.portfolioHeader}>
            <h2>Portfolio Overview</h2>
            <div className={styles.portfolioValue}>
              <span className={styles.valueLabel}>Total Value</span>
              <span className={styles.valueAmount}>${portfolioValue}</span>
            </div>
          </div>
          
          <div className={styles.portfolioStats}>
            <div className={styles.statCard}>
              <h3>24h Change</h3>
              <p className={styles.positiveChange}>+$1,250.50 (+2.5%)</p>
            </div>
            <div className={styles.statCard}>
              <h3>Assets</h3>
              <p>{holdings.length} Cryptocurrencies</p>
            </div>
            <div className={styles.statCard}>
              <h3>P&L</h3>
              <p className={styles.positiveChange}>+$5,420.75</p>
            </div>
          </div>
        </section>

        {/* Account Information */}
        <section className={styles.accountInfo}>
          <h2>Account Information</h2>
          <div className={styles.accountDetails}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Name:</span>
              <span className={styles.value}>{accountInfo.firstName} {accountInfo.lastName}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Email:</span>
              <span className={styles.value}>{accountInfo.email}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Member Since:</span>
              <span className={styles.value}>
                {accountInfo.createdAt ? new Date(accountInfo.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>KYC Status:</span>
              <span className={`${styles.value} ${styles.kycStatus} ${styles[accountInfo.kycStatus || 'notstarted']}`}>
                {accountInfo.kycStatus || 'Not Started'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>2FA:</span>
              <span className={styles.value}>
                {accountInfo.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'holdings' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('holdings')}
          >
            Holdings
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'transactions' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'overview' && (
            <div className={styles.overviewContent}>
              <div className={styles.chartPlaceholder}>
                <p>Price Chart Visualization</p>
                <div className={styles.chartArea}>
                  {/* Chart would go here in a real implementation */}
                </div>
              </div>
              
              <div className={styles.quickActions}>
                <h3>Quick Actions</h3>
                <div className={styles.actionButtons}>
                  <button className={styles.actionButton}>Buy Crypto</button>
                  <button className={styles.actionButton}>Sell Crypto</button>
                  <button className={styles.actionButton}>Send</button>
                  <button className={styles.actionButton}>Receive</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'holdings' && (
            <div className={styles.holdingsContent}>
              <table className={styles.holdingsTable}>
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Holdings</th>
                    <th>Price</th>
                    <th>Value</th>
                    <th>Allocation</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map(holding => (
                    <tr key={holding.id}>
                      <td>
                        <div className={styles.assetInfo}>
                          <span className={styles.assetSymbol}>{holding.symbol}</span>
                          <span className={styles.assetName}>{holding.name}</span>
                        </div>
                      </td>
                      <td>{holding.amount} {holding.symbol}</td>
                      <td>${cryptoPrices[holding.symbol] || 'N/A'}</td>
                      <td>${holding.value}</td>
                      <td>
                        <div className={styles.allocationBar}>
                          <div 
                            className={styles.allocationFill} 
                            style={{ width: `${(parseFloat(holding.value) / parseFloat(portfolioValue)) * 100 || 0}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className={styles.transactionsContent}>
              {transactionsError && <div className={styles.error}>{transactionsError}</div>}
              {loadingTransactions ? (
                <div className={styles.loading}>Loading transactions...</div>
              ) : transactions.length > 0 ? (
                <table className={styles.transactionsTable}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Asset</th>
                      <th>Amount</th>
                      <th>Price</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(transaction => (
                      <tr key={transaction._id}>
                        <td>{new Date(transaction.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`${styles.transactionType} ${styles[transaction.type]}`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td>{transaction.asset}</td>
                        <td>{transaction.amount} {transaction.asset}</td>
                        <td>${transaction.price}</td>
                        <td>${(transaction.amount * transaction.price).toFixed(2)}</td>
                        <td>
                          <span className={`${styles.status} ${styles[transaction.status]}`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.noTransactions}>
                  <p>No transactions found</p>
                  <button className={styles.actionButton}>Buy Crypto</button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <ChatSupport />
    </div>
  );
}