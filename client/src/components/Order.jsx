import React, { useEffect, useState } from 'react';
import './Order.css';
import Topbar from './Topbar';
import axios from 'axios';
import { PiCurrencyInr } from "react-icons/pi";
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TawkTo from './TawkTo';

const Order = ({ order2, resetOrder }) => {
  const [odata, setOdata] = useState(null);
  const [addressLookup, setAddressLookup] = useState({});
  const [isBeforeTenAM, setIsBeforeTenAM] = useState(true);
  const [cancel, setCancel] = useState(false);
  const [orderId, setOrderId] = useState();
  const [item, setItem] = useState({});
  const [cancellationReason, setCancellationReason] = useState('order cancel');
  const isMobile = window.innerWidth <= 768;
  const[email,setemail]=useState()
  const navigate = useNavigate();
  // const url = 'https://ice-apple-6.onrender.com';
  const url = 'http://localhost:4000/api/user';
  const getData = async () => {
    try {
      const response = await axios.get(`${url}/data`, { withCredentials: true });
  
      // console.log("Fetched Data:", response.data.userData); // Debugging
  
      if (response.data.success && response.data.userData) {
        const udata = response.data.userData;
        setemail(udata.email)
        // Ensure orders and address exist
        const orders = udata.orders || [];
        const addresses = udata.address || [];
        
        const lookup = {};
        orders.forEach((order, index) => {
          lookup[order._id] = addresses[index] || "No address available";
        });
  
        setOdata({ ...udata, orders }); // ✅ Ensures orders is always an array
        setAddressLookup(lookup);
      } else {
        console.warn("User data not found in response.");
        setOdata({ orders: [] }); // ✅ Prevents undefined errors
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOdata({ orders: [] }); // ✅ Prevents UI crashes
    }
  };
  
  const cancelButton = (id, type, img, quantity, price, status, date) => {
    console.log('id',id)
    setCancel(true);
    setItem({
      itemtype: type,
      itemimg: img,
      itemquantity: quantity,
      itemprice: price,
      itemdate: date,
      itemstatus:status
    });
    setOrderId(id);
    console.log("Order cancellation initialized for:", id);
  };

  const handleCancel = async (orderId,status) => {

    const deleteurl=`${url}/order/${orderId}`
    console.log('ordermenu orderid',orderId,deleteurl)
    try {
      const response = await axios.delete(`${deleteurl}`, {
        headers: { 'Content-Type': 'application/json' },
        data: { email, cancellationReason }, // ✅ Ensure the body is sent properly
      });
      getData();
      goBack();
      setCancellationReason('');
     status==='expired'? toastfun(' Expired order Cancelled Successfully','success'):toastfun('Order Cancelled Successfully','success');
    } catch (error) {
      toastfun('Failed to cancel the order. Please try again.','error');
    }
  };

  const checkIfBeforeTenAM = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    setIsBeforeTenAM(currentHour < 10 || (currentHour === 10 && currentMinutes === 0));
  };

  const goBack = () => {
    setCancel(false);
  };

  useEffect(() => {
    getData();
    checkIfBeforeTenAM();
    // console.log('data',odata)
  }, []);
  const toastfun = (msg, type) => {
    toast[type](msg, {
      position: 'top-right',
      autoClose: 3000,
      style: {
        position: 'absolute',
        right: '0em',
        top:isMobile?'4em':'70px',
        width:isMobile?'70vw':'40vw', // Set width for mobile
        height:isMobile?'10vh':'17vh',
        fontSize:isMobile?'1em': "1.2em", // Adjust font size
        padding: "10px", // Adjust padding
      },
      onClick: () => {
        toast.dismiss(); // Dismiss the toast when clicked
      },
    });
  };
  // Handle toast notification when order2 changes
  useEffect(() => {

    if (order2) {
      toastfun('Payment Successful! Your order will be processed shortly.','success')
     
      resetOrder(); // Reset `order` state in Landingpage to false
    }

  }, [order2, resetOrder]);

  return (
    <div>
     
      <Topbar />
      <div className="order">
        <h1>Your Orders</h1>
        {odata && (
          <div className="omsg">
            <marquee behavior="" direction="" className="time-message">
              Orders can only be canceled before 10:00 AM!
            </marquee>
          </div>
        )}
        <div className="items" id="items" style={{ display: cancel ? 'none' : 'block' }}>
          {
            odata ? (
              odata.orders.length > 0 ? (
                odata.orders
                  .slice()
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((order) => (
                    <div key={order._id} className="box">
                      <div className="image">
                        <img src={order.imagePath} alt={order.item} />
                      </div>
                      <p id="itemname">Item Type: <span>{order.item}</span></p>
                      <p id="quantity">Quantity: {order.quantity}</p>
                      <p id="price">
                        Price: <span className='ovalues'><PiCurrencyInr id="inr" />{order.price}</span>
                      </p>
                      <p id="date">Date & Time: {new Date(order.date).toLocaleString()}</p>
                      <p id="oaddress">Delivery Address: {addressLookup[order._id]}</p>
                      <p id="status">
                        <strong>Status:</strong>{' '}
                        <span style={{ color: 'orangered' }}>{order.status}</span>
                      </p>
                      {order.status !== 'cancelled' && (
                        <div>
                          <button
                            id="cancel"
                            onClick={() => cancelButton(order.orderId, order.item, order.imagePath, order.quantity, order.price, order.status, new Date(order.date).toLocaleString())}
                            disabled={!isBeforeTenAM || order.status === 'delivered'}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))
              ) : (
                <p style={{ textAlign: 'center', fontSize: '1.5em' }}>No orders found...</p>
              )
            ) : (
              <p style={{ textAlign: 'center', fontSize: '1.5em' }}>Loading orders...</p>
            )
          
          }
        </div>
        {cancel && (
          <div className="cancel-box">
            <img src={item.itemimg} alt="" id="itemimg" />
            <p id='creason'>Do You Really Want To Cancel The Order...</p>
            <p className='tcancel tc1' id='tc1'>Item Type: {item.itemtype}</p>
            <p className="tacancel tc4"> <span id='dt'>Date&Time:</span> <p id='dvalue'>   {item.itemdate}</p></p>
            <p className='tcancel tc2' id='tc2'> Quantity: {item.itemquantity}</p>
            <p className='tcancel tc3' id='tc3'>Item Price: <PiCurrencyInr id="cinr" />{item.itemprice}</p>
            <button onClick={goBack} id='cback'>Back</button>
            <button onClick={() => handleCancel(orderId,item.itemstatus)} id='ccancel'>Confirm</button>
          </div>
        )}
      </div>
     
    </div>
  );
};

export default Order;
