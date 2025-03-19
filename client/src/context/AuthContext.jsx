import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [reviewDetails,setReviewDetails]=useState([])
  const [userDetails,setUserDetails]=useState([])
  const [orderDetails, setOrderDetails] = useState([]);
  const url = 'https://palmyra-fruit.onrender.com/api/user';
  // const url = "http://localhost:4000/api/user";
  const [allReviews, setAllReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate=useNavigate()
  // Function to check authentication status
  const checkAuth = async () => {
    try {
      setIsLoading(true)
      const res = await axios.get(`${url}/data`, { withCredentials: true });
       
      if (res.data.success) {
        const { userData, orderData,reviewData } = res.data;
        setUserDetails(userData)
        setOrderDetails(orderData)
        setReviewDetails(reviewData)
        setIsLoading(false)
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
        setIsLoading(false)
        logout()
        navigate('/auth')
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false)
      setAdmin(false);
      console.log('Auth check failed:', error);
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
    console.log('context',userDetails,orderDetails,reviewDetails)
  }, []);


  const deleteOrder = (orderId) => {
    // setOrderDetails((prevOrders) => prevOrders.filter((order) => order.orderId !== orderId));
    checkAuth()
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${url}/reviews`);
      setAllReviews(response.data.reviews || []); // Set all users' reviews
    } catch (error) {
      console.error("Error fetching all reviews:", error);
    }
  };

  const addReview = async (reviewData) => {
    try {
      const response = await axios.post(`${url}/add-reviews`, reviewData, {
        withCredentials: true,
      });
      setReviewDetails((prev) => [response.data.review, ...prev]); // Add to authenticated user's reviews
      setAllReviews((prev) => [response.data.review, ...prev]); // Add to all users' reviews
    } catch (error) {
      console.error("Error adding review:", error);
    }
  };

  const updateReview = async (reviewId, reviewData) => {
    try {
      await axios.put(`${url}/reviews/${reviewId}`, reviewData);
      setReviewDetails((prev) =>
        prev.map((r) => (r._id === reviewId ? { ...r, ...reviewData } : r))
      );
      setAllReviews((prev) =>
        prev.map((r) => (r._id === reviewId ? { ...r, ...reviewData } : r))
      );
    } catch (error) {
      console.error("Error updating review:", error);
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      await axios.delete(`${url}/reviews/${reviewId}`);
      setReviewDetails((prev) => prev.filter((r) => r._id !== reviewId));
      setAllReviews((prev) => prev.filter((r) => r._id !== reviewId));
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };


  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        admin,
        userDetails,
        orderDetails,
        reviewDetails,
        deleteOrder,
        checkAuth,
        allReviews,
        fetchReviews,
        addReview,
        updateReview,
        deleteReview,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};