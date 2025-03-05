import React, { useEffect, useState } from 'react';
import './Dorders.css';
import Topbar from './Dtopbar';
import axios from 'axios';
import { RxCross2 } from "react-icons/rx";
import { PiCurrencyInr } from "react-icons/pi";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Dorder = ({ onOrderDetails }) => {
  const [ddata, setddata] = useState([]);
  const [verify, setverify] = useState(false);
  const [otp, setotp] = useState('');
  const [demail, setdemail] = useState('');
  const [dquantity, setdquantity] = useState(0);
  const [dprice, setdprice] = useState(0);
  const [phoneFilter, setPhoneFilter] = useState('');
  const [placeFilter, setPlaceFilter] = useState('');
  const [sno, setsno] = useState(0);
  const [vname, setvname] = useState();
  const [vno, setvno] = useState();
  const[orderid,setorderid]=useState()
  const [sortByAddress, setSortByAddress] = useState(false);  // New state for sorting
  const url = 'https://palmyra-fruit.onrender.com/api/user';
  //const url = 'http://localhost:4000/api/user';
  const isMobile = window.innerWidth <= 760;
  
  const getdata = async () => {
    console.log("getdata() function is called ✅"); // Debugging log
    try {
      console.log("Fetching data..."); // Debugging log before API call
  
      const { data } = await axios.get(`${url}/getAllUsers`);
      console.log("Data received:", data); // Log the response data
  
      setddata(data.user);
      
      let totalPieces = 0;
      let totalCost = 0;
      let serialNumber = 0;
  
      data.user.forEach((user) => {
        user.orders.forEach((order) => {
          if (order.status === 'pending') {
            console.log("Processing order:", order); // Log each order being processed
  
            const pieces = order.item === 'single' ? order.quantity : order.quantity * 12;
            totalPieces += pieces;
            totalCost += order.price;
            serialNumber += 1;
          }
        });
      });
  
      console.log(`Total Pieces: ${totalPieces}, Total Cost: ${totalCost}, Total Orders: ${serialNumber}`); // Debug final values
  
      setdquantity(totalPieces);
      setdprice(totalCost);
      setsno(serialNumber);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };
  
  const handleDelete = (orderId, email) => {
    const toastId = `delete-toast-${orderId}`;
    const cancellationReason = 'normally';
  
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
      console.log('Deleting order:', deleteurl, orderId);
      
      const response = await axios.delete(deleteurl, {
        headers: { 'Content-Type': 'application/json' },
        data: { email, cancellationReason }, // ✅ Ensure request body is sent properly
      });
  
      toastfun('Order deleted successfully', 'success');
      getdata(); // Refresh order list
    } catch (error) {
      console.error('Error deleting order:', error);
      toastfun('Failed to delete the order. Please try again.', 'error');
    }
  };
  

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

  const handleverify = (order_id, email, name, no) => {
    setvno(no);
    setvname(name);
    setverify(!verify);
    setdemail(email);
    setorderid(order_id)
    const orderDetails = { orderId: orderid, email, name, phone: no };
    onOrderDetails(orderDetails);
  };

  const otpsubmit = async () => {
    const number = document.getElementById('dnumber').value;
    try {
      const response = await axios.post(`${url}/verifyOrder`, { email: demail, number,orderId:orderid });
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

  const showdata = () => {
    document.getElementById('fdnumber').style.display = verify ? 'none' : 'block';
    document.getElementById('dtotal').style.display = verify ? 'none' : 'flex';
    document.getElementById('fdplace').style.display = verify ? 'none' : 'block';
  };

  const sortOrdersByAddress = () => {
    setSortByAddress(!sortByAddress);
  };

  useEffect(() => {
    getdata();
    showdata();
  }, [verify]);

  const sortedData = sortByAddress
    ? ddata
        .map((user) => ({
          ...user,
          orders: user.orders.sort((a, b) => {
            const addressA = a.address.toLowerCase();
            const addressB = b.address.toLowerCase();
            return addressA < addressB ? -1 : addressA > addressB ? 1 : 0;
          }),
        }))
    : ddata;

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
          />
        </div>

        <div className="dnumber" id="fdplace">
          <input
            type="text"
            id="place"
            value={placeFilter}
            onChange={(e) => setPlaceFilter(e.target.value)}
            placeholder='Enter Place'
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
          ) : sortedData.length > 0 ? (
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
                {(() => {
                  let continuousOrderIndex = 0;

                  return sortedData
                    .filter((user) =>
                      (phoneFilter === '' || user.orders.some(
                        (order, index) => order.status === 'pending' && user.phone[index]?.includes(phoneFilter)
                      )) &&
                      (placeFilter === '' || user.orders.some(
                        (order, index) => order.status === 'pending' && user.address[index]?.toLowerCase().includes(placeFilter.toLowerCase())
                      ))
                    )
                    .flatMap((user, userIndex) =>
                      user.orders
                        .filter((order) => order.status === 'pending')
                        .map((order) => {
                          continuousOrderIndex++;
                          return (
                            <tr key={`${userIndex}-${continuousOrderIndex}`}>
                              <td>{continuousOrderIndex}</td>
                              <td>
                                <button
                                  onClick={() =>
                                    handleverify(order.orderId, user.email, user.name, user.phone[user.orders.indexOf(order)])
                                  }
                                  className="do-button"
                                  style={{ cursor: 'pointer' }}
                                >
                                  Verify
                                </button>
                              </td>
                              <td>{user.name}</td>
                              <td>{user.email}</td>
                              <td>{user.phone[user.orders.indexOf(order)]}</td>
                              <td>{user.address[user.orders.indexOf(order)]}</td>
                              <td>{order.item}</td>
                              <td>{order.item === 'single' ? order.quantity : order.quantity * 12}</td>
                              <td>
                                <PiCurrencyInr />
                                {order.price}
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
                        })
                    );
                })()}
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

export default Dorder;
