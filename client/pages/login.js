import { useState, useEffect } from 'react';
import styles from '../styles/Login.module.css';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) setEmailError('Enter a valid email'); else setEmailError('');
  }, [email]);
  
  useEffect(() => {
    const ok = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);
    if (password && !ok) setPasswordError('Min 8 chars, include upper, lower, number'); else setPasswordError('');
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
      await login({ email, password });
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
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.logo}>
          <h1>CryptoZen</h1>
          <p>Secure Asian-Inspired Crypto Exchange</p>
        </div>
        
        {error && <div className={styles.error}>{error}</div>}
        
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
            <div id="password-help" className={styles.inputHelp}>{passwordError || 'Use a strong password for security'}</div>
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
            disabled={loading || !!emailError || !!passwordError}
          >
            {loading ? 'Signing In...' : 'Sign In'}
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
          Don’t have an account? <Link href="/signup">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}