import React, { useEffect, useState } from 'react';
import './OrderMenu.css';
import Topbar from '../../components/Topbar';
import { FaIndianRupeeSign } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { database, ref, onValue, get } from '../../firebase/firebase'; // Import Firebase functions
import { LiaMedkitSolid } from 'react-icons/lia';
import Whatsapp from './Whatsapp';

const OrderMenu = ({ buy, llimit2 }) => {
  const [count, setCount] = useState(10);
  const [count2, setCount2] = useState(1);
  const [total1, setTotal1] = useState(40);
  const [total2, setTotal2] = useState(45);
  const { dkart, limit, handleKart } = useAuth();
  const [totalAvailable, setTotalAvailable] = useState(0); // To store the available quantity from Firebase
  const navigate = useNavigate();
  const [orderLimit, setOrderLimit] = useState(0); // To store the daily limit from Firebase
  const [isBeforeTenAM, setIsBeforeTenAM] = useState(true); // For checking time
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true); // Loading state

  // Firebase collection reference
  const url = import.meta.env.VITE_FIREBASE_URL;
  const collection = import.meta.env.VITE_FIREBASE_COLLECTION;
  const inventoryRef = ref(database, `${url}/${collection}`);

  useEffect(() => {
    // Fetch initial data using `get`
    get(inventoryRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const limit = data.limit || 100; // Default to 100 if `limit` is missing or 0
        const stock = data.stock || 0; // Default to 0 if `stock` is missing or 0
        const open=data.isOpen;
        setIsOpen(open)
        setOrderLimit(limit); // Update the daily limit
        setTotalAvailable(stock); // Update the available stock
        setLoading(false); // Data has been fetched
      }
    });

    // Listen for real-time updates using `onValue`
    const unsubscribe = onValue(inventoryRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const limit = data.limit || 100; // Default to 100 if `limit` is missing or 0
        const stock = data.stock || 0; // Default to 0 if `stock` is missing or 0
        const open=data.isOpen;
        setIsOpen(open)
        setOrderLimit(limit); // Update the daily limit
        setTotalAvailable(stock); // Update the available stock
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  // Check if the current time is before 10:00 AM
  const checkIfBeforeTenAM = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();

    // Check if current time is before 10:00 AM
    if (currentHour < 10 || (currentHour === 10 && currentMinutes === 0)) {
      setIsBeforeTenAM(true);
    } else {
      setIsBeforeTenAM(false);
    }
  };

  // Handle buy button click
  const handleBuyClick = (c, src, type) => {
    const totalSelectedQuantity = type === 'single' ? c : c * 12; // Calculate total pieces
    const remainingPieces = orderLimit - totalAvailable; // Calculate remaining pieces

    if (!isOpen) {
      if (totalSelectedQuantity > remainingPieces) {
        alert(`Only ${remainingPieces} pieces are available. Please reduce your order quantity.`);
        return;
      }

      if (c === count) {
        buy(count, total1, src, type);
        navigate('/buy');
      } else {
        buy(count2, total2, src, type);
        navigate('/buy');
      }
    } else {
      console.log('error while buying');
    }
  };

  // Increment and decrement functions
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

  // Update totals and check time on count change
  useEffect(() => {
    setTotal1(count * 4);
    setTotal2(count2 * 48 - 3);
    checkIfBeforeTenAM();
  }, [count, count2]);

  useEffect(() => {
  }, [orderLimit, totalAvailable]);

  return (
    <div>
      <Topbar />
      <Whatsapp></Whatsapp>
      <div className="orderm">
        <div className="oblock">
          <marquee behavior="" direction="">
            <p>Hurry Up...! Only {orderLimit - totalAvailable} pieces are available, Order Now!!!</p>
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
                  disabled={isOpen || (count > (orderLimit - totalAvailable))} // Disable if past 10:00 AM, cart is closed, or order exceeds limit
                >
                  BUY
                </button>
                <p className="time-message2"><strong>Buying is allowed only before 10:00 AM!</strong></p>
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
                  disabled={isOpen || (count2 * 12 > (orderLimit - totalAvailable))} // Disable if past 10:00 AM, cart is closed, or order exceeds limit
                >
                  BUY
                </button>
                <p className="time-message2"><strong>Buying is allowed only before 10:00 AM!</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderMenu;