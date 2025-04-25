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
import { useAuth } from '../../context/AuthContext';

const Order = ({ order2, resetOrder }) => {
  const [isBeforeTenAM, setIsBeforeTenAM] = useState(true);
  const [cancel, setCancel] = useState(false);
  const [isCancel,setIsCancel]=useState(false)
  const [orderId, setOrderId] = useState();
  const [item, setItem] = useState({});
  const [cancellationReason, setCancellationReason] = useState('order cancel');
  const isMobile = window.innerWidth <= 768;
  const [email, setEmail] = useState('');
  const { orderDetails, userDetails, checkAuth, removeOrder, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState();
  const url = 'https://palmyra-fruit.onrender.com/api/user';
  //const url = "http://localhost:4000/api/user";

  // Toast function with proper management
  const toastfun = (msg, type, toastId = 'default-toast') => {
    if (!toast.isActive(toastId)) {
      // Calculate approximate dimensions based on message length
      const messageLength = msg.length;
      const lineLength = isMobile ? 30 : 50; // Characters per line
      const lines = Math.ceil(messageLength / lineLength);
      
      // Calculate dynamic dimensions
      const minWidth = isMobile ? '80vw' : '30vw';
      const maxWidth = isMobile ? '90vw' : '40vw';
      const baseHeight = isMobile ? '10vh' : '10vh';
      const lineHeight = '1.5rem';
      const padding = 20; // px
      
      const dynamicHeight = `calc(${baseHeight} + ${Math.max(0, lines - 3)} * ${lineHeight})`;
      
      toast[type](msg, {
        position: 'top-right',
        autoClose: 3000,
        toastId,
        style: {
          position: 'absolute',
          top: isMobile ? '6vh' : '7vh',
          left: isMobile ? '5%' : 'auto',
          right: isMobile ? '5%' : '20px',
          minWidth: minWidth,
          maxWidth: maxWidth,
          width: 'auto', // Let it grow based on content
          height: 'auto', // Let it grow based on content
          minHeight: baseHeight,
          fontSize: '1.2rem',
          padding: '10px',
          whiteSpace: 'pre-wrap', // Preserve line breaks and wrap text
          wordWrap: 'break-word', // Break long words
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      });
    }
  };

  // Cancel order
  const cancelOrder = async (orderId, email) => {
     setIsCancel(true)
    try {
      const deleteUrl = `${url}/order/${orderId}`;
      await axios.delete(deleteUrl, {
        headers: { 'Content-Type': 'application/json' },
        data: { email, cancellationReason },
      });

      checkAuth();
      setCancel(false);
      setIsCancel(false)
      toastfun('Order Cancelled Successfully', 'success', `cancel-success-${orderId}`);
    } catch (error) {
      toastfun('Failed to cancel the order. Please try again.', 'error', `cancel-error-${orderId}`);
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

  // Function to handle the actual deletion
  const confirmDelete = async (orderId, status) => {
    const toastId = `delete-toast-${orderId}`;
    
    // Dismiss any existing toast with this ID
    toast.dismiss(toastId);

    toast.info(
      <div>
        <p style={{ padding: '1px' }}>Are you sure you want to delete this order?</p>
        <button
          onClick={async () => {
            toast.dismiss(toastId);
            try {
              if (status === 'Cancelled') {
                toastfun('Order cannot be deleted until Refunded.', 'error', `delete-error-${orderId}`);
              } else {
                const deleteUrl = `${url}/deleteOrder/${orderId}`;
                await axios.delete(deleteUrl, {
                  headers: { 'Content-Type': 'application/json' },
                });

                removeOrder(orderId);
                toastfun('Order history deleted successfully', 'success', `delete-success-${orderId}`);
              }
            } catch (error) {
              toastfun('Failed to delete the order history. Please try again.', 'error', `delete-error-${orderId}`);
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
        closeOnClick: false,
        draggable: false,
        autoClose: false,
        toastId,
        style: {
          top: '6em',
          width: isMobile ? '70%' : '100%',
        },
      }
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.toLocaleString('en-US', { weekday: 'short' });
    const month = date.toLocaleString('en-US', { month: 'short' });
    const dayOfMonth = date.getDate();
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return `${day} ${month} ${dayOfMonth} ${year} at ${hours}:${minutes} ${ampm}`;
  };


  
// Function to determine status color based on status value
function getStatusColor(status) {
  switch(status) {
    case 'Pending':
      return '#FF8C00'; // Dark Orange
    case 'Delivered':
      return '#008000'; // Green
    case 'Delivered*':
      return '#006400'; // Dark Green
    case 'Cancelled':
      return '#FF0000'; // Red
    case 'Refund':
      return '#4B0082'; // Indigo
    case 'Refunded':
      return '#800080'; // Purple
    case 'Refunded*':
      return '#800080'; // Purple
    default:
      return '#000000'; // Black
  }
}

// Function to get a more descriptive status display
function getStatusDisplay(status, deliveryDate) {
  switch(status) {
    case 'Pending':
      return `Delivery on ${deliveryDate}`;
    case 'Delivered':
      return `Successfully Delivered on ${deliveryDate}`;
    case 'Delivered*':
      return `Delivered on ${deliveryDate}`;
    case 'Cancelled':
      return 'Order Cancelled';
    case 'Refund':
      return 'Refund Processing';
    case 'Refunded':
      return 'Refund Completed';
      case 'Refunded*':
        return 'Refund Completed';
    default:
      return status;
  }
}

  // Handle payment success toast
  useEffect(() => {
    if (order2) {
      if (!toast.isActive('payment-success')) {
        toastfun('Payment Successful! Your order will be processed shortly.', 'success', 'payment-success');
        resetOrder();
      }
    }
  }, [order2, resetOrder]);

  // Fetch data on component mount
  useEffect(() => {
    checkAuth();
    checkIfBeforeTenAM();
    if (userDetails && userDetails.email) {
      setEmail(userDetails.email);
    }
  }, []);

  // Render when user is not authenticated
  const renderNotAuthenticated = () => {
    return (
      <div className="not-authenticated-container">
        <div className="auth-message">
          <img src="ap10.jpeg" alt="Palmyra Fruit" className="auth-image" />
          <h2>Please Sign In to View Your Orders</h2>
          <p>Sign in to track your deliveries, view order history, and enjoy fresh Palmyra fruit!</p>
          <div className="auth-buttons">
            <button className="auth-button login" onClick={() => navigate('/auth')}>
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render when user has no orders
  const renderNoOrders = () => {
    return (
      <div className="no-orders-container">
        <div className="no-orders-message">
          <img src="palmyra4.jpeg" alt="Fresh Palmyra Fruit" className="no-orders-image" />
          <h2>No Orders Yet!</h2>
          <p>
            Experience the refreshing taste of summer with our juicy Palmyra fruit. 
            Rich in vitamins and minerals, it's the perfect healthy treat for hot days!
          </p>
          <div className="benefit-points">
            <div className="benefit-point">
              <span className="benefit-icon">✓</span>
              <span>Rich in vitamins</span>
            </div>
            <div className="benefit-point">
              <span className="benefit-icon">✓</span>
              <span>Natural hydration</span>
            </div>
            <div className="benefit-point">
              <span className="benefit-icon">✓</span>
              <span>Boosts immunity</span>
            </div>
          </div>
          <button className="order-now-button" onClick={() => navigate('/ordermenu')}>
            Order Now
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <Topbar />
      <div className="order">
        <h1>Your Orders</h1>
        {isLoading ? (
          <FruitLoader></FruitLoader>
        ) : !isAuthenticated ? (
          renderNotAuthenticated()
        ) : (
          <>
            {orderDetails.length > 0 ? (
              <>
                <div className="omsg">
                  <marquee behavior="" direction="" className="time-message">
                    Orders can only be canceled before 10:00 AM!
                  </marquee>
                </div>
                <div className="items" id="items" style={{ display: cancel ? 'none' : 'block' }}>
                  {orderDetails
                    .slice()
                    .sort((a, b) => {
                      // First, sort by status (Pending comes first)
                      if (a.status === 'Pending' && b.status !== 'Pending') return -1;
                      if (a.status !== 'Pending' && b.status === 'Pending') return 1;
                      
                      // If both have same status, sort by date (most recent first)
                      const dateA = new Date(a.date);
                      const dateB = new Date(b.date);
                      return dateB - dateA;
                    })
                    .map((order) => {
                      const orderDate = new Date(order.date);
                      const orderHour = orderDate.getHours(); // Get hours (0-23)
                      
                      const deliveryDate = new Date(orderDate);
                      
                      // Check the time range
                      if (orderHour >= 12 || orderHour === 0) { // 4:00 PM - 11:59 PM or exactly 12:00 AM
                        deliveryDate.setDate(orderDate.getDate() + 1);
                      } else {
                        deliveryDate.setDate(orderDate.getDate());
                      }
                      
                      // Format date as dd/mm/yyyy with leading zeros
                      const formatDeliveryDate = (date) => {
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        return `${day}/${month}/${year}`;
                      };
                      
                      const formattedDeliveryDate = formatDeliveryDate(deliveryDate);
                      
                      return (
                        <div key={order._id} className="box">
                          <div className="image">
                            <img src={order.items[0]?.imagePath} alt={order.items[0]?.itemName} />
                          </div>
                          <p id="itemname">Item Type: <span>{order.items[0]?.itemType}</span></p>
                          <p id="quantity">Quantity: {order.items[0]?.quantity}</p>
                          <p id="price">
                            Price: <span className="ovalues"><PiCurrencyInr id="inr" />{order.items[0]?.price}</span>
                          </p>
                          <p id="date">Date & Time: {formatDate(order.date)}</p>
                          <p id="oaddress">
                            Delivery Address: {`${order.shippingAddress.street}`}
                          </p>
                          <p id="status">
                            <strong>Order Status:</strong>{' '}
                            <span style={{ color: getStatusColor(order.status) }}>
                              {getStatusDisplay(order.status, formattedDeliveryDate)}
                            </span>
                          </p>
                          {order.status == 'Pending' ? (
                            <div>
                              <button
                                id="cancel"
                                onClick={() => handleCancelClick(
                                  order.orderId, 
                                  order.items[0]?.itemType, 
                                  order.items[0]?.imagePath, 
                                  order.items[0]?.quantity, 
                                  order.items[0]?.price, 
                                  order.status, 
                                  new Date(order.date).toLocaleString()
                                )}
                                disabled={order.status === 'Delivered' || order.status === 'Delivered*'}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button id='cancel' onClick={() => confirmDelete(order.orderId, order.status)}>
                              Delete
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </>
            ) : (
              renderNoOrders()
            )}
            {cancel && (
              <div className="cancel-box">
                <img src={item.itemimg} alt="" id="itemimg" />
                <p id="creason">Do You Really Want To Cancel The Order...</p>
                <p className="tcancel tc1" id="tc1">Item Type: {item.itemtype}</p>
                <p className="tacancel tc4"> <span id="dt">Date & Time:</span> <p id="dvalue">{item.itemdate}</p></p>
                <p className="tcancel tc2" id="tc2">Quantity: {item.itemquantity}</p>
                <p className="tcancel tc3" id="tc3">Item Price: <PiCurrencyInr id="cinr" />{item.itemprice}</p>
                <button onClick={() => setCancel(false)} id="cback">Back</button>
                <button onClick={() => cancelOrder(orderId, email)} id="ccancel"   disabled={isCancel}>{isCancel?'Cancelling..':'Confirm'}</button>
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