// context/AuthContext.jsx
"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/v1/auth/me');
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        setIsAuthenticated(true);
        toast.success('Login successful!');
        
        // Store token in localStorage as backup
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        
        // Redirect to dashboard or home
        if (data.user.role === 1) {
          router.push('/admin/dashboard');
        } else {
          router.push('/');
        }
        
        return { success: true };
      } else {
        toast.error(data.message || 'Login failed');
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        setIsAuthenticated(true);
        toast.success('Registration successful!');
        
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        
        router.push('/');
        return { success: true };
      } else {
        toast.error(data.message || 'Registration failed');
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const response = await fetch('/api/v1/auth/logout', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('auth_token');
        toast.success('Logged out successfully');
        router.push('/login');
      } else {
        toast.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUser,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};