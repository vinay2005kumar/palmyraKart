import React, { useEffect, useState } from 'react';
import './Order.css';
import Topbar from '../../components/Topbar';
import FruitLoader from '../../components/FruitLoader';
import axios from 'axios';
import { PiCurrencyInr } from 'react-icons/pi';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { RxCross2 } from 'react-icons/rx';
import { useAuth } from '../../context/AuthContext';// Import the context

const Order = ({ order2, resetOrder }) => {
  const [isBeforeTenAM, setIsBeforeTenAM] = useState(true);
  const [cancel, setCancel] = useState(false);
  const [orderId, setOrderId] = useState();
  const [item, setItem] = useState({});
  const [cancellationReason, setCancellationReason] = useState('order cancel');
  const isMobile = window.innerWidth <= 768;
  const [email, setEmail] = useState('');
  const { orderDetails,userDetails, checkAuth, removeOrder,isLoading } = useAuth(); // Use context values
  const navigate = useNavigate();
  const url = 'https://palmyra-fruit.onrender.com/api/user';
 // const url = "http://localhost:4000/api/user";

  // Cancel order
  const cancelOrder = async (orderId,email) => {
    try {
      const deleteUrl = `${url}/order/${orderId}`;
      await axios.delete(deleteUrl, {
        headers: { 'Content-Type': 'application/json' },
        data: { email, cancellationReason },
      });

      // Refresh data after cancellation
      checkAuth();
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
        top: isMobile ? '6vh' : '60px',
        left: isMobile && '13%',
        width: isMobile ? '80vw' : '40vw',
        height: isMobile ? '10vh' : '10vh',
        fontSize: '1.2rem',
        padding: '10px',
      },
      onClick: () => {
        toast.dismiss();
      },
    });
  };

  // Function to handle the actual deletion
  const confirmDelete = async (orderId) => {
    const toastId = `delete-toast-${orderId}`;
  
    if (!toast.isActive(toastId)) {
      toast.info(
        <div>
          <p style={{ padding: '1px' }}>Are you sure you want to delete this order?</p>
          <button
            onClick={async () => {
              toast.dismiss(toastId);
              try {
                const deleteUrl = `${url}/deleteOrder/${orderId}`;
                await axios.delete(deleteUrl, {
                  headers: { 'Content-Type': 'application/json' },
                });
  
                // Update the context state
                deleteOrder(orderId);
  
                // Show success toast
                toastfun('Order history deleted successfully', 'success');
              } catch (error) {
                toastfun('Failed to delete the order history. Please try again.', 'error');
              }
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
  // Handle payment success toast
  useEffect(() => {
    if (order2) {
      toast.success('Payment Successful! Your order will be processed shortly.');
      resetOrder();
    }
  }, [order2, resetOrder]);

  // Fetch data on component mount
  useEffect(() => {
    checkIfBeforeTenAM();
    console.log('odetails',orderDetails,userDetails)
    setEmail(userDetails.email)
  }, []);

  return (
    <div>
      <Topbar />
      <div className="order">
        <h1>Your Orders</h1>
        {isLoading ? ( // Show loader if isLoading is true
         <FruitLoader></FruitLoader>
        ) : (
          <>
            {orderDetails.length > 0 && (
              <div className="omsg">
                <marquee behavior="" direction="" className="time-message">
                  Orders can only be canceled before 10:00 AM!
                </marquee>
              </div>
            )}
            <div className="items" id="items" style={{ display: cancel ? 'none' : 'block' }}>
              {orderDetails.length > 0 ? (
                orderDetails
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
                        <button id='cancel' onClick={() => confirmDelete(order.orderId)}>
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
                <button onClick={() => cancelOrder(orderId,email)} id="ccancel">Confirm</button>
              </div>
            )}
          </>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default Order;