import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaRegEye } from 'react-icons/fa';
import { PiEyeClosedBold } from 'react-icons/pi';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect, 
  GoogleAuthProvider, 
  getRedirectResult 
} from 'firebase/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AuthPage.css';
import { auth } from '../../firebase/firebase';

// Google Auth Provider
const provider = new GoogleAuthProvider();

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [eye, setEye] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [processingRedirect, setProcessingRedirect] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const passwordInputRef = useRef(null);
  const url = 'https://palmyra-fruit.onrender.com/api/user';
  //const url = "http://localhost:4000/api/user";
  // Check for redirect results from Google Auth on component mount
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        setProcessingRedirect(true);
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          await handleGoogleSignInSuccess(result.user);
        }
      } catch (error) {
        console.error('Error handling redirect result:', error);
        toast.error('Failed to sign in with Google. Please try again.');
      } finally {
        setProcessingRedirect(false);
      }
    };

    checkRedirectResult();
  }, []);

  // Handle login form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${url}/login`, { email, password }, { withCredentials: true });
      if (response.data.success) {
        const name = response.data.name;
        const isadmin = response.data.isAdmin;
        login({ name, isadmin });
        toast.success('Login successful!');
        if (isadmin) {
          navigate('/admin/dhome');
        } else {
          navigate('/home');
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'An error occurred. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-In success
  const handleGoogleSignInSuccess = async (user) => {
    try {
      setLoading(true);
      // Send user data to backend
      const response = await axios.post(`${url}/google-login`, {
        email: user.email,
        name: user.displayName,
        uid: user.uid,
      }, { withCredentials: true });

      if (response.data.success) {
        const name = response.data.name;
        const isadmin = response.data.isAdmin;
        login({ name, isadmin });
        toast.success('Google Sign-In successful!');
        if (isadmin) {
          navigate('/admin/dhome');
        } else {
          navigate('/home');
        }
      }
    } catch (error) {
      console.error('Error during Google Sign-In:', error);
      toast.error('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    // Detect if running on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    try {
      setLoading(true);
      
      // Add persistance to local storage to help with redirects
      localStorage.setItem('googleAuthPending', 'true');
      
      if (isMobile) {
        // Better approach for mobile: always use redirect
        await signInWithRedirect(auth, provider);
        // The redirect will navigate away, so we won't reach this point until the user returns
      } else {
        // For desktop, try popup first, fallback to redirect if popup fails
        try {
          const result = await signInWithPopup(auth, provider);
          if (result && result.user) {
            await handleGoogleSignInSuccess(result.user);
          }
        } catch (popupError) {
          console.error('Popup error:', popupError);
          // If popup is blocked or fails, fall back to redirect
          if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
            toast.info('Popup was blocked. Redirecting for authentication...');
            await signInWithRedirect(auth, provider);
          } else {
            throw popupError; // Re-throw other errors
          }
        }
      }
    } catch (error) {
      console.error('Error during Google Sign-In:', error);
      
      if (error.code === 'auth/network-request-failed') {
        toast.error('Network error. Please check your internet connection.');
      } else {
        toast.error('Failed to sign in with Google. Please try again.');
      }
    } finally {
      setLoading(false);
      localStorage.removeItem('googleAuthPending');
    }
  };

  // Toggle password visibility
  const toggleEye = () => {
    setEye(!eye);
    if (passwordInputRef.current) {
      passwordInputRef.current.type = eye ? 'password' : 'text';
    }
  };

  // Toggle forgot password section
  const toggleForgot = () => {
    setForgot(!forgot);
    setOtpSent(false);
  };

  // Handle sending OTP for password reset
  const handleSendOtp = async () => {
    setLoading(true);
    if (!forgotEmail) {
      toast.warn('Please enter your email.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${url}/send-reset-otp`, { email: forgotEmail });
      if (response.data.success) {
        toast.success(`OTP sent to ${forgotEmail}`);
        setOtpSent(true);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'An error occurred. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset submission
  const handleResetPassword = async () => {
    setLoading(true);
    if (!otp || !newPassword) {
      toast.warn('Please enter all details.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${url}/reset-password`, {
        email: forgotEmail,
        otp,
        newPassword,
      }, { withCredentials: true });

      if (response.data.success) {
        toast.success('Password reset successful!');
        setForgot(false);
        if (response.data.username) {
          localStorage.setItem('username', response.data.username);
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'An error occurred. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavLink to="/home" className="ahome">
        Go Home
      </NavLink>
      <div className="login">
        <ToastContainer />
        {forgot ? (
          <div className="forgotbox">
            <h2>Forgot Password</h2>
            <div>
              <NavLink to="/auth" className="pgoback" onClick={toggleForgot}>
                Go Back
              </NavLink>
            </div>

            {/* Step 1: Email Input */}
            {!otpSent && (
              <>
                <label htmlFor="pemail">Enter Your Email:</label>
                <input
                  type="email"
                  id="pemail"
                  className="pemail"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Enter your email"
                />
                <button onClick={handleSendOtp} className="pbutton" disabled={loading}>
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </>
            )}

            {/* Step 2: OTP and New Password Input */}
            {otpSent && (
              <>
                <label>Verification Code:</label>
                <input
                  type="text"
                  className="pemail"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  required
                />

                <label>New Password:</label>
                <input
                  type="password"
                  className="pemail"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
                <button className="pbutton" id="pbutton" onClick={handleResetPassword} disabled={loading}>
                  {loading ? "Resetting Password" : "Reset Password"}
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="form-container">
              <h2>Login</h2>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password:</label>
                <div className="password-input">
                  <input
                    type={eye ? 'text' : 'password'}
                    id="password-input"
                    ref={passwordInputRef}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span onClick={toggleEye} className="eye">
                    {eye ? <FaRegEye /> : <PiEyeClosedBold />}
                  </span>
                </div>
              </div>
              <div className="forgot" onClick={toggleForgot}>
                <NavLink to="/auth" className="forgot-button">
                  Forgot Password
                </NavLink>
              </div>
              <button type="submit" className="form-button" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
              {error && <p className="error-message">{error}</p>}
            </form>
            <p id="or">OR</p>
            <div className="google">
              <img src="gimg3.png" alt="Google" id="gimg" width="30em" height="30em" />
              <button id="gbutton" onClick={handleGoogleSignIn} disabled={loading || processingRedirect}>
                {loading || processingRedirect ? 'Processing...' : 'Sign in with Google'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};
const SignupForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setotp] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState('register'); // 'register' or 'verify'
  const navigate = useNavigate();
  const { login } = useAuth();
  const [eye, setEye] = useState(false);
  const url = 'https://palmyra-fruit.onrender.com/api/user';
  //const url = 'http://localhost:4000/api/user';
  const passwordInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(
        `${url}/register`,
        { name, email, password },
        { withCredentials: true }
      );
     const msg='ACCOUNT VERIFICATION'
      if (response.data.success) {
        const sendotp = await axios.post(`${url}/send-verify-otp`, { email ,msg});
  
        if (sendotp.data.success) {
          toast.success('Registration successful! Please check your email for the verification code.');
          setStep('verify');
          setEmail(email); // or response.data.email if available
        }
  
        const name = response.data.name; // Fixed name extraction
        console.log('name', name);
        localStorage.setItem('username', name);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'An error occurred. Please try again.';
      setError(message);
      toast.error(message);
    }
    finally{
      setLoading(false);
    }
  };
  
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${url}/verify-account`, { email,otp }, { withCredentials: true });
      if (response.data.success) {
        const { name } = response.data;
        login({ name });
        toast.success('Verification successful!');
        navigate('/home');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'An error occurred. Please try again.';
      setError(message);
      toast.error(message);
    }
    finally{
      setLoading(false);
    }
  };
  const toggleEye = () => {
    setEye(!eye);
  };
  return (
    <>
      <NavLink to="/home" className="ahome">
        Go Home
      </NavLink>
      <div className="form-container">
        {step === 'register' ? (
          <>
            <ToastContainer />
            <h2>Register</h2>
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password:</label>
                <input
               type={eye ? "text" : "password"}
                id="password-input"
                ref={passwordInputRef} // Attach the ref here
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
                   <span onClick={toggleEye} className="eye">
                    {eye ? <FaRegEye /> : <PiEyeClosedBold />}
                  </span>
              </div>
              <button type="submit" className="form-button">
               {loading?'Registering...':'Register'}
              </button>
            </form>
          </>
        ) : (
          <>
            <ToastContainer />
            <h2>Verify Email</h2>
            <form onSubmit={handleVerifyCode}>
              <div className="form-group verification">
                <NavLink to="/auth" className="vgoback" onClick={() => setStep('register')}>
                  Go Back
                </NavLink>
                <label id="l1">Your code was sent to {email}</label>
                <label>Verification Code:</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setotp(e.target.value)}
                  placeholder="Enter verification code"
                  required
                />
              </div>
              <button type="submit" className="form-button">
                Submit Code
              </button>
            </form>
          </>
        )}
        {error && <p className="error-message">{error}</p>}
      </div>
    </>
  );
};


const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-container">
      {isLogin ? <LoginForm /> : <SignupForm />}
      <ToastContainer />
      <p id="lmsg">
        {isLogin ? "Don't have an account yet?" : "Already have an account?"}
      </p>
      <button className="switch-button" onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? 'Switch to Register' : 'Switch to Login'}
      </button>
    </div>
  );
};

export default AuthPage;