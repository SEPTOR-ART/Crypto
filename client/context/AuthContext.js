import { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUserLogin();
  }, []);

  // Check if user is logged in
  const checkUserLogin = async () => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        const userData = await authService.getProfile(token);
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        localStorage.removeItem('token');
      }
    }
    
    setLoading(false);
  };

  // Register user
  const register = async (userData) => {
    try {
      const res = await authService.register(userData);
      localStorage.setItem('token', res.token);
      setUser(res);
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
      router.push('/dashboard');
      return res;
    } catch (error) {
      throw error;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/');
  };

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

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    updateProfile,
    updateUserBalance
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};