import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import axios from 'axios';
import Dhome from '../Dashboard/Dhome';
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState();
  const [user, setUser] = useState();
  const [limit, setlimit] = useState(null); // New state for limit
  const [admin, setAdmin] = useState(false);
  const [alogout,setalogout]=useState(false)
  const [dkart, setdkart] = useState(false);
  const [dkart2,setdkart2]=useState()
 // const url = 'https://ice-apple-6.onrender.com';
  const url = 'http://localhost:4000/api/user';
  // const[email,setemail]=useState(localStorage.getItem('email') ? localStorage.getItem('email'): null)
    const handleKart = async () => {
      try {
        const res = await axios.get(`${url}/get`);
        setlimit(res.data.user.limit);
        setdkart(res.data.user.isKart);
        
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    useEffect(() => {
      console.log("Updated limit in state:", limit);
      console.log("Updated dkart in state:", dkart);
    }, [limit, dkart]);  // Runs when limit or dkart changes
    
  useEffect(() => {
    // Placeholder for any future use of limit
    // console.log('auth', limit);
    handleKart()
  }, []);
    // Function to check authentication from backend using cookies
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${url}/data`, { withCredentials: true });
    
        if (res.data.success) {
          const resuser = res.data.userData;
          const cadmin=resuser.isadmin;
          setIsAuthenticated(true);
          setUser(resuser.name);
          setAdmin(cadmin);
          localStorage.setItem("username", resuser.name);
          console.log("User authenticated & admin :", resuser.name,resuser.isadmin); // Log the correct value directly
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setAdmin(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
        setAdmin(false);
        console.error("Auth check failed:", error);
      }
    };
    
    // Run checkAuth on mount
    useEffect(() => {
      checkAuth();
    }, []);
    

  const login = (userData, lAdmin) => {
    console.log('contextadmin', lAdmin,userData);
    const tadmin=userData.isadmin;
    setAdmin(tadmin);
    // console.log(userData.isadmin)
    setIsAuthenticated(true);
    setUser(userData.name);
    // console.log('auth',isAuthenticated)
    localStorage.setItem('username', userData.name);
    console.log(tadmin,admin)
  };

  const logout = async() => {
    // const auth = getAuth();
    // setalogout(true)
    // signOut(auth)
    //   .then(() => {
    //     setIsAuthenticated(false);
    //     setUser(null);
    //     localStorage.removeItem('name');
    //   })


    //   .catch((error) => {
    //     console.error('Sign out error:', error);
    //   });

        try {
          // Send a POST request to the backend logout endpoint
          const response = await axios.post(`${url}/logout`, {}, { withCredentials: true });
      
          // If the logout is successful
          if (response.data.success) {
            // Clear user data from the frontend
            setIsAuthenticated(false);
            setUser(null);
            localStorage.removeItem('username'); // Remove any stored user data
            console.log('Logout successful');
          } else {
            console.error('Logout failed:', response.data.message);
          }
        } catch (error) {
          // Handle errors
          console.error('Logout error:', error);
          if (error.response) {
            console.error('Server responded with:', error.response.data);
          } else if (error.request) {
            console.error('No response received:', error.request);
          } else {
            console.error('Error setting up the request:', error.message);
          }
        }
  };
  const dashboardkart=(kvalue)=>{
    handleKart()
    const v=kvalue
    console.log('dkart open...vla',kvalue)
  }
  const dashboardlimit=()=>{
  }
  useEffect(()=>{
    handleKart()
    // console.log('context',dkart)
  },[dkart])
useEffect(()=>{
  setalogout(false)
},[alogout])
  // Clear localStorage only when browser/tab is closed, not on page refresh
  // useEffect(() => {
  //   const handleUnload = (event) => {
  //     if () {
        
      
  //     }
  //     sessionStorage.removeItem('isRefreshed');
  //   };

  //   const handleBeforeUnload = () => {
    
  //     sessionStorage.setItem('isRefreshed', 'true');
  //   };

  //   window.addEventListener('beforeunload', handleBeforeUnload);
  //   window.addEventListener('unload', handleUnload);

  //   return () => {
  //     window.removeEventListener('beforeunload', handleBeforeUnload);
  //     window.removeEventListener('unload', handleUnload);
  //   };
  // }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout,admin,dashboardkart,dashboardlimit,dkart,limit,handleKart }}>
      {children}
    </AuthContext.Provider>
  );
};
