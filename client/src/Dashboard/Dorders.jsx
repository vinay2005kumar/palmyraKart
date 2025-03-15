import React, { useEffect, useState } from 'react';
import './Dorders.css';
import Topbar from './Dtopbar';
import axios from 'axios';
import { RxCross2 } from 'react-icons/rx';
import { PiCurrencyInr } from 'react-icons/pi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Dorders = ({ onOrderDetails }) => {
  const [ddata, setddata] = useState([]); // For users
  const [orders, setOrders] = useState([]); // For orders
  const [verify, setverify] = useState(false); // For verification modal
  const [otp, setotp] = useState(''); // For OTP input
  const [demail, setdemail] = useState(''); // For user email
  const [dquantity, setdquantity] = useState(0); // Total quantity
  const [dprice, setdprice] = useState(0); // Total price
  const [phoneFilter, setPhoneFilter] = useState(''); // For filtering by phone number
  const [placeFilter, setPlaceFilter] = useState(''); // For filtering by place (street address)
  const [sno, setsno] = useState(0); // Serial number counter
  const [vname, setvname] = useState(''); // For verification name
  const [vno, setvno] = useState(''); // For verification phone number
  const [orderid, setorderid] = useState(''); // For order ID
  const [sortByAddress, setSortByAddress] = useState(false); // For sorting by address
  const url = 'http://localhost:4000/api/user'; // Backend URL
  const isMobile = window.innerWidth <= 760; // Check if the device is mobile

  // Fetch data from the backend
  const getdata = async () => {
    try {
      console.log('Fetching data...');
      const { data } = await axios.get(`${url}/getAllUsers`, {
        withCredentials: true, // Include credentials (cookies) if needed
      });

      console.log('Data received:', data);

      // Ensure the response contains the expected fields
      if (!data.users || !data.orders || !data.reviews) {
        throw new Error('Invalid response structure from the server.');
      }

      const pendingOrders = data.orders.filter((order) => order.status === 'Pending');

    // Set data in state
    setddata(data.users); // Set users
    setOrders(pendingOrders); 

      // Calculate totals
      let totalPieces = 0;
      let totalCost = 0;
      let serialNumber = 0;

      data.orders.forEach((order) => {
        if (order.status === 'Pending') {
          order.items.forEach((item) => {
            const pieces = item.itemType === 'single' ? item.quantity : item.quantity * 12;
            totalPieces += pieces;
            totalCost += item.price;
          });
          serialNumber += 1;
        }
      });

      setdquantity(totalPieces);
      setdprice(totalCost);
      setsno(serialNumber);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders. Please try again later.');
    }
  };

  // Toast notification function
  const toastfun = (msg, type) => {
    toast[type](msg, {
      position: 'top-right',
      autoClose: 3000,
      style: {
        position: 'absolute',
        top: isMobile ? '6vh' : '70px',
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

  // Handle order deletion
  const handleDelete = (orderId, email) => {
    const toastId = `delete-toast-${orderId}`;
    const cancellationReason = 'Order deleted by admin';

    if (!toast.isActive(toastId)) {
      toast.info(
        <div>
          <p style={{ padding: '1px' }}>Do you really want to delete this order?</p>
          <button
            onClick={async () => {
              await confirmDelete(orderId, email, cancellationReason);
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

  // Function to actually delete the order
  const confirmDelete = async (orderId, email, cancellationReason) => {
    try {
      const deleteurl = `${url}/order/${orderId}`;
      await axios.delete(deleteurl, {
        headers: { 'Content-Type': 'application/json' },
        data: { email, cancellationReason },
      });

      toastfun('Order deleted successfully', 'success');
      getdata(); // Refresh order list
    } catch (error) {
      console.error('Error deleting order:', error);
      toastfun('Failed to delete the order. Please try again.', 'error');
    }
  };

  // Handle verification modal
  const handleverify = (order_id, email, name, no) => {
    setvno(no);
    setvname(name);
    setverify(!verify);
    setdemail(email);
    setorderid(order_id);
    const orderDetails = { orderId: order_id, email, name, phone: no };
    onOrderDetails(orderDetails);
  };

  // Handle OTP submission
  const otpsubmit = async () => {
    const number = document.getElementById('dnumber').value;
    try {
      const response = await axios.post(`${url}/verifyOrder`, { email: demail, number, orderId: orderid });
      if (response.status === 200) {
        toastfun('Confirmed OTP', 'success');
        getdata();
        setverify(!verify);
      }
    } catch (error) {
      if (error.response?.status === 400) {
        toastfun('Incorrect OTP', 'error');
      } else {
        toastfun('Error verifying OTP', 'error');
      }
    }
  };

  // Show/hide filters and totals
  const showdata = () => {
    document.getElementById('fdnumber').style.display = verify ? 'none' : 'block';
    document.getElementById('dtotal').style.display = verify ? 'none' : 'flex';
    document.getElementById('fdplace').style.display = verify ? 'none' : 'block';
  };

  // Sort orders by address
  const sortOrdersByAddress = () => {
    setSortByAddress(!sortByAddress);
  };
  // Fetch data on component mount
  useEffect(() => {
    getdata();
    showdata();
  },[]);
  // Fetch data on component mount
  useEffect(() => {
    getdata();
    showdata();
  },[verify]); // Only `verify` should be in the dependency array

  // Sort orders by address if enabled
  const sortedData = sortByAddress
    ? [...orders].sort((a, b) => {
        const addressA = a.shippingAddress.street.toLowerCase();
        const addressB = b.shippingAddress.street.toLowerCase();
        return addressA < addressB ? -1 : addressA > addressB ? 1 : 0;
      })
    : orders;

  return (
    <>
      <Topbar />
      <ToastContainer />
      <div className="order2">
        <h1 id="dall">Pending Orders</h1>

        <div className="dnumber" id="fdnumber">
          <label htmlFor="dnumber2">Enter Number:</label>
          <input
            type="number"
            id="dnumber2"
            value={phoneFilter}
            onChange={(e) => setPhoneFilter(e.target.value)}
            placeholder="Enter Phone Number"
          />
        </div>

        <div className="dnumber" id="fdplace">
          <input
            type="text"
            id="place"
            value={placeFilter}
            onChange={(e) => setPlaceFilter(e.target.value)}
            placeholder="Enter Place (Street Address)"
          />
        </div>

        <div className="dtotal" id="dtotal">
          <p>Total Orders: {sno}</p>
          <p id="mtquantity">Total Quantity: {dquantity} Pieces</p>
          <p id="mtcost">
            Total Cost: <PiCurrencyInr />
            {dprice}
          </p>
        </div>

        <div className="ditems">
          {verify ? (
            <div className="dverify">
              <RxCross2 id="vicon" onClick={() => setverify(false)} />
              <h1>Verification</h1>
              <p>Name: {vname}</p>
              <p id="vphone">Phone No: {vno}</p>
              <label htmlFor="dnumber">Enter Code:</label>
              <input type="number" id="dnumber" required />
              <button className="vsubmit" onClick={otpsubmit}>
                Submit
              </button>
            </div>
          ) : orders.length > 0 ? (
            <table border="1px" className="dtable ddtable">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Verification</th>
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
                </tr>
              </thead>
              <tbody>
                {sortedData
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
                    const user = ddata.find((user) => user._id === order.user);
                    return (
                      <tr key={order._id}>
                        <td>{index + 1}</td>
                        <td>
                          <button
                            onClick={() => handleverify(order.orderId, user.email, user.name,order.shippingAddress.phoneNumber)}
                            className="do-button"
                            style={{ cursor: 'pointer' }}
                          >
                            Verify
                          </button>
                        </td>
                        <td>{user ? user.name : 'N/A'}</td>
                        <td>{user ? user.email : 'N/A'}</td>
                        <td>{order.shippingAddress.phoneNumber}</td>
                        <td>{order.shippingAddress.street}</td>
                        <td>{order.items[0].itemType}</td>
                        <td>{order.items[0].itemType === 'single' ? order.items[0].quantity : order.items[0].quantity * 12}</td>
                        <td>
                          <PiCurrencyInr />
                          {order.items[0].price}
                        </td>
                        <td>{order.status}</td>
                        <td>{new Date(order.date).toLocaleDateString()}</td>
                        <td>{new Date(order.date).toLocaleTimeString()}</td>
                        <td>
                          <button onClick={() => handleDelete(order.orderId, user.email)} className="del">
                            Delete
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
    </>
  );
};

export default Dorders