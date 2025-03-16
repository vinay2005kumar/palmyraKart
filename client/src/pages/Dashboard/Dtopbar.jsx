import React, { useState, useEffect, useRef } from 'react';
import './Dtopbar.css';
import { NavLink, useNavigate } from 'react-router-dom';
import { IoReorderThreeOutline } from 'react-icons/io5';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dreviews from './Dreviews';
import { useAuth } from '../../context/AuthContext';
const Dtopbar = () => {
  const [dicon, setdicon] = useState(false); // State for toggling the navbar
  const navigate = useNavigate();
  const navbarRef = useRef(null); // Ref for the navbar container
  const iconRef = useRef(null); // Ref for the menu icon
  const {logout}=useAuth()
  // Toggle the menu when the icon is clicked
  const dtop = (e) => {
    if (e) e.stopPropagation(); // Ensure `e` exists before accessing it
    setdicon((prev) => !prev); // Toggle the menu
  };

  // Logout Confirmation Toast
  const handleLogout = () => {
    const toastId = 'logout-toast'; // Unique toast ID
    dtop(); // Call dtop without an event
    if (!toast.isActive(toastId)) {
      toast.info(
        <div>
          <p style={{ padding: '1px' }}>Do you really want to logout?</p>
          <button
            onClick={() => {
              toast.dismiss(toastId); // Dismiss the toast
              logout()
              navigate('/auth'); // Redirect to AuthPage
            }}
            style={{
              fontSize: '1.1em',
              margin: '5px',
              padding: '5px 15px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss(toastId)} // Dismiss the toast
            style={{
              fontSize: '1.1em',
              margin: '5px',
              padding: '5px 15px',
              background: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            No
          </button>
        </div>,
        {
          position: 'top-center',
          closeOnClick: true,
          draggable: false,
          autoClose: false,
          toastId,
          style: {
            top: '6em',
            width: window.innerWidth <= 768 ? '70%' : '100%', // Responsive styling
          },
        }
      );
    }
  };

  // Handle clicking outside of the navbar to close it
  const handleClickOutside = (event) => {
    const clickedInsideNavbar = navbarRef.current && navbarRef.current.contains(event.target);
    const clickedInsideIcon = iconRef.current && iconRef.current.contains(event.target);

    if (!clickedInsideNavbar && !clickedInsideIcon) {
      setdicon(false); // Close the navbar
    }
  };

  // Add event listener to detect clicks outside when the navbar is open
  useEffect(() => {
    if (dicon) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside); // Clean up
    };
  }, [dicon]);

  return (
    <div>
      <div className="dtop">
        <p className="dname">Dashboard</p>
        <IoReorderThreeOutline
          id="dicon"
          onClick={dtop} // Pass the click event
          ref={iconRef}
          aria-label="Toggle navigation menu"
        />
        <div
          ref={navbarRef}
          className={`dtop2 ${dicon ? 'show-menu' : ''}`} // Toggle menu visibility
          id="dtop2"
        >
          <NavLink to="/admin/dhome">
            <p className="dpara">Home</p>
          </NavLink>
          <NavLink to="/admin/dorders">
            <p className="dpara">Orders</p>
          </NavLink>
          <NavLink to="/admin/delivered">
            <p className="dpara">Delivered</p>
          </NavLink>
          <NavLink to="/admin/expired">
            <p className="dpara">Expired</p>
          </NavLink>
          <NavLink to="/admin/dreviews">
            <p className="dpara">Reviews</p>
          </NavLink>
          <p className="dpara" id="dlogout" onClick={handleLogout}>
            Logout
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dtopbar;
