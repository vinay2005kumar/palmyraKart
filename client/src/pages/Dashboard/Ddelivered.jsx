import React, { useEffect, useState } from "react";
import "./Dorders.css";
import Topbar from "./Dtopbar";
import { PiCurrencyInr } from "react-icons/pi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAdmin } from '../../context/AdminContext';  // Import the AdminContext

const Ddelivered = () => {
  const {
    users,
    orders,
    totalPieces,
    totalCost,
    serialNumber,
    loading,
    error,
    deleteOrder,
    getdata,
    confirmDeleteOrder
  } = useAdmin(); // Use the AdminContext

  const [phoneFilter, setPhoneFilter] = useState(""); // For filtering by phone number
  const [placeFilter, setPlaceFilter] = useState(""); // For filtering by place (street address)
  const [sortByAddress, setSortByAddress] = useState(false); // For sorting by address
  const isMobile = window.innerWidth <= 760; // Check if the device is mobile
  const [deliquantity,setDeleQuantity]=useState()
  const [deliPrice,setDelePrice]=useState()
  const [deliSno,setDeleSno]=useState()
  // Filter delivered orders
  const deliveredOrders = orders.filter((order) => order.status === "Delivered");
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
  // Toast notification function
  const toastfun = (msg, type) => {
    toast[type](msg, {
      position: "top-right",
      autoClose: 3000,
      style: {
        position: "absolute",
        top: isMobile ? "6vh" : "60px",
        right: "0em",
        width: isMobile ? "60vw" : "35vw",
        height: isMobile ? "8vh" : "10vh",
        fontSize: "1.2rem",
        padding: "10px",
      },
      onClick: () => {
        toast.dismiss();
      },
    });
  };

  // Handle order deletion
  const handleDelete = (orderId, email) => {
    const toastId = `delete-toast-${orderId}`;
    const cancellationReason = "Order deleted by admin";

    if (!toast.isActive(toastId)) {
      toast.info(
        <div>
          <p style={{ padding: "1px" }}>Do you really want to delete this order?</p>
          <button
            onClick={async () => {
              await confirmDeleteOrder(orderId);
              toast.dismiss(toastId);
            }}
            style={{
              fontSize: "1.1em",
              margin: "5px",
              padding: "5px 15px",
              background: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss(toastId)}
            style={{
              fontSize: "1.1em",
              margin: "5px",
              padding: "5px 15px",
              background: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            No
          </button>
        </div>,
        {
          position: "top-center",
          closeOnClick: true,
          draggable: false,
          autoClose: false,
          onClick: () => toast.dismiss(toastId),
          toastId,
          style: { top: "6em", width: isMobile ? "70%" : "100%" },
        }
      );
    }
  };

  // Sort orders by address
  const sortOrdersByAddress = () => {
    setSortByAddress(!sortByAddress);
  };

  // Fetch data on component mount
  // useEffect(() => {
  //   getdata(); // Fetch data from the context
  // }, []);

  // Sort orders by address if enabled
  const sortedData = sortByAddress
    ? [...deliveredOrders].sort((a, b) => {
        const addressA = a.shippingAddress.street.toLowerCase();
        const addressB = b.shippingAddress.street.toLowerCase();
        return addressA < addressB ? -1 : addressA > addressB ? 1 : 0;
      })
    : deliveredOrders;

  // if (loading) {
  //   return <div>Loading...</div>;
  // }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <>
      <Topbar />
      <ToastContainer />
      <div className="order2">
        <h1 className="dall">Delivered Orders</h1>

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
          <p>Total Orders: {deliSno}</p>
          <p className="mtquantity">Total Quantity: {deliquantity} Pieces</p>
          <p className="mtcost">
            Total Cost: <PiCurrencyInr />
            {deliPrice}
          </p>
        </div>

        <div className="ditems">
          {sortedData.length > 0 ? (
            <table border="1px" className="dtable ddtable">
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
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedData
                  .filter((order) => {
                    // Filter by phone number
                    const phoneMatch =
                      phoneFilter === "" ||
                      order.shippingAddress.phoneNumber.toString().includes(phoneFilter);

                    // Filter by place (street address)
                    const placeMatch =
                      placeFilter === "" ||
                      order.shippingAddress.street.toLowerCase().includes(placeFilter.toLowerCase());

                    // Only include orders that match both filters
                    return phoneMatch && placeMatch;
                  })
                  .map((order, index) => {
                    const user = users.find((user) => user._id === order.user);
                    return (
                      <tr key={order._id}>
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
                        <td>{new Date(order.date).toLocaleDateString()}</td>
                        <td>{new Date(order.date).toLocaleTimeString()}</td>
                        <td>
                          <button
                            onClick={() => handleDelete(order._id, user.email)}
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
    </>
  );
};

export default Ddelivered;