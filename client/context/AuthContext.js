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
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userData = await authService.getProfile(token);
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
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
    
    // Set up new interval to refresh user data every 60 seconds
    refreshIntervalRef.current = setInterval(async () => {
      const token = localStorage.getItem('token');
      if (token && user) {
        try {
          const userData = await authService.getProfile(token);
          setUser(userData);
        } catch (error) {
          console.error('Failed to refresh user data:', error);
          // Don't logout automatically on refresh failure to avoid disrupting user experience
        }
      }
    }, 60000); // Refresh every 60 seconds
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
      router.push('/dashboard');
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
        // Only logout on manual refresh failure
        logout();
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