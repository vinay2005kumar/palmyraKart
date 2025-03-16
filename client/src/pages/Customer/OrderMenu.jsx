import React, { useEffect, useState } from 'react';
import './OrderMenu.css';
import Topbar from '../../components/Topbar';
import { FaIndianRupeeSign } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { database, ref, set, onValue,get } from "../../firebase/firebase";
import { LiaMedkitSolid } from 'react-icons/lia';
import Whatsapp from './Whatsapp';
// import { database, ref, set} from '../firebase/firebase'
const OrderMenu = ({ buy, quantity, llimit2 }) => {
  const [count, setCount] = useState(10);
  const [count2, setCount2] = useState(1);
  const [total1, setTotal1] = useState(40);
  const [total2, setTotal2] = useState(45);
  const{dkart,limit,handleKart}=useAuth()
  const [totalAvailable, setTotalAvailable] = useState(0); // To store the available quantity from the backend
  const navigate = useNavigate();
  const[limit2,setlimit]=useState(limit)
  const[orderLimit,setOrderLimit]=useState()
  //  const[isKart,setKart]=useState(true)
   const url = 'https://palmyra-fruit.onrender.com/api/user';
   //const url = 'http://localhost:4000/api/user';
  const [isBeforeTenAM, setIsBeforeTenAM] = useState(true); // For checking time
  const [isOpen, setIsOpen] = useState(true);
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
  const url = import.meta.env.VITE_FIREBASE_URL;
  const collection = import.meta.env.VITE_FIREBASE_COLLECTION;
  const limitRef = ref(database, `${url}/${collection}`);
 // Fetch initial value once
 get(limitRef).then((snapshot) => {
  if (snapshot.exists()) {
    setOrderLimit(snapshot.val().limit);
  }
});
  // Listen for real-time updates for `limit`
  const unsubscribe = onValue(limitRef, (snapshot) => {
    if (snapshot.exists()) {
      setOrderLimit(snapshot.val().limit);
    }
  });

  return () => unsubscribe(); // Cleanup on unmount
}, []);
  // const socket = io(url, {
  //   transports: ["websocket", "polling"], // Force WebSocket transport
  //   withCredentials: true, // Include credentials (optional)
  //   reconnection: true, // Enable auto-reconnect
  //   reconnectionAttempts: 5, // Try reconnecting 5 times
  //   reconnectionDelay: 1000, // Delay between reconnect attempts
  // });
  const fetchAvailableQuantity = async () => {
    const availableQuantity = await quantity(); // Fetch quantity from parent component
    setTotalAvailable(availableQuantity);
    // setlimit(llimit2)
    // console.log('alimit',limit)
    // console.log('olimig',limit2)
    // console.log('limit',llimit2)
    console.log('total available',totalAvailable); // Update the state
  };

  const increment = () => setCount((prev) => prev + 1);
  const decrement = () => {
    if (count > 10) {
      setCount((prev) => prev - 1);
    }
  };
  const increment2 = () => setCount2((prev) => prev + 1);
  const decrement2 = () => {
    if (count2 > 1) {
      setCount2((prev) => prev - 1);
    }
  };

  const handleBuyClick = (c, src, type) => {
    const totalSelectedQuantity = type === 'single' ? count : count2;
  if(!isOpen){

    if (c === count) {
      buy(count, total1, src, type);
      navigate('/buy');
    } else {
      buy(count2, total2, src, type);
      navigate('/buy');
    }
  }else{
    console.log('error while buying')
  }
  };

  const checkIfBeforeTenAM = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    
    // Check if current time is before 10:00 AM
    if (currentHour < 10 || (currentHour === 10 && currentMinutes === 0)) {
      setIsBeforeTenAM(true);
    } else {
      setIsBeforeTenAM(true);
    }
  };
  // const handlelimit = async () => {
  //   try {
  //     const res = await axios.get('http://localhost:5005/user');
  //     const users = res.data.users;
  
  //     if (users.length > 0) {
  //       const limit = users[0].limit;
  //       setlimit(limit)
  //     } else {
  //       console.log('No users found');
  //     }
  //   } catch (error) {
  //     console.error('Error fetching user data:', error);
  //   }
  // };
  useEffect(() => {
    
    // handlelimit()
    // const fetchKartStatus = async () => {
    //   try { 
    //     const res = await axios.get(`${url}/kart-status`)
    //     const value = res.data; // Access the value
    //     setKart(value); 
    //     //console.log('order',value)
    //   } catch (error) {
    //     console.error('Error fetching user:', error);
    //   }
    // };
    //fetchKartStatus();
      // Listen for real-time updates
    // socket.on("kart-status-updated", (status) => {
    //   setKart(status);

    // });
    // socket.on("limit-status-updated",(status)=>{
    //   setlimit(status)
    
    // })
    
   
    // return () => {
    //   socket.off("kart-status-updated");
    //   socket.off('limit-status-updated')
    // };

  }, []);
  useEffect(() => {

    setTotal1(count * 4);
    setTotal2(count2 * 48 - 3);
    // console.log('order', count, count2);
    fetchAvailableQuantity();
    checkIfBeforeTenAM(); 
    console.log('context order limit',limit,llimit2)
    // handlelimit()
  }, [count, count2,llimit2]);

  return (
    <div>
      <Topbar />
      <Whatsapp></Whatsapp>
      <div className="orderm">
        <div className="oblock">
          <marquee behavior="" direction="">
            <p>Hurry Up...! Only {orderLimit-totalAvailable} pieces are available, Order Now!!!</p>
          </marquee>
          <div className="oblock1">
            <h1>Single Pieces</h1>
            <div className="obox">
              <img src="p3.jpeg" alt="" className="oimg" />
              <p className="otext">
                This fruit is particularly effective in cooling the body, making it an excellent choice during hot weather. It is rich in essential nutrients such as vitamins A, B, and C, which support skin health, boost immunity, and improve digestion.
                <span className="hide otext">
                The fruit's natural sugars provide a quick energy boost, while its high water content helps in maintaining hydration.
                </span>
              </p>
              <div className="oname">
                <p>Palmyra Fruit</p>
              </div>
              <div className="count">
                <button className="odec" onClick={decrement}>
                  -
                </button>
                <p className="ocount">{count}</p>
                <button className="oinc" onClick={increment}>
                  +
                </button>
              </div>
              <div className="tcost">
                <FaIndianRupeeSign className="inr" />
                <p>{total1}</p>
              </div>
              <div className="obuy">
                <button
                  onClick={() => handleBuyClick(count, 'p3.jpeg', 'single')}
                  id="obuy"
                  className={isOpen ? "disabled" : ""}
                  disabled={!isBeforeTenAM || isOpen} // Disable button if past 10:00 AM
                >
                  BUY
                </button>
                <p className="time-message2"><strong>Buying is allowed only before 10:00 AM!</strong></p>
                {/* {!isBeforeTenAM && <p className="time-message2"><strong>Buying is allowed only before 10:00 AM!</strong></p>} */}
              </div>
            </div>
          </div>
          <div className="oblock2">
            <h1>Dozen Pieces</h1>
            <div className="obox">
              <img src="p2.jpeg" alt="" className="oimg" />
              <p className="otext">
                This fruit is particularly effective in cooling the body, making it an excellent choice during hot weather. It is rich in essential nutrients such as vitamins A, B, and C, which support skin health, boost immunity, and improve digestion. 
                <span className="hide otext">
                The fruit's natural sugars provide a quick energy boost, while its high water content helps in maintaining hydration.
                </span>
              </p>
              <div className="oname">
                <p>Palmyra Fruit</p>
              </div>
              <div className="count">
                <button className="odec" onClick={decrement2}>
                  -
                </button>
                <p className="ocount">{count2}</p>
                <button className="oinc" onClick={increment2}>
                  +
                </button>
              </div>
              <div className="tcost">
                <FaIndianRupeeSign className="inr" />
                <p>{total2}</p>
              </div>
              <div className="obuy">
                <button
                  id="obuy2"
                  className={isOpen ? "disabled" : ""}
                  onClick={() => handleBuyClick(count2, 'p2.jpeg', 'dozen')}
                  disabled={!isBeforeTenAM || isOpen} // Disable button if past 10:00 AM
                >
                  BUY
                </button>
                <p className="time-message2"><strong>Buying is allowed only before 10:00 AM!</strong></p>
                {/* {!isBeforeTenAM && <p className="time-message2"><strong>Buying is allowed only before 10:00 AM!</strong></p>} */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderMenu;