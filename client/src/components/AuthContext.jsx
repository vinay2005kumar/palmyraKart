import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(false);

  const url = 'http://localhost:4000/api/user';

  // Function to check authentication status
  const checkAuth = async () => {
    try {
      const res = await axios.get(`${url}/data`, { withCredentials: true });

      if (res.data.success) {
        const resuser = res.data.userData;
        setIsAuthenticated(true);
        setUser(resuser.name);
        setAdmin(resuser.isadmin);
        localStorage.setItem('username', resuser.name);
        console.log('User authenticated & admin:', resuser.name, resuser.isadmin);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setAdmin(false);
        logout()
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      setAdmin(false);
      logout()
      console.error('Auth check failed:', error);
    }
  };

  // Function to refresh the access token
  const refreshAccessToken = async () => {
    try {
      const res = await axios.post(`${url}/refresh-token`, {}, { withCredentials: true });

      if (res.data.success) {
        console.log('Access token refreshed');
      } else {
        throw new Error('No access token received');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
    }
  };

  // Function to check token expiration and refresh if needed
  const checkTokenExpiry = () => {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token='))
      ?.split('=')[1];
  
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const expiryTime = decodedToken.exp * 1000;
        const currentTime = Date.now();
  
        // If the token is about to expire in 5 minutes, refresh it
        if (expiryTime - currentTime < 300000) {
          refreshAccessToken();
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        logout();
      }
    }
  };

  // Periodically check token expiry
  useEffect(() => {
    const interval = setInterval(() => {
      checkTokenExpiry();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Function to log in the user (called from LoginForm)
  const login = (userData) => {
    setIsAuthenticated(true);
    setUser(userData.name);
    setAdmin(userData.isadmin);
    localStorage.setItem('username', userData.name);
    console.log('User logged in:', userData.name, userData.isadmin);
  };

  // Function to log out the user
  const logout = async () => {
    try {
      await axios.post(`${url}/logout`, {}, { withCredentials: true });

      setIsAuthenticated(false);
      setUser(null);
      setAdmin(false);
      localStorage.removeItem('username');
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Fetch user data on mount
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        admin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};