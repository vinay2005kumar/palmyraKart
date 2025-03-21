import React, { useEffect, useState } from "react";
import "./Dorders.css";
import Topbar from "./Dtopbar";
import { PiCurrencyInr } from "react-icons/pi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAdmin } from '../../context/AdminContext';  // Import the AdminContext
import Dtopbar from "./Dtopbar";
import FruitLoader from "../../components/FruitLoader"; // Ensure this is imported

const Ddelivered = () => {
  const {
    users,
    orders,
    loading,
    deleteOrder,
    confirmDeleteOrder,
    DeleteSelectedOrders
  } = useAdmin(); // Use the AdminContext

  const [phoneFilter, setPhoneFilter] = useState(""); // For filtering by phone number
  const [placeFilter, setPlaceFilter] = useState(""); // For filtering by place (street address)
  const [sortByAddress, setSortByAddress] = useState(false); // For sorting by address
  const [selectedDateFilter, setSelectedDateFilter] = useState("all"); // Date filter
  const [selectedOrders, setSelectedOrders] = useState([]); // Selected orders for deletion
  const isMobile = window.innerWidth <= 760; // Check if the device is mobile
  const [deliquantity, setDeleQuantity] = useState(0);
  const [deliPrice, setDelePrice] = useState(0);
  const [deliSno, setDeleSno] = useState(0);

  // Filter delivered orders
  const deliveredOrders = orders.filter((order) => order.status === "Delivered");

  // Calculate totals for delivered orders
  useEffect(() => {
    let totalPieces = 0;
    let totalCost = 0;
    let serialNumber = 0;

    deliveredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const pieces = item.itemType === 'single' ? item.quantity : item.quantity * 12;
        totalPieces += pieces;
        totalCost += item.price;
      });
      serialNumber += 1;
    });

    setDeleQuantity(totalPieces);
    setDelePrice(totalCost);
    setDeleSno(serialNumber);
  }, [orders]);

  // Handle date filter change
  const handleDateFilterChange = (filter) => {
    setSelectedDateFilter(filter);

    const today = new Date();
    const filtered = deliveredOrders.filter((order) => {
      const orderDate = new Date(order.date);
      switch (filter) {
        case 'today':
          return orderDate.toDateString() === today.toDateString();
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          return orderDate.toDateString() === yesterday.toDateString();
        case 'last3days':
          const threeDaysAgo = new Date(today);
          threeDaysAgo.setDate(today.getDate() - 3);
          return orderDate >= threeDaysAgo;
        case 'last7days':
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
          return orderDate >= sevenDaysAgo;
        default:
          return true; // Show all orders
      }
    });

    setSelectedOrders([]); // Clear selected orders when filter changes
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
  const handleDelete=async(orderId)=>{
    confirmDeleteOrder(orderId)
  }
  // Handle delete selected orders
  const handleDeleteSelectedOrders = async () => {
     DeleteSelectedOrders(selectedOrders)
  };

  // Sort orders by address
  const sortOrdersByAddress = () => {
    setSortByAddress(!sortByAddress);
  };

  // Filter and sort orders
  const filteredData = deliveredOrders
    .filter((order) => {
      // Filter by phone number
      const phoneMatch =
        phoneFilter === "" ||
        order.shippingAddress.phoneNumber.toString().includes(phoneFilter);

      // Filter by place (street address)
      const placeMatch =
        placeFilter === "" ||
        order.shippingAddress.street.toLowerCase().includes(placeFilter.toLowerCase());

      return phoneMatch && placeMatch;
    })
    .sort((a, b) => {
      if (sortByAddress) {
        const addressA = a.shippingAddress.street.toLowerCase();
        const addressB = b.shippingAddress.street.toLowerCase();
        return addressA < addressB ? -1 : addressA > addressB ? 1 : 0;
      }
      return 0;
    });

    const parseCustomDate = (dateString) => {
      // Example: "March 19 at 09:25:19 AM"
      const [datePart, timePart] = dateString.split(' at ');
      const [month, day] = datePart.split(' ');
  
      // Get current year (assuming the date is from current year)
      const year = new Date().getFullYear();
  
      // Create a date string that JavaScript can parse
      const standardDateString = `${month} ${day}, ${year} ${timePart}`;
      return new Date(standardDateString);
    };

  return (
    <>
      <Dtopbar />
      <ToastContainer />
      {loading ? (
        <FruitLoader />
      ) : (
        <div className="order2">
          <h1 className="dall">Delivered Orders</h1>

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

          {/* Totals and Delete Selected Orders button */}
          <div className="dtotal">
            <p>Total Orders: {deliSno}</p>
            <p className="mtquantity">Total Quantity: {deliquantity} Pieces</p>
            <p className="mtcost">
              Total Cost: <PiCurrencyInr />
              {deliPrice}
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
              Delete Selected Orders
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
                         <td>{parseCustomDate(order.date).toLocaleDateString()}</td>
                         <td>{parseCustomDate(order.date).toLocaleTimeString()}</td>
                        <td>
                          <button
                            onClick={() => handleDelete(order.orderId)}
                            className="del"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="domsg">No delivered orders available</p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Ddelivered;