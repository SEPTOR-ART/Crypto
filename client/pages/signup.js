import { useState } from 'react';
import styles from '../styles/Signup.module.css';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();

  const { firstName, lastName, email, password, confirmPassword } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await register({
        firstName,
        lastName,
        email,
        password
      });
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.signupCard}>
        <div className={styles.logo}>
          <h1>CryptoZen</h1>
          <p>Secure Asian-Inspired Crypto Exchange</p>
        </div>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={onSubmit} className={styles.form}>
          <div className={styles.nameFields}>
            <div className={styles.inputGroup}>
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={firstName}
                onChange={onChange}
                required
                placeholder="Enter your first name"
                autoComplete="given-name"
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={lastName}
                onChange={onChange}
                required
                placeholder="Enter your last name"
                autoComplete="family-name"
              />
            </div>
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={onChange}
              required
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              required
              placeholder="Create a password"
              autoComplete="new-password"
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={onChange}
              required
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.signupButton}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
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
        
        <div className={styles.loginLink}>
          Already have an account? <Link href="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}