import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Topbar.css';
import { IoReorderThree } from "react-icons/io5";
import { RxCross1 } from "react-icons/rx";
import { CgNotes } from "react-icons/cg";
import axios from 'axios';
import { database, ref, set, onValue,get } from "../firebase/firebase";
const Topbar = () => {
  const { isAuthenticated, user, logout,dkart,dashboardkart } = useAuth();
  //const [name, setName] = useState(localStorage.getItem('username') ? { name: localStorage.getItem('username') } : null);
  const [name, setName] = useState();
  const[tname,settname]=useState()
  const [ticon, setticon] = useState(false);
  const [note, setNote] = useState(false); // State to manage Terms and Conditions modal
  const navigate = useNavigate();
  const iconContainerRef = useRef(null);
  const navbarRef = useRef(null);
  const [language, setLanguage] = useState('english');
  const[istoggleicon,setistoggleicon]=useState(true)
  const isMobile = window.innerWidth < 765;
  const[iskart,setkart]=useState()
  const url = 'https://palmyra-fruit.onrender.com/api/user';
  //const url = 'http://localhost:4000/api/user';
// ------------------------------------------------------------
  // const socket = io(url, {
  //   transports: ["websocket", "polling"], // Force WebSocket transport
  //   withCredentials: true, // Include credentials (optional)
  //   reconnection: true, // Enable auto-reconnect
  //   reconnectionAttempts: 5, // Try reconnecting 5 times
  //   reconnectionDelay: 1000, // Delay between reconnect attempts
  // });

// ------------------------------------------------------------
const toggleicon=()=>{
  setistoggleicon(prev=>!prev)
}
const [isOpen, setIsOpen] = useState(null);

useEffect(() => {
  const url=import.meta.env.VITE_FIREBASE_URL
  const collection=import.meta.env.VITE_FIREBASE_COLLECTION
  const statusRef = ref(database, `${url}/${collection}`);
 // Fetch initial value once
 get(statusRef).then((snapshot) => {
  if (snapshot.exists()) {
    setIsOpen(snapshot.val().isOpen);
  }
});
  // Listen for real-time updates
  const unsubscribe = onValue(statusRef, (snapshot) => {
    if (snapshot.exists()) {
      setIsOpen(snapshot.val().isOpen);
    }
  });
  console.log('isopen',isOpen)
  return () => unsubscribe(); // Cleanup on unmount
}, []);


useEffect(() => {
  // console.log('top', user, isAuthenticated);
  if(isAuthenticated){
    setName(user);
    settname(true);
  }
  else{
    settname(false)
  }
}, [user, isAuthenticated]); 

   // Fetch initial kart status
   useEffect(() => {
    const fetchKartStatus = async () => {
      try {
        const res = await axios.get(`${url}/kart-status`);
    
        const value = res.data; // Access the value
        setkart(value); 
       console.log('d t status',iskart)
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
  
    // fetchKartStatus();
    // ------------------------------------------------------------
    // Listen for real-time updates
    // socket.on("kart-status-updated", (status) => {
    //   setkart(status);
    //   console.log('t status',iskart)
    // });
    // return () => {
    //   socket.off("kart-status-updated");
    // };
   
// ------------------------------------------------------------
// console.log('top',user,isAuthenticated)
  }, []);

  const termsAndConditions = {
    english: [
      "Authentication is required to place an order, and you will be notified of any updates regarding your order.",
      <>Orders can be placed <strong>between 6:00 PM and 9:00 AM.</strong> You may cancel your order <strong> before 9:00 AM on the same day."</strong></>,
      "Occasionally, the website may be closed due to weather conditions (e.g., rain). Don’t worry, it won’t affect your orders.",
      <>Please collect your items <strong>between 10:00 AM and 5:00 PM.</strong> Orders not picked up within this time frame will expire and be marked as 'expired.'</>,
      <> <strong>"If your order status expires, you will receive a 90% refund of the amount paid."</strong></>,
      "We apologize for the inconvenience. Currently, we have a limited delivery area, but we are working to expand and bring fresh fruits to more locations soon.",
      <><strong>"Steps for ordering:"</strong> </>,
      "1. Click on the 'Order' button or directly select the 'Order Menu' to place your order.",
      "2. Adjust the quantity of pieces as needed, and the price will update accordingly. Please note that the quantity of single pieces cannot be reduced below 10. Then click 'Buy'.",
      "3. Fill in your delivery details accurately and click 'Save.' You can view your information under 'Customer Details' in the Delivery section. Make payment.",
      "4. Once your payment is complete, you'll receive an OTP. Please keep it confidential. You will be directed to the 'Orders' section, and your order status will be marked as 'Pending.'",
    ],
    
    telugu: [
      "ఆర్డర్ చేయడానికి దయచేసి లాగిన్ అవ్వాలి మరియు మీ ఆర్డర్‌కు సంబంధించిన సమాచారం అందించబడుతుంది.",
      <>ఆర్డర్‌లు రాత్రి <strong>6:00 PM నుండి ఉదయం 9:00 AM వరకు</strong> చేయవచ్చు. అదే రోజున ఉదయం 9:00 AMకి ముందు మీరు ఆర్డర్‌ను రద్దు చేయవచ్చు."</>,
      "వాతావరణ పరిస్థితుల వల్ల వెబ్‌సైట్ మూసివేయబడవచ్చు (ఉదా: వర్షం). మీ ఆర్డర్‌లపై ప్రభావం ఉండదు.",
      <>మీరు <strong>10:00 AM నుండి 5:00 PM మధ్యలో</strong> మీ వస్తువులను సేకరించాలి. ఈ సమయం గడవగానే, ఆర్డర్ 'expired'గా మారుతుంది."</>,
      <> <strong>"మీ ఆర్డర్ స్టేటస్ 'expired' అయితే, చెల్లించిన మొత్తం90% తిరిగి చెల్లించబడుతుంది."</strong></>,
      "అసౌకర్యానికి మేము క్షమాపణ కోరుతున్నాము. ప్రస్తుతం పరిమిత డెలివరీ ప్రాంతం ఉంది. కానీ త్వరలోనే మేము విస్తరిస్తాము.",
      <><strong> "ఆర్డర్ చేసే విధానం:"</strong></>,
      "1. 'ఆర్డర్' బటన్‌ను నొక్కండి లేదా 'ఆర్డర్ మెనూ'ను ఎంచుకోండి.",
      "2. పీసెస్ పరిమాణాన్ని సవరించండి. ధర మారుతుంది. పీసెస్ 10కి తగ్గించలేరు. తర్వాత 'Buy' నొక్కండి.",
      "3. వివరాలు సరిగా నమోదు చేసి 'Save' నొక్కండి. 'Customer Details'లో వివరాలు చూడవచ్చు. చెల్లింపు చేయండి.",
      "4. చెల్లింపు పూర్తయిన తర్వాత OTP అందుతుంది. దయచేసి దానిని రహస్యంగా ఉంచండి. ఆ తర్వాత 'Orders' విభాగానికి దారితీస్తుంది.",
    ],
    
    hindi: [
      "ऑर्डर करने के लिए लॉगिन करना आवश्यक है। आपके ऑर्डर की स्थिति की जानकारी दी जाएगी।",
      <>ऑर्डर <strong>6:00 PM से 9:00 AM तक</strong> किया जा सकता है। आप उसी दिन सुबह 9:00 AM से पहले अपना ऑर्डर रद्द कर सकते हैं।</>,
      "मौसम की स्थिति (जैसे बारिश) के कारण वेबसाइट बंद हो सकती है। आपके ऑर्डर पर इसका कोई असर नहीं पड़ेगा।",
      <>कृपया अपने आइटम <strong>सुबह 10:00 AM से शाम 5:00 PM के बीच</strong> कलेक्ट करें। इसके बाद ऑर्डर 'expired' हो जाएगा।</>,
      <>यदि आपका ऑर्डर स्टेटस 'expired' हो जाता है, तो आपको <strong>90%</strong> रिफंड दिया जाएगा।</>,
      "हम असुविधा के लिए क्षमा चाहते हैं। फिलहाल, हमारी डिलीवरी क्षेत्र सीमित है। लेकिन जल्द ही हम इसे बढ़ाने का प्रयास कर रहे हैं।",
      <> <strong> "ऑर्डर करने के चरण:"</strong></>,
      "1. 'ऑर्डर' बटन पर क्लिक करें या 'ऑर्डर मेनू' चुनें।",
      "2. मात्रा समायोजित करें। कीमत अपडेट होगी। मात्रा 10 से कम नहीं हो सकती। फिर 'Buy' पर क्लिक करें।",
      "3. अपनी डिटेल्स भरें और 'Save' पर क्लिक करें। 'Customer Details' में जानकारी देखें। भुगतान करें।",
      "4. भुगतान पूरा होने पर, आपको OTP मिलेगा। इसे गोपनीय रखें। फिर 'Orders' अनुभाग में जाएं।",
    ]
    
  };
  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };
  // Update name from user object
  useEffect(() => {
    if (user && user!='undefined') {
      setName(user);
      settname(true)
    } else {
      setName(''); // Ensure name is reset to avoid "undefined"
    }
      // handleKart()
   
  }, [user]);
  // Logout Confirmation Toast
  const handleLogout = () => {
    const toastId = 'logout-toast';
    handleticon();

    if (!toast.isActive(toastId)) {
      toast.info(
        <div>
          <p style={{ padding: '1px' }}>Do you really want to logout?</p>
          <button
            onClick={() => {
              toast.dismiss(toastId);
              logout();
              navigate('/');
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
            onClick={() => toast.dismiss(toastId)}
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
          onClick: () => {
            toast.dismiss(toastId);
          },
          toastId,
          style: {
            top: '6em',
            width: isMobile ? '70%' : '100%',
          },
        }
      );
    }
  }; 
  // Handle Toggle Icon
  const handleticon = () => {
    setticon((prevTicon) => !prevTicon);
    toggleicon()
  };

  // Handle Click Outside to Close Navbar
  const handleClickOutside = (event) => {
    if (
      ticon &&
      navbarRef.current &&
      !navbarRef.current.contains(event.target) &&
      iconContainerRef.current &&
      !iconContainerRef.current.contains(event.target)
      
    ) {
      setticon(false);
      setistoggleicon(true)
    }
  };

  useEffect(() => {
    // console.log('tkart',kart)
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ticon,dkart]);
  return (
    <>
      <ToastContainer />
      {/* Topbar Component */}
      <nav id="nav">
        <NavLink to="/">
          <div className="logo">
            <img src="plogo.png" alt="Logo" id="limg2" />
          </div>
        </NavLink>
        {tname && (
          <p className="logotext">Hello {user}</p>
        )}
        <div ref={iconContainerRef}>
          {istoggleicon?  <IoReorderThree
            id="ticon" onClick={handleticon}
          />:<RxCross1 onClick={handleticon} id='ticon2'/>}
          <div className="note-icon"style={{cursor:'pointer'}}>
            <CgNotes  onClick={() => setNote(true)} />
          <p style={{fontSize:'0.5em',textWrap:'nowrap',position:'absolute',bottom:'-1.5em'}}>Terms & Conditions</p>
          </div>
          
        </div>

        <div id="tbox" className={ticon ? 'active' : ''} ref={navbarRef}>
          <NavLink to="/" className="ttext">
            <p className="ttext">Home</p>
          </NavLink>
          <NavLink to="/about" className="ttext">
            <p className="ttext">About</p>
          </NavLink>
          <NavLink to="/ordermenu" className="ttext">
            <p className="ttext">OrderMenu</p>
          </NavLink>
          <NavLink to="/order" className="ttext">
            <p className="ttext">Orders</p>
          </NavLink>
          <NavLink to="/reviews" className="ttext">
            <p className="ttext">Reviews</p>
          </NavLink>
          {isAuthenticated && tname?(
            <p className="ttext" onClick={handleLogout} style={{ cursor: 'pointer' }}>
              Logout
            </p>
          ) : (
            <NavLink to="/auth" className="ttext">
              <p className="ttext">Login</p>
            </NavLink>
          )}
        </div>
      </nav>

      {/* Terms and Conditions Modal */}
      {note && (
        <div className="notepad" onClick={() => setNote(false)}>
          <div className="note-content" onClick={(e) => e.stopPropagation()}>
            <RxCross1 onClick={() => setNote(false)} className="note-close" />
            <h2>Terms and Conditions</h2>
            <p style={{paddingLeft:'0.8em'}}>Welcome to our website! Here are the terms and conditions:</p>
            <select value={language} onChange={handleLanguageChange} style={{position:'absolute'}} className='lselect'
            >
              <option value="english">English</option>
              <option value="telugu">Telugu</option>
              <option value="hindi">Hindi</option>
            </select>
            <ul>
              {termsAndConditions[language].map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {isOpen && (<div className='kart'>
        {isOpen === null ? <h4>Loading...</h4> : 
        <marquee behavior="" direction="" >
        "PalmyraKart is temporarily unavailable for placing orders. Please visit us again soon to check for updates!"</marquee>}
        </div>)}
        
    </>
  );
};

export default Topbar;
