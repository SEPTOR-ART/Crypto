import { useState, useEffect } from 'react';
import styles from '../styles/Settings.module.css';
import ChatSupport from '../components/ChatSupport';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/ProtectedRoute';
import Link from 'next/link';

export default function Settings() {
  const [activeSection, setActiveSection] = useState('security');
  const [security, setSecurity] = useState({
    twoFactor: false,
    emailNotifications: true,
    smsNotifications: false
  });
  const [verification, setVerification] = useState({
    idVerified: false,
    addressVerified: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();

  // Initialize security settings with user data
  useEffect(() => {
    if (user) {
      setSecurity({
        twoFactor: user.twoFactorEnabled || false,
        emailNotifications: true,
        smsNotifications: false
      });
      
      setVerification({
        idVerified: user.kycStatus === 'verified',
        addressVerified: false
      });
    }
  }, [user]);

  // Refresh user profile periodically to ensure data is up to date
  useEffect(() => {
    if (!user) return;
    
    // Clear any existing interval
    let intervalId;
    
    const startInterval = () => {
      // Clear any existing interval
      if (intervalId) {
        clearInterval(intervalId);
      }
      
      const refreshProfile = async () => {
        try {
          await refreshUser();
        } catch (error) {
          console.error('Failed to refresh user profile:', error);
        }
      };
      
      // Refresh profile every 60 seconds to reduce API load
      intervalId = setInterval(refreshProfile, 60000);
    };
    
    startInterval();
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user, refreshUser]);

  // Show loading state
  if (loading) {
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

  const handleSecurityUpdate = (e) => {
    e.preventDefault();
    // Handle security update logic
    console.log('Security settings updated:', security);
    setSuccess(true);
    setError('');
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccess(false);
    }, 3000);
  };

  return (
    <ProtectedRoute requireAuth={true}>
      <div className={styles.container}>
        {/* Hero Section */}
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.label}>SETTINGS</span>
            <h1 className={styles.title}>Account Settings</h1>
            <p className={styles.subtitle}>Manage your account preferences and security settings</p>
          </div>
        </div>

        <div className={styles.settingsContent}>
          <div className={styles.sidebar}>
            <nav className={styles.nav}>
              <button 
                className={`${styles.navItem} ${activeSection === 'security' ? styles.active : ''}`}
                onClick={() => setActiveSection('security')}
              >
                Security
              </button>
              <button 
                className={`${styles.navItem} ${activeSection === 'verification' ? styles.active : ''}`}
                onClick={() => setActiveSection('verification')}
              >
                Verification
              </button>
              <button 
                className={`${styles.navItem} ${activeSection === 'notifications' ? styles.active : ''}`}
                onClick={() => setActiveSection('notifications')}
              >
                Notifications
              </button>
              <button 
                className={`${styles.navItem} ${activeSection === 'preferences' ? styles.active : ''}`}
                onClick={() => setActiveSection('preferences')}
              >
                Preferences
              </button>
            </nav>
          </div>

          <div className={styles.content}>
            {activeSection === 'security' && (
              <div className={styles.section}>
                <h2>Security Settings</h2>
                {error && <div className={styles.error}>{error}</div>}
                {success && <div className={styles.success}>Security settings updated successfully!</div>}
                
                <div className={styles.securitySection}>
                  <div className={styles.settingItem}>
                    <div>
                      <h3>Two-Factor Authentication</h3>
                      <p>Add an extra layer of security to your account</p>
                    </div>
                    <label className={styles.switch}>
                      <input 
                        type="checkbox" 
                        checked={security.twoFactor}
                        onChange={(e) => setSecurity({...security, twoFactor: e.target.checked})}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3>Change Password</h3>
                      <p>Update your password regularly for better security</p>
                    </div>
                    <button className={styles.actionButton}>Change</button>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3>Login History</h3>
                      <p>View your recent login activity</p>
                    </div>
                    <button className={styles.actionButton}>View</button>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3>Session Management</h3>
                      <p>View and manage active sessions</p>
                    </div>
                    <button className={styles.actionButton}>Manage</button>
                  </div>
                </div>
                
                <button 
                  onClick={handleSecurityUpdate}
                  className={styles.saveButton}
                >
                  Save Security Settings
                </button>
              </div>
            )}

            {activeSection === 'verification' && (
              <div className={styles.section}>
                <h2>Identity Verification</h2>
                <p>Complete verification to increase your trading limits and withdrawal amounts.</p>
                
                <div className={styles.verificationSection}>
                  <div className={`${styles.verificationItem} ${verification.idVerified ? styles.verified : ''}`}>
                    <div className={styles.verificationHeader}>
                      <h3>Government ID</h3>
                      {verification.idVerified && <span className={styles.verifiedBadge}>Verified</span>}
                    </div>
                    <p>Upload a government-issued ID (passport, driver&apos;s license, etc.)</p>
                    <button className={styles.uploadButton}>Upload ID</button>
                  </div>
                  
                  <div className={`${styles.verificationItem} ${verification.addressVerified ? styles.verified : ''}`}>
                    <div className={styles.verificationHeader}>
                      <h3>Proof of Address</h3>
                      {verification.addressVerified && <span className={styles.verifiedBadge}>Verified</span>}
                    </div>
                    <p>Upload a utility bill or bank statement (within last 3 months)</p>
                    <button className={styles.uploadButton}>Upload Document</button>
                  </div>
                  
                  <div className={styles.verificationItem}>
                    <div className={styles.verificationHeader}>
                      <h3>Selfie Verification</h3>
                    </div>
                    <p>Take a selfie to confirm your identity</p>
                    <button className={styles.uploadButton}>Take Selfie</button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className={styles.section}>
                <h2>Notification Preferences</h2>
                
                <div className={styles.notificationSection}>
                  <div className={styles.settingItem}>
                    <div>
                      <h3>Email Notifications</h3>
                      <p>Receive important updates and alerts via email</p>
                    </div>
                    <label className={styles.switch}>
                      <input 
                        type="checkbox" 
                        checked={security.emailNotifications}
                        onChange={(e) => setSecurity({...security, emailNotifications: e.target.checked})}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3>SMS Notifications</h3>
                      <p>Receive important alerts via text message</p>
                    </div>
                    <label className={styles.switch}>
                      <input 
                        type="checkbox" 
                        checked={security.smsNotifications}
                        onChange={(e) => setSecurity({...security, smsNotifications: e.target.checked})}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3>Price Alerts</h3>
                      <p>Get notified when prices reach your target levels</p>
                    </div>
                    <label className={styles.switch}>
                      <input type="checkbox" />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3>Trade Confirmations</h3>
                      <p>Receive confirmations for all trades</p>
                    </div>
                    <label className={styles.switch}>
                      <input type="checkbox" defaultChecked />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'preferences' && (
              <div className={styles.section}>
                <h2>Preferences</h2>
                
                <div className={styles.preferenceSection}>
                  <div className={styles.settingItem}>
                    <div>
                      <h3>Dark Mode</h3>
                      <p>Switch to dark theme for better viewing</p>
                    </div>
                    <label className={styles.switch}>
                      <input type="checkbox" />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3>Language</h3>
                      <p>Select your preferred language</p>
                    </div>
                    <select className={styles.select}>
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3>Currency</h3>
                      <p>Select your preferred currency display</p>
                    </div>
                    <select className={styles.select}>
                      <option>USD - US Dollar</option>
                      <option>EUR - Euro</option>
                      <option>GBP - British Pound</option>
                      <option>JPY - Japanese Yen</option>
                    </select>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3>Time Zone</h3>
                      <p>Select your local time zone</p>
                    </div>
                    <select className={styles.select}>
                      <option>UTC-5 - Eastern Time</option>
                      <option>UTC-8 - Pacific Time</option>
                      <option>UTC+0 - Greenwich Mean Time</option>
                      <option>UTC+9 - Japan Standard Time</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <ChatSupport />
      </div>
    </ProtectedRoute>
  );
}