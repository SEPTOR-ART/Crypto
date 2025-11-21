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
  const { user, loading: authLoading, updateProfile } = useAuth();
  const { prices: cryptoPrices, loading: pricesLoading } = useCryptoPrices();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Calculate holdings based on user's balance
  const calculateHoldingsFromBalance = (userBalance, currentPrices) => {
    // Convert balance map to array and calculate values
    const holdingsArray = [];
    
    // Handle cases where userBalance might be undefined, null, or not an object
    if (userBalance && typeof userBalance === 'object') {
      // For Map-like objects, we need to handle them differently
      if (userBalance instanceof Map || (typeof userBalance.forEach === 'function')) {
        userBalance.forEach((amount, asset) => {
          if (amount > 0) {
            const price = currentPrices[asset] || 0;
            holdingsArray.push({
              symbol: asset,
              name: getAssetName(asset),
              amount: amount,
              value: (amount * price).toFixed(2)
            });
          }
        });
      } else {
        // For plain objects
        Object.entries(userBalance).forEach(([asset, amount]) => {
          if (amount > 0) {
            const price = currentPrices[asset] || 0;
            holdingsArray.push({
              symbol: asset,
              name: getAssetName(asset),
              amount: amount,
              value: (amount * price).toFixed(2)
            });
          }
        });
      }
    }
    
    return holdingsArray;
  };

  // Get full name for asset symbol
  const getAssetName = (symbol) => {
    const names = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'LTC': 'Litecoin',
      'XRP': 'Ripple'
    };
    return names[symbol] || symbol;
  };

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
        
        // Calculate holdings based on user's balance
        const calculatedHoldings = calculateHoldingsFromBalance(user.balance || {}, cryptoPrices);
        setHoldings(calculatedHoldings);
        
        // Calculate total portfolio value
        const totalValue = calculatedHoldings.reduce((sum, holding) => sum + parseFloat(holding.value), 0);
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
            <div className={styles.overviewTab}>
              <h3>Portfolio Holdings</h3>
              {holdings.length > 0 ? (
                <div className={styles.holdingsGrid}>
                  {holdings.map((holding) => (
                    <div key={holding.symbol} className={styles.holdingCard}>
                      <div className={styles.holdingHeader}>
                        <h4>{holding.name} ({holding.symbol})</h4>
                      </div>
                      <div className={styles.holdingDetails}>
                        <div className={styles.holdingAmount}>
                          <span className={styles.label}>Amount:</span>
                          <span className={styles.value}>{holding.amount.toFixed(6)}</span>
                        </div>
                        <div className={styles.holdingValue}>
                          <span className={styles.label}>Value:</span>
                          <span className={styles.value}>${holding.value}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.noHoldings}>No holdings yet. Start trading to build your portfolio!</p>
              )}
            </div>
          )}

          {activeTab === 'holdings' && (
            <div className={styles.holdingsTab}>
              <h3>Your Holdings</h3>
              {holdings.length > 0 ? (
                <table className={styles.holdingsTable}>
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Name</th>
                      <th>Amount</th>
                      <th>Price</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((holding) => (
                      <tr key={holding.symbol}>
                        <td>{holding.symbol}</td>
                        <td>{holding.name}</td>
                        <td>{holding.amount.toFixed(6)}</td>
                        <td>${(cryptoPrices[holding.symbol] || 0).toFixed(2)}</td>
                        <td>${holding.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className={styles.noHoldings}>No holdings yet. Start trading to build your portfolio!</p>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className={styles.transactionsTab}>
              <h3>Transaction History</h3>
              {loadingTransactions ? (
                <p>Loading transactions...</p>
              ) : transactionsError ? (
                <p className={styles.error}>Error loading transactions: {transactionsError}</p>
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
                    {transactions.map((transaction) => (
                      <tr key={transaction._id}>
                        <td>{new Date(transaction.createdAt).toLocaleDateString()}</td>
                        <td className={styles[transaction.type]}>{transaction.type}</td>
                        <td>{transaction.asset}</td>
                        <td>{transaction.amount}</td>
                        <td>${transaction.price.toFixed(2)}</td>
                        <td>${transaction.total.toFixed(2)}</td>
                        <td className={styles[transaction.status]}>{transaction.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className={styles.noTransactions}>No transactions yet.</p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Chat Support */}
      <ChatSupport />

      {/* Footer */}
      <footer className={styles.footer}>
        <p>&copy; 2025 CryptoZen. All rights reserved.</p>
      </footer>
    </div>
  );
}