import { useState } from 'react';
import styles from '../styles/Login.module.css';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login({ email, password });
    } catch (err) {
      setError(err.message || 'Failed to login');
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
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
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
            disabled={loading}
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
          Don't have an account? <Link href="/signup">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}