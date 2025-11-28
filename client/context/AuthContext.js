import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const refreshIntervalRef = useRef(null);

  // Check if user is logged in
  const checkUserLogin = useCallback(async () => {
    try {
      const userData = await authService.getProfile();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Start token refresh interval
  const startTokenRefresh = useCallback(() => {
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    // Set up new interval to refresh user data every 5 minutes (increased from 60 seconds)
    refreshIntervalRef.current = setInterval(async () => {
      if (user) {
        try {
          const userData = await authService.getProfile();
          setUser(userData);
        } catch (error) {
          console.error('Failed to refresh user data:', error);
          if (error.message && error.message.includes('429')) {
            console.log('Rate limit hit, skipping refresh cycle');
          }
        }
      }
    }, 300000);
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
  const register = async (userData, nextUrl) => {
    try {
      const res = await authService.register(userData);
      if (typeof window !== 'undefined' && res && res.token) {
        try { localStorage.setItem('token', res.token); } catch (e) {}
      }
      await checkUserLogin();
      startTokenRefresh();
      router.push(nextUrl || '/dashboard');
      return res;
    } catch (error) {
      throw error;
    }
  };

  // Login user
  const login = async (credentials, nextUrl) => {
    try {
      const res = await authService.login(credentials);
      if (typeof window !== 'undefined' && res && res.token) {
        try { localStorage.setItem('token', res.token); } catch (e) {}
      }
      await checkUserLogin();
      startTokenRefresh();
      router.push(nextUrl || '/dashboard');
      return res;
    } catch (error) {
      throw error;
    }
  };

  // Logout user
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (e) {}
    setUser(null);
    try { if (typeof window !== 'undefined') localStorage.removeItem('token'); } catch (e) {}
    stopTokenRefresh();
    router.push('/');
  }, [router, stopTokenRefresh]);

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const res = await authService.updateProfile(userData);
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
    if (user) {
      try {
        const userData = await authService.getProfile();
        setUser(userData);
        return userData;
      } catch (error) {
        console.error('Failed to refresh user data:', error);
        if (error.message && error.message.includes('429')) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        await logout();
        throw error;
      }
    }
  }, [user, logout]);

  // Check if user is admin with enhanced validation
  const isAdmin = useCallback((user) => {
    // Check if user object exists
    if (!user) return false;
    
    // Check for admin email addresses
    const adminEmails = ['admin@cryptozen.com', 'admin@cryptoasia.com', 'Cryptozen@12345'];
    if (adminEmails.includes(user.email)) return true;
    
    // Check for isAdmin flag
    if (user.isAdmin === true) return true;
    
    // User is not an admin
    return false;
  }, []);

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
