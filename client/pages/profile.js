import { useState, useEffect } from 'react';
import styles from '../styles/Settings.module.css';
import ChatSupport from '../components/ChatSupport';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import Link from 'next/link';

export default function Profile() {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    createdAt: null,
    kycStatus: 'not started',
    twoFactorEnabled: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { user, loading, updateProfile, refreshUser } = useAuth();

  // Initialize profile with user data
  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        createdAt: user.createdAt || null,
        kycStatus: user.kycStatus || 'not started',
        twoFactorEnabled: user.twoFactorEnabled || false
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
      
      // Refresh profile every 5 minutes to reduce API load and avoid rate limits
      intervalId = setInterval(refreshProfile, 300000);
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
        <div className={styles.container}>
          <div className={styles.loading}>Loading...</div>
        </div>
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

  return (
    <ProtectedRoute requireAuth={true}>
      <div className={styles.container}>
        <div className={styles.settingsHeader}>
          <h1>User Profile</h1>
          <p>Manage your personal information and account settings</p>
        </div>

        <div className={styles.settingsTabs}>
          <button className={`${styles.tabButton} ${styles.activeTab}`}>
            Profile
          </button>
          <Link href="/settings">
            <button className={styles.tabButton}>
              Account Settings
            </button>
          </Link>
        </div>

        <div className={styles.settingsContent}>
          <div className={styles.profileSection}>
            <h2>Personal Information</h2>
            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>Profile updated successfully!</div>}
            
            <form onSubmit={handleProfileUpdate}>
              <div className={styles.avatarUpload}>
                <div className={styles.avatarPreview}>
                  {profile.firstName ? profile.firstName.charAt(0) : 'U'}
                  {profile.lastName ? profile.lastName.charAt(0) : ''}
                </div>
                <button type="button" className={styles.uploadButton}>
                  Change Avatar
                </button>
              </div>
              
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

          <div className={styles.profileSection}>
            <h2>Account Information</h2>
            
            <div className={styles.securitySection}>
              <div className={styles.securityOption}>
                <div>
                  <h3>Member Since</h3>
                  <p>
                    {profile.createdAt 
                      ? new Date(profile.createdAt).toLocaleDateString() 
                      : 'Not available'}
                  </p>
                </div>
              </div>
              
              <div className={styles.securityOption}>
                <div>
                  <h3>KYC Status</h3>
                  <p className={profile.kycStatus === 'verified' ? styles.success : styles.error}>
                    {profile.kycStatus.charAt(0).toUpperCase() + profile.kycStatus.slice(1)}
                  </p>
                </div>
                <button className={styles.changePasswordButton}>
                  {profile.kycStatus === 'verified' ? 'View Details' : 'Complete Verification'}
                </button>
              </div>
              
              <div className={styles.securityOption}>
                <div>
                  <h3>Two-Factor Authentication</h3>
                  <p>{profile.twoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
                </div>
                <button className={styles.changePasswordButton}>
                  {profile.twoFactorEnabled ? 'Manage' : 'Enable'}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <ChatSupport />
      </div>
    </ProtectedRoute>
  );
}