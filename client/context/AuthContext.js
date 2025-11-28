import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../services/api';

const AuthContext = createContext();

// Shared admin check function to ensure consistency across the application
export const isAdmin = (user) => {
  // Check if user object exists
  if (!user) return false;
  
  // Check for admin email addresses
  const adminEmails = ['admin@cryptozen.com', 'admin@cryptoasia.com', 'Cryptozen@12345'];
  if (adminEmails.includes(user.email)) return true;
  
  // Check for isAdmin flag
  if (user.isAdmin === true) return true;
  
  // User is not an admin
  return false;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const refreshIntervalRef = useRef(null);

  // Check if user is logged in
  const checkUserLogin = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userData = await authService.getProfile(token);
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // Check if it's a session expiration error
        if (error.message && (error.message.includes('session expired') || error.message.includes('token expired'))) {
          console.log('Session expired, redirecting to login');
        }
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  // Start token refresh interval
  const startTokenRefresh = useCallback(() => {
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    // Set up new interval to refresh user data
    // For admin users, refresh more frequently to catch session timeouts
    const refreshInterval = isAdmin(user) ? 60000 : 300000; // 1 min for admin, 5 min for regular users
    
    refreshIntervalRef.current = setInterval(async () => {
      const token = localStorage.getItem('token');
      if (token && user) {
        try {
          const userData = await authService.getProfile(token);
          setUser(userData);
        } catch (error) {
          console.error('Failed to refresh user data:', error);
          // Check if it's a rate limit error
          if (error.message && error.message.includes('429')) {
            console.log('Rate limit hit, skipping refresh cycle');
          }
          // Check if it's a session expiration error
          else if (error.message && (error.message.includes('session expired') || error.message.includes('token expired'))) {
            console.log('Session expired during refresh, logging out');
            logout();
          }
          // Don't logout automatically on other refresh failures to avoid disrupting user experience
        }
      }
    }, refreshInterval);
  }, [user]);

  // Stop token refresh interval
  const stopTokenRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    checkUserLogin();
    
    // Start refresh interval only if user is logged in
    if (user) {
      startTokenRefresh();
    }
    
    // Cleanup interval on unmount
    return () => {
      stopTokenRefresh();
    };
  }, [checkUserLogin, user, startTokenRefresh, stopTokenRefresh]);

  // Register user
  const register = async (userData) => {
    try {
      const res = await authService.register(userData);
      localStorage.setItem('token', res.token);
      setUser(res);
      startTokenRefresh();
      router.push('/dashboard');
      return res;
    } catch (error) {
      throw error;
    }
  };

  // Login user
  const login = async (credentials) => {
    try {
      const res = await authService.login(credentials);
      localStorage.setItem('token', res.token);
      setUser(res);
      startTokenRefresh();
      
      // Redirect to appropriate page based on user role
      if (isAdmin(res)) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
      
      return res;
    } catch (error) {
      throw error;
    }
  };

  // Logout user
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    stopTokenRefresh();
    router.push('/');
  }, [router, stopTokenRefresh]);

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const token = localStorage.getItem('token');
      const res = await authService.updateProfile(userData, token);
      setUser(res);
      return res;
    } catch (error) {
      throw error;
    }
  };

  // Update user balance
  const updateUserBalance = (newBalance) => {
    if (user) {
      setUser({
        ...user,
        balance: newBalance
      });
    }
  };

  // Refresh user data (manual refresh)
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token && user) {
      try {
        const userData = await authService.getProfile(token);
        setUser(userData);
        return userData;
      } catch (error) {
        console.error('Failed to refresh user data:', error);
        // Check if it's a rate limit error
        if (error.message && error.message.includes('429')) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        // Check if it's a session expiration error
        else if (error.message && (error.message.includes('session expired') || error.message.includes('token expired'))) {
          console.log('Session expired during manual refresh, logging out');
          logout();
          throw new Error('Your session has expired. Please log in again.');
        }
        // Only logout on manual refresh failure
        logout();
        throw error;
      }
    }
  }, [user, logout]);

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    updateProfile,
    updateUserBalance,
    refreshUser,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};