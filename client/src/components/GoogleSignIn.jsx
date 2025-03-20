import React, { useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const GoogleSignIn = ({ login, navigate }) => {
  const url = 'http://localhost:4000/api/user'; // Backend API URL

  // Handle Google Sign-In success
  const handleCredentialResponse = async (response) => {
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
        client_id:import.meta.env.VITE_APP_GOOGLE_CLIENT_ID, // Replace with your Google Client ID
        callback: handleCredentialResponse, // Callback function to handle the response
      });

      // Render the Google Sign-In button
      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        { theme: 'outline', size: 'large' } // Customize the button
      );

      // Optional: Prompt the user to select an account automatically
      window.google.accounts.id.prompt();
    };

    // Cleanup the script on component unmount
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div id="google-signin-button"></div>
  );
};

export default GoogleSignIn;