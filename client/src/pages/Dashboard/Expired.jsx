import React, { useEffect, useState, useContext } from 'react';
import './Dorders.css';
import Topbar from './Dtopbar';
import { PiCurrencyInr } from 'react-icons/pi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAdmin } from '../../context/AdminContext'; // Import the AdminContext
import axios from 'axios';

const Expired = () => {
  const { orders, users, loading, error, deleteOrder,confirmDeleteOrder } = useAdmin(); // Use the AdminContext
  const [dquantity, setdquantity] = useState(0); // Total quantity
  const [dprice, setdprice] = useState(0); // Total price
  const [phoneFilter, setPhoneFilter] = useState(''); // For filtering by phone number
  const [placeFilter, setPlaceFilter] = useState(''); // For filtering by place (street address)
  const [sno, setsno] = useState(0); // Serial number counter
  const [refundLoading, setRefundLoading] = useState({}); // For refund loading states
  const isMobile = window.innerWidth <= 760; // Check if the device is mobile
  const url = 'https://palmyra-fruit.onrender.com/api/user';
  // const url = "http://localhost:4000/api/user";// Backend URL

  // Filter expired orders
  const expiredOrders = orders.filter((order) => order.status === 'Cancelled');

  // Calculate totals for expired orders
  useEffect(() => {
    let totalPieces = 0;
    let totalCost = 0;
    let serialNumber = 0;

    expiredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const pieces = item.itemType === 'single' ? item.quantity : item.quantity * 12;
        totalPieces += pieces;
        totalCost += item.price;
      });
      serialNumber += 1;
    });

    setdquantity(totalPieces);
    setdprice(totalCost);
    setsno(serialNumber);
  }, [orders]);

  // Toast notification function
  const toastfun = (msg, type) => {
    toast[type](msg, {
      position: 'top-right',
      autoClose: 3000,
      style: {
        position: 'absolute',
        top: isMobile ? '6vh' : '60px',
        right: '0em',
        width: isMobile ? '60vw' : '35vw',
        height: isMobile ? '8vh' : '10vh',
        fontSize: '1.2rem',
        padding: '10px',
      },
      onClick: () => {
        toast.dismiss();
      },
    });
  };

  // Handle refund for an order
  const handleRefund = async (paymentId, amount, orderId) => {
    const toastId = `refund-toast-${paymentId}`;

    if (!toast.isActive(toastId)) {
      toast.info(
        <div>
          <p style={{ padding: '1px' }}>Do you really want to issue a refund for this order?</p>
          <button
            onClick={async () => {
              await confirmRefund(paymentId, amount, orderId);
              toast.dismiss(toastId);
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
          onClick: () => toast.dismiss(toastId),
          toastId,
          style: { top: '6em', width: isMobile ? '70%' : '100%' },
        }
      );
    }
  };

  // Confirm and process the refund
  const confirmRefund = async (paymentId, amount, orderId) => {
    try {
      setRefundLoading((prev) => ({ ...prev, [orderId]: true })); // Set loading state
      const refundResponse = await axios.post(`${url}/refund`, {
        paymentId,
        amount,
      });

      if (refundResponse.data.success) {
        toastfun('Refund initiated successfully', 'success');
      } else {
        toastfun('Refund initiation failed', 'error');
      }
    } catch (error) {
      console.error('Error initiating refund:', error);
      toastfun('Refund initiation failed. Please try again.', 'error');
    } finally {
      setRefundLoading((prev) => ({ ...prev, [orderId]: false })); // Reset loading state
    }
  };

  // Handle delete order with refund
  const handleDelete = async (orderId, paymentId, amount) => {
    const toastId = `delete-toast-${orderId}`;
    const cancellationReason = 'normally';

    if (!toast.isActive(toastId)) {
      toast.info(
        <div>
          <p style={{ padding: '1px' }}>Do you really want to delete this order and issue a refund?</p>
          <button
            onClick={async () => {
              await confirmDeleteOrder(orderId);
              toast.dismiss(toastId);
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
          onClick: () => toast.dismiss(toastId),
          toastId,
          style: { top: '6em', width: isMobile ? '70%' : '100%' },
        }
      );
    }
  };

  // Confirm delete and issue refund
  const confirmDelete = async (orderId, cancellationReason, paymentId, amount) => {
    try {
      // Step 1: Issue refund
      await handleRefund(paymentId, amount, orderId);

      // Step 2: Delete the order using the context function

      toastfun('Order deleted and refund initiated successfully', 'success');
    } catch (error) {
      console.error('Error deleting order:', error);
      toastfun('Failed to delete the order or issue refund. Please try again.', 'error');
    }
  };

  // Delete all refunded orders
  const deleteRefundedOrders = async () => {
    try {
      const response = await axios.delete(`${url}/delete-refunded-orders`);
      toastfun('Refunded orders deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting refunded orders:', error);
      toastfun('Failed to delete refunded orders. Please try again.', 'error');
    }
  };

  return (
    <div>
      <Topbar />
      <ToastContainer />
      <div className="order2">
        <h1 className="dall">Expired Orders</h1>
        <div className="dnumber fdnumber">
          <label htmlFor="dnumber2">Enter Phone Number:</label>
          <input
            type="number"
            className="dnumber2"
            value={phoneFilter}
            onChange={(e) => setPhoneFilter(e.target.value)}
            placeholder="Enter Phone Number"
          />
        </div>
        <div className="dnumber fdnumber">
          <label htmlFor="dplace">Enter Place:</label>
          <input
            type="text"
            className="dplace"
            value={placeFilter}
            onChange={(e) => setPlaceFilter(e.target.value)}
            placeholder="Enter Street Address"
          />
        </div>

        <div className="dtotal dtotal">
          <p>Total Orders: {sno}</p>
          <p>Total Quantity: {dquantity} Pieces</p>
          <p className="mtcost">
            Total Cost: <PiCurrencyInr />
            {dprice}
          </p>
          <button onClick={deleteRefundedOrders} className="delete-refunds-btn">
            Delete Refunds
          </button>
        </div>

        <div className="dtable2 dtable3 detable1">
          {expiredOrders.length > 0 ? (
            <table border="1px" className="dtable detable">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Customer Name</th>
                  <th>Email</th>
                  <th>Phone No</th>
                  <th>Address</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Cost</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Delete</th>
                  <th>Refund</th>
                </tr>
              </thead>
              <tbody>
                {expiredOrders
                  .filter((order) => {
                    // Filter by phone number
                    const phoneMatch =
                      phoneFilter === '' ||
                      order.shippingAddress.phoneNumber.toString().includes(phoneFilter);

                    // Filter by place (street address)
                    const placeMatch =
                      placeFilter === '' ||
                      order.shippingAddress.street.toLowerCase().includes(placeFilter.toLowerCase());

                    // Only include orders that match both filters
                    return phoneMatch && placeMatch;
                  })
                  .map((order, index) => {
                    // Find the user associated with the order
                    const user = users.find((user) => user._id === order.user);
                    return (
                      <tr key={order._id}>
                        <td>{index + 1}</td>
                        <td>{user ? user.name : 'N/A'}</td>
                        <td>{user ? user.email : 'N/A'}</td>
                        <td>{order.shippingAddress.phoneNumber}</td>
                        <td>{order.shippingAddress.street}</td>
                        <td>{order.items[0].itemType}</td>
                        <td>
                          {order.items[0].itemType === 'single'
                            ? order.items[0].quantity
                            : order.items[0].quantity * 12}
                        </td>
                        <td>
                          <PiCurrencyInr />
                          {order.items[0].price}
                        </td>
                        <td>{order.status}</td>
                        <td>{new Date(order.date).toLocaleDateString()}</td>
                        <td>{new Date(order.date).toLocaleTimeString()}</td>
                        <td>
                          <button
                            onClick={() => handleDelete(order.orderId, order.paymentId, order.items[0].price)}
                            style={{ cursor: 'pointer' }}
                            className="del"
                            
                          >
                            Delete
                          </button>
                        </td>
                        <td>
                          <button
                            onClick={() => handleRefund(order.paymentId, order.items[0].price, order._id)}
                            disabled={refundLoading[order._id]}
                            className={`refund-btn ${refundLoading[order._id] ? 'loading' : ''}`}
                          >
                            {refundLoading[order._id] ? 'Loading...' : 'Refund'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          ) : (
            <p className="domsg">No orders available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Expired;