import React, { useEffect, useState } from 'react';
import './Dorders.css';
import { PiCurrencyInr } from 'react-icons/pi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAdmin } from '../../context/AdminContext'; // Import the AdminContext
import Dtopbar from './Dtopbar';
import FruitLoader from '../../components/FruitLoader';
import axios from 'axios';

const Expired = () => {
  const {
    users,
    orders,
    loading,
    deleteOrder,
    confirmDeleteOrder,
    DeleteSelectedOrders,
    getdata
  } = useAdmin(); // Use the AdminContext

  const [phoneFilter, setPhoneFilter] = useState(''); // For filtering by phone number
  const [placeFilter, setPlaceFilter] = useState(''); // For filtering by place (street address)
  const [sortByAddress, setSortByAddress] = useState(false); // For sorting by address
  const [selectedDateFilter, setSelectedDateFilter] = useState('all'); // Date filter
  const [selectedOrders, setSelectedOrders] = useState([]); // Selected orders for deletion
  const [dquantity, setdquantity] = useState(0); // Total quantity
  const [dprice, setdprice] = useState(0); // Total price
  const [sno, setsno] = useState(0); // Serial number counter
  const [refundLoading, setRefundLoading] = useState({}); // For refund loading states
  const isMobile = window.innerWidth <= 760; // Check if the device is mobile
  const url = 'https://palmyra-fruit.onrender.com/api/user';
  //const url = "http://localhost:4000/api/user";
  const [reload,setReload]=useState(false)
  const [refundall,setRefundAll]=useState(false)
  // Filter orders with status 'Cancelled' or 'Refunded'
  const expiredOrders = orders.filter(
    (order) => order.status === 'Cancelled' || order.status === 'Refunded'
  );

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

  // Handle date filter change
  const handleDateFilterChange = (filter) => {
    setSelectedDateFilter(filter);
  };

  // Handle order selection for deletion
  const handleOrderSelection = (orderId) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  // Handle "Select All" button click
  const handleSelectAll = () => {
    if (selectedOrders.length === filteredData.length) {
      // If all orders are already selected, deselect all
      setSelectedOrders([]);
    } else {
      // Select all filtered orders
      setSelectedOrders(filteredData.map((order) => order.orderId));
    }
  };

  // Handle delete selected orders
  const handleDeleteSelectedOrders = async () => {
    DeleteSelectedOrders(selectedOrders);
  };

  // Sort orders by address
  const sortOrdersByAddress = () => {
    setSortByAddress(!sortByAddress);
  };

  // Filter and sort orders
  const filteredData = expiredOrders
    .filter((order) => {
      const today = new Date();
      const orderDate = new Date(order.date);

      // Apply date filter
      let dateMatch = true;
      switch (selectedDateFilter) {
        case 'today':
          dateMatch = orderDate.toDateString() === today.toDateString();
          break;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          dateMatch = orderDate.toDateString() === yesterday.toDateString();
          break;
        case 'last3days':
          const threeDaysAgo = new Date(today);
          threeDaysAgo.setDate(today.getDate() - 3);
          dateMatch = orderDate >= threeDaysAgo;
          break;
        case 'last7days':
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
          dateMatch = orderDate >= sevenDaysAgo;
          break;
        case 'Refunded':
          dateMatch = order.status === 'Refunded';
          break;
        case 'Cancelled':
          dateMatch=order.status==='Cancelled';
          break;
        default:
          dateMatch = true; // Show all orders
      }

      // Filter by phone number
      const phoneMatch =
        phoneFilter === '' ||
        order.shippingAddress.phoneNumber.toString().includes(phoneFilter);

      // Filter by place (street address)
      const placeMatch =
        placeFilter === '' ||
        order.shippingAddress.street.toLowerCase().includes(placeFilter.toLowerCase());

      return dateMatch && phoneMatch && placeMatch;
    })
    .sort((a, b) => {
      if (sortByAddress) {
        const addressA = a.shippingAddress.street.toLowerCase();
        const addressB = b.shippingAddress.street.toLowerCase();
        return addressA < addressB ? -1 : addressA > addressB ? 1 : 0;
      }
      return 0;
    });

  // Handle refund for an order
  const handleRefund = async (paymentId, amount, orderId, email, name) => {
    const toastId = `refund-toast-${paymentId}`;

    if (!toast.isActive(toastId)) {
      toast.info(
        <div>
          <p style={{ padding: '1px' }}>Do you really want to issue a refund for this order?</p>
          <button
            onClick={async () => {
              await confirmRefund(paymentId, amount, orderId, email, name);
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
  const confirmRefund = async (paymentId, amount, orderId, email, name) => {
    try {
      setRefundLoading((prev) => ({ ...prev, [orderId]: true }));

      const refundResponse = await axios.post(`${url}/refund`, {
        paymentId,
        amount,
        orderId,
        email,
        name,
      });

      if (refundResponse.data.success) {
        toastfun('Refund initiated successfully', 'success');
        setReload(true)
        await getdata(); 
      } else {
        toastfun(refundResponse.data.error || 'Refund initiation failed', 'error');
      }
    } catch (error) {
      console.log('Error initiating refund:', error);

      // Extract error message from response
      const errorMessage = error.response?.data?.error || 'Refund initiation failed. Please try again.';
      toastfun(errorMessage, 'error');

      // If the error is that the payment is already refunded, update the order status
      if (errorMessage.includes('already been refunded')) {
   
      }
    } finally {
      setRefundLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  // Handle delete order with refund
  const handleDelete = async (orderId) => {
    confirmDeleteOrder(orderId);
  };

  // Handle delete all refunded orders
  const handleDeleteAll = async () => {
    const refundOrders = orders.filter((order) => order.status === 'Refunded');
    DeleteSelectedOrders(refundOrders);
  };

  const handleRefundAll = async () => {
    const toastId = 'refund-all-toast'; // Unique ID for the toast
  
    // Filter the expired orders to include only those that are cancelled
    const cancelledOrders = expiredOrders.filter(order => order.status === 'Cancelled');
  
    if (cancelledOrders.length === 0) {
      toastfun('No cancelled orders found to refund.', 'error');
      return; // If no cancelled orders are found, exit the function
    }
  
    // Show a confirmation toast with "Yes" and "No" buttons
    if (!toast.isActive(toastId)) {
      toast.info(
        <div>
          <p style={{ padding: '1px' }}>Do you really want to refund all selected cancelled orders?</p>
          <button
            onClick={async () => {
              // User clicked "Yes," proceed with the refund
              try {
                setRefundAll(true);
                const refundAllResponse = await axios.post(`${url}/refund-all`, {
                  orders: cancelledOrders.map((order) => ({
                    paymentId: order.paymentId,
                    amount: order.items[0].price,
                    orderId: order.orderId,
                    email: users.find((user) => user._id === order.user)?.email,
                    name: users.find((user) => user._id === order.user)?.name,
                  })),
                });
  
                if (refundAllResponse.data.success) {
                  // Loop through the results array and show a toast for each order
                  refundAllResponse.data.results.forEach((result) => {
                    if (result.success) {
                      toastfun(`Order ${result.orderId} refunded successfully`, 'success');
                    } else {
                      toastfun(`Order ${result.orderId} failed: ${result.error}`, 'error');
                    }
                  });
  
                  // Refresh the orders data
                  await getdata();
                  setRefundAll(false);
                } else if (refundAllResponse.status === 400) {
                  setRefundAll(false);
                  toastfun('The payment has already been fully refunded', 'error');
                }
              } catch (error) {
                console.log('Error initiating refunds for all orders:', error);
                toastfun('Failed to initiate refunds for all orders. Please try again.', 'error');
                setRefundAll(false);
              }
  
              // Dismiss the confirmation toast
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
            onClick={() => toast.dismiss(toastId)} // User clicked "No," dismiss the toast
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
          closeOnClick: false, // Prevent dismissing the toast on click
          draggable: false,
          autoClose: false, // Keep the toast open until the user clicks "Yes" or "No"
          toastId, // Unique ID for the toast
          style: { top: '6em', width: isMobile ? '70%' : '100%' },
        }
      );
    }
  };
  

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

  return (
    <>
      <Dtopbar />
      <ToastContainer />
      {loading ? (
        <FruitLoader />
      ) : (
        <div className="order2">
          <h1 className="dall">Expired Orders</h1>

          {/* Date filter dropdown */}
          <div className="dnumber fdnumber">
            <label htmlFor="dateFilter">Filter by Date: </label>
            <select
              id="dateFilter"
              className="place"
              value={selectedDateFilter}
              onChange={(e) => handleDateFilterChange(e.target.value)}
            >
              <option value="all">All Orders</option>
              <option value="Refunded">Refunded</option>
              <option value="Cancelled">Cancelled</option>

              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last3days">Last 3 Days</option>
              <option value="last7days">Last 7 Days</option>
            </select>
          </div>

          {/* Filters for phone number and place */}
          <div className="dnumber fdnumber">
            <label htmlFor="dnumber2">Enter Number:</label>
            <input
              type="number"
              className="dnumber2"
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              placeholder="Enter Phone Number"
            />
          </div>
          <div className="dnumber fdplace">
            <label htmlFor="dplace">Enter Place:</label>
            <input
              type="text"
              className="place"
              value={placeFilter}
              onChange={(e) => setPlaceFilter(e.target.value)}
              placeholder="Enter Place (Street Address)"
            />
          </div>

          {/* Totals and Action Buttons */}
          <div className="dtotal">
            <p>Total Orders: {sno}</p>
            <p className="mtquantity">Total Quantity: {dquantity} Pieces</p>
            <p className="mtcost">
              Total Cost: <PiCurrencyInr />
              {dprice}
            </p>
            <span>
              <button onClick={handleSelectAll} className="select-all-btn">
                {selectedOrders.length === filteredData.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={handleDeleteSelectedOrders}
                disabled={selectedOrders.length === 0}
                className="delete-selected-btn"
              >
                Delete Selected Orders
              </button>
              <button onClick={handleRefundAll} className="refund-all-btn">
               {refundall?'Refunding...':'Refund All'}
              </button>
            </span>
          </div>

          {/* Orders table */}
          <div className="ditems">
            {filteredData.length > 0 ? (
              <table border="1px" className="dtable ddtable">
                <thead>
                  <tr>
                    <th>Select</th>
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
                    <th>Action</th>
                    <th>Refund</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((order, index) => {
                    const user = users.find((user) => user._id === order.user);
                    return (
                      <tr key={order.orderId}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order.orderId)}
                            onChange={() => handleOrderSelection(order.orderId)}
                          />
                        </td>
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
                            onClick={() => handleDelete(order.orderId)}
                            className="del"
                          >
                            Delete
                          </button>
                        </td>
                        <td>
                          <button
                            onClick={() =>
                              handleRefund(
                                order.paymentId,
                                order.items[0].price,
                                order.orderId,
                                user?.email,
                                user?.name
                              )
                            }
                            disabled={refundLoading[order.orderId] || order.status === 'Refunded'}
                            className={`${order.status === 'Refunded' ? 'refunded' : 'refund'}`}

                          >
                            {refundLoading[order.orderId] ? 'Processing refund...' :
                              order.status === 'Refunded' ? 'Refunded' :
                                'Refund'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="domsg">No expired orders available</p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Expired;