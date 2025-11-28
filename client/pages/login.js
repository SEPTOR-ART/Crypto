import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Login.module.css';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const { login } = useAuth();
  const router = useRouter();
  const nextUrl = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('next') || '') : '';
  const reason = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('reason') || '') : '';

  useEffect(() => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  }, [email]);
  
  useEffect(() => {
    if (password && password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
    } else if (password && !/[A-Z]/.test(password)) {
      setPasswordError('Password must contain at least one uppercase letter');
    } else if (password && !/[a-z]/.test(password)) {
      setPasswordError('Password must contain at least one lowercase letter');
    } else if (password && !/\d/.test(password)) {
      setPasswordError('Password must contain at least one number');
    } else {
      setPasswordError('');
    }
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (emailError || passwordError) {
      setError('Please fix the errors before submitting');
      return;
    }
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await login({ email, password }, nextUrl);
    } catch (err) {
      // Handle specific error messages
      if (err.message.includes('Invalid email or password')) {
        setError('Invalid email or password. Please try again.');
      } else if (err.message.includes('Network Error')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err.message || 'Failed to login. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requireAuth={false}>
      <div className={styles.container}>
        <div className={styles.leftPanel}>
          <div className={styles.brandSection}>
            <h1 className={styles.brandTitle}>CryptoZen</h1>
            <p className={styles.brandTagline}>The Future of Digital Asset Trading</p>
          </div>
          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>📈</div>
              <h3>Real-Time Data</h3>
              <p>Access live market data and advanced charting tools</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>💰</div>
              <h3>Low Fees</h3>
              <p>Industry-leading low trading fees and instant withdrawals</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>✨</div>
              <h3>User Friendly</h3>
              <p>Intuitive interface designed for both beginners and pros</p>
            </div>
          </div>
        </div>
        
        <div className={styles.rightPanel}>
          <div className={styles.loginCard}>
            <div className={styles.cardHeader}>
              <span className={styles.label}>WELCOME BACK</span>
              <h2 className={styles.title}>Sign In</h2>
              <p className={styles.subtitle}>Access your trading dashboard</p>
            </div>
          
          {reason === 'auth_required' && !error && (
            <div className={styles.info} aria-live="polite">Please sign in to continue{nextUrl ? ` to ${nextUrl}` : ''}.</div>
          )}
          {error && <div className={styles.error} aria-live="assertive">{error}</div>}
          
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                aria-invalid={!!emailError}
                aria-describedby="email-help"
                autoComplete="email"
                className={emailError ? styles.inputError : ''}
              />
              {emailError && <div id="email-help" className={styles.inputHelp}>{emailError}</div>}
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <div className={styles.passwordContainer}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  aria-invalid={!!passwordError}
                  aria-describedby="password-help"
                  autoComplete="current-password"
                  className={passwordError ? styles.inputError : ''}
                />
                <button 
                  type="button" 
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <div id="password-help" className={styles.inputHelp}>
                {passwordError || 'Use 8+ chars with upper, lower, and number'}
              </div>
            </div>
            
            <div className={styles.options}>
              <label className={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className={styles.checkmark}></span>
                Remember me
              </label>
              
              <Link href="/forgot-password" className={styles.forgotPassword}>
                Forgot Password?
              </Link>
            </div>
            
            <button 
              type="submit" 
              className={styles.loginButton}
              disabled={loading || !!emailError || !!passwordError || !email || !password}
            >
              {loading ? (
                <div className={styles.buttonContent}>
                  <div className={styles.spinner}></div>
                  Signing In...
                </div>
              ) : 'Sign In'}
            </button>
          </form>
          
          <div className={styles.divider}>
            <span>or</span>
          </div>
          
          <div className={styles.socialLogin}>
            <button className={`${styles.socialButton} ${styles.google}`}>
              <span className={styles.icon}>G</span>
              Continue with Google
            </button>
            <button className={`${styles.socialButton} ${styles.facebook}`}>
              <span className={styles.icon}>f</span>
              Continue with Facebook
            </button>
          </div>
          
          <div className={styles.signupLink}>
            Don&apos;t have an account? <Link href="/signup">Sign Up</Link>
          </div>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}
