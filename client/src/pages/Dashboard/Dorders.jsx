import React, { useState, useEffect } from "react";
import "./Dorders.css";
import Topbar from "./Dtopbar";
import { RxCross2 } from "react-icons/rx";
import { PiCurrencyInr } from "react-icons/pi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAdmin } from '../../context/AdminContext';
import FruitLoader from "../../components/FruitLoader";
import Dtopbar from "./Dtopbar";
import axios from "axios";

const Dorders = ({ onOrderDetails }) => {
  const {
    users,
    pendingOrders,
    totalPieces,
    totalCost,
    serialNumber,
    loading,
    error,
    getdata,
  } = useAdmin();

  const [verify, setVerify] = useState(false); // For verification modal
  const [otp, setOtp] = useState(""); // For OTP input
  const [email, setEmail] = useState(""); // For user email
  const [phoneFilter, setPhoneFilter] = useState(""); // For filtering by phone number
  const [placeFilter, setPlaceFilter] = useState(""); // For filtering by place (street address)
  const [sortByAddress, setSortByAddress] = useState(false); // For sorting by address
  const [vname, setVname] = useState(""); // For verification name
  const [vno, setVno] = useState(""); // For verification phone number
  const [orderId, setOrderId] = useState(""); // For order ID
  const [selectedDateFilter, setSelectedDateFilter] = useState("all"); // Date filter
  const [selectedOrders, setSelectedOrders] = useState([]); // For storing selected order IDs
  const isMobile = window.innerWidth <= 760; // Check if the device is mobile
  const url = 'https://palmyra-fruit.onrender.com/api/user';
  //const url = "http://localhost:4000/api/user";// Backend API URL

  const toastfun = (msg, type) => {
    toast[type](msg, {
      position: 'top-right',
      autoClose: 3000,
      style: {
        position: 'absolute',
        top: isMobile ? '6vh' : '80px',
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

  // Handle order cancellation
  const handleDelete = (orderId, email) => {
    const toastId = `delete-toast-${orderId}`;

    if (!toast.isActive(toastId)) {
      toastfun(
        <div>
          <p style={{ padding: '1px' }}>Do you really want to cancel this order?</p>
          <button
            onClick={async () => {
              try {
                // Call the /cancel-selected-orders endpoint
                const res = await axios.post(`${url}/cancel-selected-orders`, {
                  orderIds: [orderId], // Pass the order ID as an array
                });

                if (res.status === 200) {
                  toastfun("Order cancelled successfully", 'success');
                  getdata(); // Refresh the order list
                } else {
                  toastfun("Failed to cancel the order.", 'error');
                }
              } catch (error) {
                console.error("Error cancelling order:", error);
                toastfun("Failed to cancel the order. Please try again.", 'error');
              }
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
        'info'
      );
    }
  };

  // Handle cancellation of selected orders
  const handleDeleteSelectedOrders = async () => {
    if (selectedOrders.length === 0) {
      toastfun("No orders selected for cancellation.", 'warn');
      return;
    }

    try {
      // Call the backend endpoint to cancel selected orders
      const res = await axios.post(`${url}/cancel-selected-orders`, {
        orderIds: selectedOrders, // Pass the array of selected order IDs
      });

      if (res.status === 200) {
        toastfun("Selected orders cancelled successfully", 'success');
        getdata(); // Refresh the order list
        setSelectedOrders([]); // Clear selected orders
      } else {
        toastfun("Failed to cancel selected orders.", 'error');
      }
    } catch (error) {
      console.error("Error cancelling selected orders:", error);
      toastfun("Failed to cancel selected orders. Please try again.", 'error');
    }
  };

  // Handle verification modal
  const handleVerify = (orderId, email, name, phoneNumber) => {
    setVno(phoneNumber);
    setVname(name);
    setVerify(true);
    setEmail(email);
    setOrderId(orderId);
    const orderDetails = { orderId, email, name, phone: phoneNumber };
    onOrderDetails(orderDetails);
  };

  // Handle OTP submission
  const handleOtpSubmit = async () => {
    try {
      const response = await axios.post(`${url}/verifyOrder`, {
        email,
        number: vno,
        orderId,
        otp,
      });

      if (response.status === 200) {
        toastfun("Order verified successfully", 'success');
        getdata(); // Refresh order list
        setVerify(false);
        setOtp("");
      }
    } catch (error) {
      console.error("Error verifying order:", error);
      toastfun("Failed to verify order. Please try again.", 'error');
    }
  };

  // Sort orders by address
  const sortedData = sortByAddress
    ? [...pendingOrders].sort((a, b) => {
        const addressA = a.shippingAddress.street.toLowerCase();
        const addressB = b.shippingAddress.street.toLowerCase();
        return addressA < addressB ? -1 : addressA > addressB ? 1 : 0;
      })
    : pendingOrders;

  // Filter orders by phone number and place
  const filteredData = sortedData.filter((order) => {
    const phoneMatch =
      phoneFilter === "" ||
      order.shippingAddress.phoneNumber.toString().includes(phoneFilter);

    const placeMatch =
      placeFilter === "" ||
      order.shippingAddress.street.toLowerCase().includes(placeFilter.toLowerCase());

    return phoneMatch && placeMatch;
  });

  // Handle Select All
  const handleSelectAll = () => {
    if (selectedOrders.length === filteredData.length) {
      // Deselect all
      setSelectedOrders([]);
    } else {
      // Select all
      setSelectedOrders(filteredData.map((order) => order.orderId));
    }
  };

  // Handle individual order selection
  const handleOrderSelection = (orderId) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    getdata();
  }, []);

  return (
    <>
      <Dtopbar />
      <ToastContainer />

      {loading ? (
        <FruitLoader />
      ) : (
        <div className="order2">
          <h1 className="dall">Pending Orders</h1>

          {/* Filters and totals */}
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

          <div className="dtotal">
            <p>Total Orders: {serialNumber}</p>
            <p className="mtquantity">Total Quantity: {totalPieces} Pieces</p>
            <p className="mtcost">
              Total Cost: <PiCurrencyInr />
              {totalCost}
            </p>
            <span>
              <button
                onClick={handleSelectAll}
                className="select-all-btn"
              >
                {selectedOrders.length === filteredData.length ? "Deselect All" : "Select All"}
              </button>
              <button
                onClick={handleDeleteSelectedOrders}
                disabled={selectedOrders.length === 0}
                className="delete-selected-btn"
              >
                Cancel Selected Orders
              </button>
            </span>
          </div>

          {/* Orders table */}
          <div className="ditems">
            {verify ? (
              <div className="dverify">
                <RxCross2 className="vicon" onClick={() => setVerify(false)} />
                <h1>Verification</h1>
                <p>Name: {vname}</p>
                <p className="vphone">Phone No: {vno}</p>
                <label htmlFor="dnumber">Enter Code:</label>
                <input
                  type="number"
                  className="dnumber"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
                <button className="vsubmit" onClick={handleOtpSubmit}>
                  Submit
                </button>
              </div>
            ) : filteredData.length > 0 ? (
              <table border="1px" className="dtable ddtable">
                <thead>
                  <tr>
                    <th>Select</th>
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
                    <th>Action</th>
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
                        <td>
                          <button
                            onClick={() =>
                              handleVerify(order.orderId, user.email, user.name, order.shippingAddress.phoneNumber)
                            }
                            className="do-button"
                            style={{ cursor: "pointer" }}
                          >
                            Verify
                          </button>
                        </td>
                        <td>{user ? user.name : "N/A"}</td>
                        <td>{user ? user.email : "N/A"}</td>
                        <td>{order.shippingAddress.phoneNumber}</td>
                        <td>{order.shippingAddress.street}</td>
                        <td>{order.items[0].itemType}</td>
                        <td>
                          {order.items[0].itemType === "single"
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
                            onClick={() => handleDelete(order.orderId, user.email)}
                            className="del"
                          >
                            Cancel
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
      )}
    </>
  );
};

export default Dorders;