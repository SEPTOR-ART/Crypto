import { useState, useEffect } from 'react';
import styles from '../styles/Signup.module.css';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

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
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const { register } = useAuth();

  const { firstName, lastName, email, password, confirmPassword } = formData;

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
  
  useEffect(() => {
    if (confirmPassword && confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  }, [confirmPassword, password]);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (emailError || passwordError || confirmPasswordError) {
      setError('Please fix the errors before submitting');
      return;
    }
    
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
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
    <ProtectedRoute requireAuth={false}>
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
                aria-invalid={!!emailError}
                aria-describedby="email-help"
                autoComplete="email"
                className={emailError ? styles.inputError : ''}
              />
              {emailError && <div id="email-help" className={styles.inputHelp}>{emailError}</div>}
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
                aria-invalid={!!passwordError}
                aria-describedby="password-help"
                autoComplete="new-password"
                className={passwordError ? styles.inputError : ''}
              />
              <div id="password-help" className={styles.inputHelp}>
                {passwordError || 'Use 8+ chars with upper, lower, and number'}
              </div>
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
                aria-invalid={!!confirmPasswordError}
                aria-describedby="confirm-password-help"
                autoComplete="new-password"
                className={confirmPasswordError ? styles.inputError : ''}
              />
              {confirmPasswordError && <div id="confirm-password-help" className={styles.inputHelp}>{confirmPasswordError}</div>}
            </div>
            
            <button 
              type="submit" 
              className={styles.signupButton}
              disabled={loading || !!emailError || !!passwordError || !!confirmPasswordError || !firstName || !lastName || !email || !password || !confirmPassword}
            >
              {loading ? (
                <div className={styles.buttonContent}>
                  <div className={styles.spinner}></div>
                  Creating Account...
                </div>
              ) : 'Sign Up'}
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
    </ProtectedRoute>
  );
}