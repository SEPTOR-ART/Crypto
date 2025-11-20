import { useState, useEffect } from 'react';
import styles from '../styles/Settings.module.css';
import ChatSupport from '../components/ChatSupport';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

export default function Settings() {
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
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
  const { user, loading, updateProfile } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Initialize profile with user data
  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || ''
      });
      
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

  // Show loading state
  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  // Show nothing if not authenticated (redirecting)
  if (!user) {
    return null;
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    try {
      await updateProfile(profile);
      setSuccess(true);
      setError('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Profile update failed:', err);
      setError(err.message || 'Failed to update profile');
      setSuccess(false);
    }
  };

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
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <h2>Settings</h2>
        <nav className={styles.nav}>
          <button 
            className={`${styles.navItem} ${activeSection === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveSection('profile')}
          >
            Profile
          </button>
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
        {activeSection === 'profile' && (
          <div className={styles.section}>
            <h2>Profile Information</h2>
            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>Profile updated successfully!</div>}
            <form onSubmit={handleProfileUpdate} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  value={profile.firstName}
                  onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                  autoComplete="given-name"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  value={profile.lastName}
                  onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                  autoComplete="family-name"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={profile.email}
                  onChange={(e) => setProfile({...profile, email: e.target.value})}
                  autoComplete="email"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  autoComplete="tel"
                />
              </div>
              
              <button type="submit" className={styles.saveButton}>Save Changes</button>
            </form>
          </div>
        )}

        {activeSection === 'security' && (
          <div className={styles.section}>
            <h2>Security Settings</h2>
            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>Security settings updated successfully!</div>}
            
            <div className={styles.settingGroup}>
              <div className={styles.settingItem}>
                <div>
                  <h3>Two-Factor Authentication</h3>
                  <p>Protect your account with an additional layer of security</p>
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
                  <p>Update your account password</p>
                </div>
                <button className={styles.actionButton}>Change</button>
              </div>
              
              <div className={styles.settingItem}>
                <div>
                  <h3>Active Sessions</h3>
                  <p>View and manage your active sessions</p>
                </div>
                <button className={styles.actionButton}>View</button>
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <button type="button" className={styles.saveButton} onClick={handleSecurityUpdate}>
                Save Security Settings
              </button>
            </div>
          </div>
        )}

        {activeSection === 'verification' && (
          <div className={styles.section}>
            <h2>Identity Verification</h2>
            <p>Complete verification to increase your trading limits and access more features.</p>
            
            <div className={styles.verificationCards}>
              <div className={`${styles.verificationCard} ${verification.idVerified ? styles.verified : ''}`}>
                <div className={styles.cardHeader}>
                  <h3>Identity Verification</h3>
                  {verification.idVerified ? (
                    <span className={styles.verifiedBadge}>Verified</span>
                  ) : (
                    <span className={styles.pendingBadge}>Pending</span>
                  )}
                </div>
                <p>Upload a government-issued ID to verify your identity</p>
                {!verification.idVerified && (
                  <button className={styles.uploadButton}>Upload ID</button>
                )}
              </div>
              
              <div className={`${styles.verificationCard} ${verification.addressVerified ? styles.verified : ''}`}>
                <div className={styles.cardHeader}>
                  <h3>Address Verification</h3>
                  {verification.addressVerified ? (
                    <span className={styles.verifiedBadge}>Verified</span>
                  ) : (
                    <span className={styles.pendingBadge}>Pending</span>
                  )}
                </div>
                <p>Provide proof of residence to verify your address</p>
                {!verification.addressVerified && (
                  <button className={styles.uploadButton}>Upload Document</button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'notifications' && (
          <div className={styles.section}>
            <h2>Notification Preferences</h2>
            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>Notification preferences updated successfully!</div>}
            
            <div className={styles.settingGroup}>
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
                  <p>Receive alerts and updates via text message</p>
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
            </div>
            
            <div className={styles.formGroup}>
              <button type="button" className={styles.saveButton} onClick={() => {
                setSuccess(true);
                setError('');
                
                // Clear success message after 3 seconds
                setTimeout(() => {
                  setSuccess(false);
                }, 3000);
              }}>
                Save Notification Preferences
              </button>
            </div>
          </div>
        )}

        {activeSection === 'preferences' && (
          <div className={styles.section}>
            <h2>Preferences</h2>
            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>Preferences updated successfully!</div>}
            
            <div className={styles.formGroup}>
              <label htmlFor="language">Language</label>
              <select id="language" className={styles.select}>
                <option>English</option>
                <option>中文</option>
                <option>日本語</option>
                <option>한국어</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="currency">Preferred Currency</label>
              <select id="currency" className={styles.select}>
                <option>USD - US Dollar</option>
                <option>EUR - Euro</option>
                <option>GBP - British Pound</option>
                <option>JPY - Japanese Yen</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="theme">Theme</label>
              <select id="theme" className={styles.select}>
                <option>Light</option>
                <option>Dark</option>
                <option>Auto</option>
              </select>
            </div>
            
            <div className={styles.settingGroup}>
              <div className={styles.settingItem}>
                <div>
                  <h3>Hide Balances</h3>
                  <p>Hide account balances for privacy</p>
                </div>
                <label className={styles.switch}>
                  <input type="checkbox" />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <button type="button" className={styles.saveButton} onClick={() => {
                setSuccess(true);
                setError('');
                
                // Clear success message after 3 seconds
                setTimeout(() => {
                  setSuccess(false);
                }, 3000);
              }}>
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
      <ChatSupport />
    </div>
  );
}