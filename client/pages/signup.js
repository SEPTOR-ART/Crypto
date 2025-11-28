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
    
    // Comprehensive client-side validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    // Sanitize inputs (trim whitespace)
    const sanitizedFirstName = firstName.trim();
    const sanitizedLastName = lastName.trim();
    const sanitizedEmail = email.trim().toLowerCase();
    
    // Validate name fields
    if (sanitizedFirstName.length < 2 || sanitizedFirstName.length > 50) {
      setError('First name must be between 2 and 50 characters');
      return;
    }
    
    if (sanitizedLastName.length < 2 || sanitizedLastName.length > 50) {
      setError('Last name must be between 2 and 50 characters');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Comprehensive password validation
    if (password.length < 8 || password.length > 128) {
      setError('Password must be between 8 and 128 characters');
      return;
    }
    
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }
    
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }
    
    if (!/\d/.test(password)) {
      setError('Password must contain at least one number');
      return;
    }
    
    // Check for common weak passwords
    const weakPasswords = ['password123', '12345678', 'qwerty123', 'abc123456'];
    if (weakPasswords.includes(password.toLowerCase())) {
      setError('Password is too common. Please choose a stronger password');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await register({
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        email: sanitizedEmail,
        password
      });
    } catch (err) {
      // Handle specific error messages
      if (err.message.includes('already exists') || err.message.includes('Unable to create account')) {
        setError('An account with this email already exists or cannot be created');
      } else if (err.message.includes('Network Error')) {
        setError('Network error. Please check your connection and try again.');
      } else if (err.message.includes('Too many requests')) {
        setError('Too many registration attempts. Please try again later.');
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
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
              <div className={styles.featureIcon}>⚡</div>
              <h3>Lightning Fast</h3>
              <p>Execute trades in milliseconds with our advanced matching engine</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🔒</div>
              <h3>Bank-Grade Security</h3>
              <p>Your assets are protected with military-grade encryption</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🌍</div>
              <h3>Global Access</h3>
              <p>Trade from anywhere with 24/7 customer support</p>
            </div>
          </div>
        </div>
        
        <div className={styles.rightPanel}>
          <div className={styles.signupCard}>
            <div className={styles.cardHeader}>
              <span className={styles.label}>GET STARTED</span>
              <h2 className={styles.title}>Create Account</h2>
              <p className={styles.subtitle}>Join thousands of traders worldwide</p>
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
      </div>
    </ProtectedRoute>
  );
}