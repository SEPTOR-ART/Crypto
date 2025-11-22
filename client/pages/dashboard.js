import { useState, useEffect } from 'react';
import styles from '../styles/Dashboard.module.css';
import ChatSupport from '../components/ChatSupport';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { useCryptoPrices } from '../hooks/useCryptoPrices';
import { transactionService, authService } from '../services/api';
import ProtectedRoute from '../components/ProtectedRoute';
import Link from 'next/link';

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

// Check if user is admin
const isAdmin = (user) => {
  return user.email === 'admin@cryptozen.com' || user.email === 'admin@cryptoasia.com' || user.isAdmin;
};

export default function Dashboard() {
  const [holdings, setHoldings] = useState([]);
  const [portfolioValue, setPortfolioValue] = useState('0.00');
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [transactionsError, setTransactionsError] = useState('');
  const [accountInfo, setAccountInfo] = useState({});
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { prices: cryptoPrices, loading: pricesLoading } = useCryptoPrices();
  const router = useRouter();

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

  // Refresh user profile periodically to ensure balance is up to date
  useEffect(() => {
    if (!user) return;
    
    const refreshProfile = async () => {
      try {
        await refreshUser();
      } catch (error) {
        console.error('Failed to refresh user profile:', error);
      }
    };
    
    // Refresh profile every 60 seconds to reduce API load
    const interval = setInterval(refreshProfile, 60000);
    
    return () => clearInterval(interval);
  }, [user, refreshUser]);

  // Show loading state
  if (authLoading || pricesLoading) {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className={styles.loading}>Loading...</div>
      </ProtectedRoute>
    );
  }

  // Show nothing if not authenticated (redirecting)
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
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.logo}>
            <h1>CryptoZen</h1>
          </div>
          <nav className={styles.nav}>
            <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
            <Link href="/trade" className={styles.navLink}>Trade</Link>
            <Link href="/wallet" className={styles.navLink}>Wallet</Link>
            <Link href="/profile" className={styles.navLink}>Profile</Link>
            <Link href="/settings" className={styles.navLink}>Settings</Link>
            {isAdmin(user) && (
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
                <p className={styles.statValue}>+2.5%</p>
                <span className={styles.statChangePositive}>+125.00</span>
              </div>
              
              <div className={styles.statCard}>
                <h3>Active Assets</h3>
                <p className={styles.statValue}>{holdings.length}</p>
                <span className={styles.statChangeNeutral}>No change</span>
              </div>
              
              <div className={styles.statCard}>
                <h3>Transactions</h3>
                <p className={styles.statValue}>{transactions.length}</p>
                <span className={styles.statChangePositive}>+3 this week</span>
              </div>
            </div>
          </section>

          {/* Holdings */}
          <section className={styles.holdingsSection}>
            <div className={styles.sectionHeader}>
              <h2>Your Holdings</h2>
              <Link href="/trade" className={styles.tradeButton}>Trade</Link>
            </div>
            
            <div className={styles.holdingsGrid}>
              {holdings.length > 0 ? (
                holdings.map((holding) => (
                  <div key={holding.symbol} className={styles.holdingCard}>
                    <div className={styles.holdingHeader}>
                      <span className={styles.assetSymbol}>{holding.symbol}</span>
                      <span className={styles.assetName}>{holding.name}</span>
                    </div>
                    <div className={styles.holdingAmount}>
                      <span>{parseFloat(holding.amount).toFixed(6)}</span>
                      <span className={styles.assetValue}>${holding.value}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <p>You don&apos;t have any assets yet.</p>
                  <Link href="/trade" className={styles.getStartedButton}>Get Started</Link>
                </div>
              )}
            </div>
          </section>

          {/* Recent Transactions */}
          <section className={styles.transactionsSection}>
            <div className={styles.sectionHeader}>
              <h2>Recent Transactions</h2>
              <Link href="/wallet" className={styles.viewAllButton}>View All</Link>
            </div>
            
            <div className={styles.transactionsContainer}>
              {loadingTransactions ? (
                <div className={styles.loading}>Loading transactions...</div>
              ) : transactionsError ? (
                <div className={styles.error}>Failed to load transactions: {transactionsError}</div>
              ) : transactions.length > 0 ? (
                <div className={styles.transactionsList}>
                  {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction._id} className={styles.transactionItem}>
                      <div className={styles.transactionInfo}>
                        <span className={`${styles.transactionType} ${styles[transaction.type]}`}>
                          {transaction.type}
                        </span>
                        <span className={styles.transactionAsset}>{transaction.asset}</span>
                      </div>
                      <div className={styles.transactionDetails}>
                        <span className={styles.transactionAmount}>
                          {transaction.amount} {transaction.asset}
                        </span>
                        <span className={styles.transactionDate}>
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className={styles.transactionStatus}>
                        <span className={`${styles.statusBadge} ${styles[transaction.status]}`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>No transactions yet.</p>
                  <Link href="/trade" className={styles.getStartedButton}>Start Trading</Link>
                </div>
              )}
            </div>
          </section>

          {/* Account Information */}
          <section className={styles.accountSection}>
            <div className={styles.sectionHeader}>
              <h2>Account Information</h2>
              <Link href="/profile" className={styles.editButton}>Edit</Link>
            </div>
            
            <div className={styles.accountInfo}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Name</span>
                <span className={styles.infoValue}>{accountInfo.firstName} {accountInfo.lastName}</span>
              </div>
              
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>{accountInfo.email}</span>
              </div>
              
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Member Since</span>
                <span className={styles.infoValue}>
                  {accountInfo.createdAt ? new Date(accountInfo.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>KYC Status</span>
                <span className={`${styles.infoValue} ${styles.kycStatus} ${styles[accountInfo.kycStatus || 'notstarted']}`}>
                  {accountInfo.kycStatus || 'Not Started'}
                </span>
              </div>
              
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>2FA</span>
                <span className={styles.infoValue}>
                  {accountInfo.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </section>
        </main>
        
        <ChatSupport />
      </div>
    </ProtectedRoute>
  );
}