import { useState, useEffect } from 'react';
import styles from '../styles/Admin.module.css';
import ChatSupport from '../components/ChatSupport';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading state
  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  // Show nothing if not authenticated (redirecting)
  if (!user) {
    return null;
  }

  // Mock data for demonstration
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', kyc: 'verified', balance: 12500 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'active', kyc: 'pending', balance: 8750 },
    { id: 3, name: 'Robert Johnson', email: 'robert@example.com', status: 'suspended', kyc: 'verified', balance: 32000 },
    { id: 4, name: 'Emily Davis', email: 'emily@example.com', status: 'active', kyc: 'not started', balance: 5400 },
    { id: 5, name: 'Michael Wilson', email: 'michael@example.com', status: 'inactive', kyc: 'verified', balance: 18900 }
  ];

  const transactions = [
    { id: 1, user: 'John Doe', type: 'buy', crypto: 'BTC', amount: 0.5, status: 'completed', date: '2025-11-15' },
    { id: 2, user: 'Jane Smith', type: 'sell', crypto: 'ETH', amount: 2, status: 'pending', date: '2025-11-14' },
    { id: 3, user: 'Robert Johnson', type: 'buy', crypto: 'LTC', amount: 10, status: 'completed', date: '2025-11-13' },
    { id: 4, user: 'Emily Davis', type: 'buy', crypto: 'XRP', amount: 500, status: 'failed', date: '2025-11-12' }
  ];

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserAction = (userId, action) => {
    console.log(`Performing ${action} on user ${userId}`);
    // In a real app, this would make an API call
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Admin Dashboard</h1>
        <p>Manage users, transactions, and platform settings</p>
      </div>

      {/* Stats Overview */}
      <div className={styles.statsOverview}>
        <div className={styles.statCard}>
          <h3>Total Users</h3>
          <p className={styles.statValue}>1,250</p>
          <div className={styles.statChange}>+12% last 30 days</div>
        </div>
        
        <div className={styles.statCard}>
          <h3>Active Users</h3>
          <p className={styles.statValue}>890</p>
          <div className={styles.statChange}>+8% last 30 days</div>
        </div>
        
        <div className={styles.statCard}>
          <h3>Transactions</h3>
          <p className={styles.statValue}>4,520</p>
          <div className={styles.statChange}>+15% last 30 days</div>
        </div>
        
        <div className={styles.statCard}>
          <h3>Platform Volume</h3>
          <p className={styles.statValue}>$12.5M</p>
          <div className={styles.statChange}>+22% last 30 days</div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'users' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'transactions' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'settings' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Platform Settings
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'reports' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'users' && (
          <div className={styles.usersContent}>
            <div className={styles.contentHeader}>
              <h2>User Management</h2>
              <div className={styles.searchContainer}>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
                <button className={styles.searchButton}>Search</button>
              </div>
            </div>
            
            <div className={styles.tableContainer}>
              <table className={styles.usersTable}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>KYC Status</th>
                    <th>Balance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className={styles.userInfo}>
                          <div className={styles.avatar}>{user.name.charAt(0)}</div>
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[user.status]}`}>
                          {user.status}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.kycBadge} ${styles[user.kyc.replace(' ', '')]}`}>
                          {user.kyc}
                        </span>
                      </td>
                      <td>${user.balance.toLocaleString()}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button 
                            className={styles.viewButton}
                            onClick={() => handleUserAction(user.id, 'view')}
                          >
                            View
                          </button>
                          <button 
                            className={styles.editButton}
                            onClick={() => handleUserAction(user.id, 'edit')}
                          >
                            Edit
                          </button>
                          <button 
                            className={styles.suspendButton}
                            onClick={() => handleUserAction(user.id, 'suspend')}
                          >
                            Suspend
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className={styles.transactionsContent}>
            <div className={styles.contentHeader}>
              <h2>Transaction Management</h2>
              <div className={styles.filters}>
                <select className={styles.filterSelect}>
                  <option>All Types</option>
                  <option>Buy</option>
                  <option>Sell</option>
                </select>
                <select className={styles.filterSelect}>
                  <option>All Statuses</option>
                  <option>Completed</option>
                  <option>Pending</option>
                  <option>Failed</option>
                </select>
              </div>
            </div>
            
            <div className={styles.tableContainer}>
              <table className={styles.transactionsTable}>
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>User</th>
                    <th>Type</th>
                    <th>Asset</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(transaction => (
                    <tr key={transaction.id}>
                      <td>#{transaction.id}</td>
                      <td>{transaction.user}</td>
                      <td>
                        <span className={`${styles.transactionType} ${styles[transaction.type]}`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td>{transaction.crypto}</td>
                      <td>{transaction.amount} {transaction.crypto}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[transaction.status]}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td>{transaction.date}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button className={styles.viewButton}>View</button>
                          <button className={styles.approveButton}>Approve</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className={styles.settingsContent}>
            <h2>Platform Settings</h2>
            
            <div className={styles.settingsSection}>
              <h3>Security Settings</h3>
              <div className={styles.settingGroup}>
                <div className={styles.settingItem}>
                  <div>
                    <h4>Two-Factor Authentication</h4>
                    <p>Require 2FA for all admin accounts</p>
                  </div>
                  <label className={styles.switch}>
                    <input type="checkbox" defaultChecked />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                
                <div className={styles.settingItem}>
                  <div>
                    <h4>IP Whitelisting</h4>
                    <p>Restrict admin access to specific IP addresses</p>
                  </div>
                  <label className={styles.switch}>
                    <input type="checkbox" />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className={styles.settingsSection}>
              <h3>Trading Settings</h3>
              <div className={styles.settingGroup}>
                <div className={styles.settingItem}>
                  <div>
                    <h4>Maintenance Mode</h4>
                    <p>Temporarily disable trading for maintenance</p>
                  </div>
                  <label className={styles.switch}>
                    <input type="checkbox" />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                
                <div className={styles.settingItem}>
                  <div>
                    <h4>Withdrawal Limits</h4>
                    <p>Set daily withdrawal limits for users</p>
                  </div>
                  <button className={styles.editButton}>Configure</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className={styles.reportsContent}>
            <h2>Reports & Analytics</h2>
            
            <div className={styles.reportCards}>
              <div className={styles.reportCard}>
                <h3>User Activity Report</h3>
                <p>View user login patterns and activity metrics</p>
                <button className={styles.generateButton}>Generate Report</button>
              </div>
              
              <div className={styles.reportCard}>
                <h3>Financial Report</h3>
                <p>Generate revenue and transaction volume reports</p>
                <button className={styles.generateButton}>Generate Report</button>
              </div>
              
              <div className={styles.reportCard}>
                <h3>Compliance Report</h3>
                <p>Export KYC and transaction compliance data</p>
                <button className={styles.generateButton}>Generate Report</button>
              </div>
              
              <div className={styles.reportCard}>
                <h3>System Performance</h3>
                <p>Monitor platform uptime and performance metrics</p>
                <button className={styles.generateButton}>Generate Report</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <ChatSupport />
    </div>
  );
}