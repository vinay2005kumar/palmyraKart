import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import GoogleLoader from './GoogleLoader'; // Import the Loader component
import './GoogleSignIn.css'; // Assuming you'll create a CSS file

const GoogleSignIn = ({ login, navigate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const url = 'https://palmyra-fruit.onrender.com/api/user';
  //const url = "http://localhost:4000/api/user";

  // Handle Google Sign-In success
  const handleCredentialResponse = async (response) => {
    setIsLoading(true); // Start loading when sign-in process begins
    
    try {
      // Send the Google ID token to your backend for verification
      const backendResponse = await axios.post(`${url}/google-login`, {
        credential: response.credential,
      }, { withCredentials: true });

      if (backendResponse.data.success) {
        const { name, isAdmin } = backendResponse.data;
        login({ name, isAdmin }); // Update the authentication state
        toast.success('Google Sign-In successful!');
        if (isAdmin) {
          navigate('/admin/dhome'); // Redirect to admin dashboard
        } else {
          navigate('/home'); // Redirect to home page
        }
      }
    } catch (error) {
      console.error('Error during Google Sign-In:', error);
      toast.error('Failed to sign in with Google. Please try again.');
      setIsLoading(false); // Stop loading on error
    }
  };

  // Initialize Google Sign-In
  useEffect(() => {
    // Load the Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    // Initialize Google Sign-In
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_APP_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });

      // Render the Google Sign-In button
      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        { theme: 'outline', size: 'large' }
      );

      // Optional: Prompt the user to select an account automatically
      window.google.accounts.id.prompt();
    };

    // Cleanup the script on component unmount
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="google-signin-container">
      {isLoading ? (
        <GoogleLoader text="Signing in with Google..." />
      ) : (
        <div id="google-signin-button"></div>
      )}
    </div>
  );
};

export default GoogleSignIn;