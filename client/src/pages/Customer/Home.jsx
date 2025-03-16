import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext'; // Import AuthContext
import Topbar from '../../components/Topbar'; 
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Home.css';
import b1 from '../../assets/b1.jpg';
import mb1 from '../../assets/mb3.jpg';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, admin } = useAuth(); // Get auth values
  const [backgroundImage, setBackgroundImage] = useState(b1); // Default to desktop image
  const isMobile = window.innerWidth <= 765;

  
  const toastfun = (msg, type) => {
    toast[type](msg, {
      position: 'top-right',
      autoClose: 3000,
      style: {
        position: 'absolute',
        right: '0em',
        top: isMobile ? '4em' : '70px',
        width: isMobile ? '60vw' : '40vw', // Set width for mobile
        height: isMobile ? '7vh' : '17vh',
        fontSize: isMobile ? '1.1em' : '1.2em', // Adjust font size
        padding: '10px', // Adjust padding
      },
      onClick: () => {
        toast.dismiss(); // Dismiss the toast when clicked
      },
    });
  };

  const toastfun2 = (msg, type) => {
    toast[type](msg, {
      position: 'top-center',
      autoClose: 3000,
      style: {
        position: 'absolute',
        left: '10%',
        right: '0em',
        top: isMobile ? '4em' : '70px',
        width: isMobile ? '80vw' : '40vw', // Set width for mobile
        height: isMobile ? '7vh' : '17vh',
        fontSize: isMobile ? '1em' : '1.2em', // Adjust font size
        padding: '10px', // Adjust padding
      },
      onClick: () => {
        toast.dismiss(); // Dismiss the toast when clicked
      },
    });
  };
 
  useEffect(() => {
   
    setBackgroundImage(isMobile ? mb1 : b1);

    if (isAuthenticated && user && user!=='undefined') {
      // User is authenticated and has a valid name
      toastfun(`Welcome ${user}`, 'success');
    } else if (!isAuthenticated) {
      // User is not authenticated
      toastfun2('Authentication is required for ordering..!', 'info');
    }

    const handleResize = () => {
      setBackgroundImage(window.innerWidth <= 765 ? mb1 : b1);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isAuthenticated, user, isMobile]);

  return (
    <div className="home-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <Topbar />
      {/* <ToastContainer /> */ }
      <div className="home">
        <img src="tree3 (2).png" alt="Palm Tree" className="tree7 tree3" />
        <img src="tree8.png" alt="Palm Tree" className="tree7" />
        <img src="tree6.png" alt="Palm Tree" className="tree1" />
        <img src="tree3 (1).png" alt="Palm Tree" className="tree1 himg2" />
        <img src="tree4.png" alt="Background Tree" className="himg3" />
        <img src="tree9.png" alt="Palm Tree" className="himg4 himg2" />
        <img src="tree7.png" alt="Palm Tree" className="tree8" />
        <img src="tree10.png" alt="Palm Tree" className="tree8 tree4" />
        <div className="hblock1">
          <h2 className="mtext">Cool and Sweet </h2>
          <div className="mtext-img">
            <img src="p-name2.png" alt="" />
          </div>
          <h2 className="mtext2">(తాటి ముంజలు)</h2>
        </div>
        <div className="hblock2">
          <p className="htext">
            Its naturally sweet, jelly-like flesh provides a cooling effect, making it perfect for hot summer days.
            Palmyra fruit also supports digestion and helps detoxify the body. Rich in essential nutrients like vitamins
            B and C, calcium, and iron, it boosts energy and promotes healthy skin.
          </p>
          <div className="wrapper hbutton horder">
            <button onClick={() => navigate('/ordermenu')}>ORDER</button>
          </div>
          <div className="wrapper hbutton habout2">
            <button onClick={() => navigate('/about')}>ABOUT</button>
          </div>
          <img src="ap9.png" alt="Palmyra" id="himg1" />
          <img src="s3.png" alt="hi" id="s1" />
          <img src="s1.png" alt="" id="s2" />
        </div>
        {/* {admin && (
          <div className="admin-section">
            <h2>Admin Panel</h2>
            <p>Access to admin features and controls</p>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default Home;
