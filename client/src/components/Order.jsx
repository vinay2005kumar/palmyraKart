import React, { useEffect, useState } from 'react';
import './Order.css';
import Topbar from './Topbar';
import axios from 'axios';
import { PiCurrencyInr } from 'react-icons/pi';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { RxCross2 } from "react-icons/rx";
const Order = ({ order2, resetOrder }) => {
  const [orderData, setOrderData] = useState([]);
  const [isBeforeTenAM, setIsBeforeTenAM] = useState(true);
  const [cancel, setCancel] = useState(false);
  const [orderId, setOrderId] = useState();
  const [item, setItem] = useState({});
  const [cancellationReason, setCancellationReason] = useState('order cancel');
  const isMobile = window.innerWidth <= 768;
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const url = 'http://localhost:4000/api/user'; // Update with your backend URL

  // Fetch user data and orders
  const fetchData = async () => {
    console.log('coming')
    try {
      const response = await axios.get(`${url}/data`, { withCredentials: true });

      if (response.data.success) {
        const { userData, orderData } = response.data;

        // Set user email
        setEmail(userData.email);
        console.log('orderdata', orderData, userData)
        // Set order data
        setOrderData(orderData || []);
      } else {
        console.warn('User data not found in response.');
        setOrderData([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrderData([]);
      toast.error('Failed to fetch orders. Please try again later.');
    }
  };

  // Cancel order
  const cancelOrder = async (orderId, status) => {
    try {
      const deleteUrl = `${url}/order/${orderId}`;
      await axios.delete(deleteUrl, {
        headers: { 'Content-Type': 'application/json' },
        data: { email, cancellationReason },
      });

      // Refresh data after cancellation
      fetchData();
      setCancel(false);

      // Show success toast
      const message = status === 'Cancelled' ? 'Expired order cancelled successfully' : 'Order cancelled successfully';
      toast.success(message);
    } catch (error) {
      toast.error('Failed to cancel the order. Please try again.');
    }
  };

  // Check if the current time is before 10:00 AM
  const checkIfBeforeTenAM = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    setIsBeforeTenAM(currentHour < 10 || (currentHour === 10 && currentMinutes === 0));
  };
  // Handle cancel button click
  const handleCancelClick = (id, type, img, quantity, price, status, date) => {
    setCancel(true);
    setItem({
      itemtype: type,
      itemimg: img,
      itemquantity: quantity,
      itemprice: price,
      itemdate: date,
      itemstatus: status,
    });
    setOrderId(id);
  };
  const toastfun = (msg, type) => {
    toast[type](msg, {
      position: 'top-center',
      autoClose: 3000,
      style: {
         position: 'absolute',
        top:isMobile?'6vh':'60px',
        left:isMobile && '13%',
        width:isMobile?'80vw': "40vw", // Set width for mobile
        height:isMobile?'10vh':'10vh',
        fontSize: "1.2rem", // Adjust font size
        padding: "10px", // Adjust padding
      },
      onClick: () => {
        toast.dismiss(); // Dismiss the toast when clicked
      },
    });
  };

  const deleteOrder = async (orderId) => {
    // Custom confirmation toast
    toastfun(
      <div>
        <p>Do you want to delete this order history?</p>
        <button
          onClick={() => {
            toast.dismiss(); // Dismiss the toast
            confirmDelete(orderId); // Proceed with deletion
          }}
        >
          Yes
        </button>
        <button
          onClick={() => toast.dismiss()} // Dismiss the toast
        >
          No
        </button>
      </div>,
      'info' // Use 'info' type for the toast
    );
  };
  
  // Function to handle the actual deletion
  const confirmDelete = async (orderId) => {
    try {
      const deleteUrl = `${url}/removeOrder/${orderId}`; // Pass orderId as a query parameter
      await axios.delete(deleteUrl, {
        headers: { 'Content-Type': 'application/json' },
      });
  
      // Refresh data after deletion
      fetchData();
  
      // Show success toast
      toastfun('Order history deleted successfully', 'success');
    } catch (error) {
      toastfun('Failed to delete the order history. Please try again.', 'error');
    }
  };
  // Handle payment success toast
  useEffect(() => {
    if (order2) {
      toast.success('Payment Successful! Your order will be processed shortly.');
      resetOrder();
    }
  }, [order2, resetOrder]);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
    checkIfBeforeTenAM();
  }, []);

  return (
    <div>
      <Topbar />
      <div className="order">
        <h1>Your Orders</h1>
        {orderData.length > 0 && (
          <div className="omsg">
            <marquee behavior="" direction="" className="time-message">
              Orders can only be canceled before 10:00 AM!
            </marquee>
          </div>
        )}
        <div className="items" id="items" style={{ display: cancel ? 'none' : 'block' }}>
          {orderData.length > 0 ? (
            orderData
              .slice()
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((order) => (
                <div key={order.id} className="box">
                  <div className="image">
                    <img src={order.items[0]?.imagePath} alt={order.items[0]?.itemName} />
                  </div>
                  <p id="itemname">Item Type: <span>{order.items[0]?.itemType}</span></p>
                  <p id="quantity">Quantity: {order.items[0]?.quantity}</p>
                  <p id="price">
                    Price: <span className="ovalues"><PiCurrencyInr id="inr" />{order.items[0]?.price}</span>
                  </p>
                  <p id="date">Date & Time: {new Date(order.date).toLocaleString()}</p>
                  <p id="oaddress">
                    Delivery Address: {`${order.shippingAddress.street}`}
                  </p>
                  <p id="status">
                    <strong>Status:</strong>{' '}
                    <span style={{ color: 'orangered' }}>{order.status}</span>
                  </p>
                  {/* <p id="paymentMethod">
                    <strong>Payment Method:</strong>{' '}
                    <span>{order.paymentMethod}</span>
                  </p> */}
                  {order.status !== 'Cancelled' ? (
                    <div>
                      <button
                        id="cancel"
                        onClick={() => handleCancelClick(order.orderId, order.items[0]?.itemType, order.items[0]?.imagePath, order.items[0]?.quantity, order.items[0]?.price, order.status, new Date(order.date).toLocaleString())}
                        disabled={isBeforeTenAM || order.status === 'delivered'}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button id='cancel'
                      onClick={() => deleteOrder(order.orderId)} // Add a function to handle deletion
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))
          ) : (
            <p style={{ textAlign: 'center', fontSize: '1.5em' }}>No orders found...</p>
          )}
        </div>
        {cancel && (
          <div className="cancel-box">
            <img src={item.itemimg} alt="" id="itemimg" />
            <p id="creason">Do You Really Want To Cancel The Order...</p>
            <p className="tcancel tc1" id="tc1">Item Type: {item.itemtype}</p>
            <p className="tacancel tc4"> <span id="dt">Date & Time:</span> <p id="dvalue">{item.itemdate}</p></p>
            <p className="tcancel tc2" id="tc2">Quantity: {item.itemquantity}</p>
            <p className="tcancel tc3" id="tc3">Item Price: <PiCurrencyInr id="cinr" />{item.itemprice}</p>
            <button onClick={() => setCancel(false)} id="cback">Back</button>
            <button onClick={() => cancelOrder(orderId, item.itemstatus)} id="ccancel">Confirm</button>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default Order;