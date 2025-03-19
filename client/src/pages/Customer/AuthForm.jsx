import React, { useState, useEffect,useRef } from 'react';
import axios from 'axios';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaRegEye } from 'react-icons/fa'; // Correct import for FaRegEye
import { PiEyeClosedBold } from 'react-icons/pi'; // Correct import for PiEyeClosedBold
import { getAuth, signInWithPopup, signInWithRedirect, GoogleAuthProvider, getRedirectResult } from 'firebase/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AuthPage.css';
// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAGA-Lr8r_8TKqTsAzmUnX0a64a7rEQcrY",
  authDomain: "authentication-78895.firebaseapp.com",
  projectId: "authentication-78895",
  storageBucket: "authentication-78895.appspot.com",
  messagingSenderId: "116502468756",
  appId: "1:116502468756:web:63c21d491d3d67f8bdfc81"
};
// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [eye, setEye] = useState(false);
  const [forgot, setForgot] = useState(false); // Toggle forgot password section
  const [forgotEmail, setForgotEmail] = useState(''); // Email for password reset
  const [otpSent, setOtpSent] = useState(false); // Track if OTP has been sent
  const [otp, setOtp] = useState(''); // OTP input
  const [newPassword, setNewPassword] = useState(''); // New password input
  const navigate = useNavigate();
  const { login } = useAuth();
  const passwordInputRef = useRef(null);
 const url = 'https://palmyra-fruit.onrender.com/api/user';
  //const url = "http://localhost:4000/api/user";

  // Handle login form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${url}/login`, { email, password},{withCredentials:true});
      if (response.data.success) {
        const name=response.data.name
        const isadmin=response.data.isAdmin
        console.log('admin',isadmin)
        login({ name, isadmin });
        toast.success('Login successful!');
        if(isadmin){
          navigate('/admin/dhome')
        }
        else{
          navigate('/home')
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
    setOtpSent(false); // Reset OTP sent state when toggling
  };

  // Handle sending OTP for password reset
  const handleSendOtp = async () => {
    setLoading(true);
    if (!forgotEmail) {
      toast.warn('Please enter your email.');
      return;
    }

    try {
      const response = await axios.post(`${url}/send-reset-otp`, { email: forgotEmail });
      if (response.data.success) {
        toast.success(`OTP sent to ${forgotEmail}`);
        setOtpSent(true); // Show OTP and new password fields
      }
    } catch (error) {
      const message = error.response?.data?.message || 'An error occurred. Please try again.';
      toast.error(message);
    }
    finally{
      setLoading(false);
    }
  };

  // Handle password reset submission
  const handleResetPassword = async () => {
    setLoading(true);
    if (!otp || !newPassword) {
      toast.warn('Please enter all details.');
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
        navigate('/auth');
        setForgot(false)
        localStorage.setItem('username',response.data.username)
      }
    } catch (error) {
      const message = error.response?.data?.message || 'An error occurred. Please try again.';
      toast.error(message);
    }
    finally{
      setLoading(false);
      setForgot(false)
    }
  };

  return (
    <>
      <NavLink to="/home" className="ahome">
        Go Home
      </NavLink>
      <div className="login">
        {forgot ? (
          <>
            <ToastContainer />
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
                  <button onClick={handleSendOtp} className="pbutton">
                    {loading?'Sending OTP...':'Send OTP'}
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
                  <button className="pbutton" id="pbutton" onClick={handleResetPassword}>
                   {loading?"Resetting Password":"Reset Password"}
                  </button>
                </>
              )}
            </div>
          </>
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
              <button id="gbutton">
                Sign in with Google
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
  //const url = 'https://palmyra-fruit.onrender.com/api/user';
  const url = 'http://localhost:4000/api/user';
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