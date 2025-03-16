import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

const AdminContext = createContext();
export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
  const [users, setUsers] = useState([]); // All users
  const [orders, setOrders] = useState([]); // All orders
  const [pendingOrders, setPendingOrders] = useState([]); // Pending orders
  const [totalPieces, setTotalPieces] = useState(0); // Total pieces in pending orders
  const [totalCost, setTotalCost] = useState(0); // Total cost of pending orders
  const [serialNumber, setSerialNumber] = useState(0); // Serial number for pending orders
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(null); // Error state
  const {logout}=useAuth()
  const url = 'https://palmyra-fruit.onrender.com/api/user';
  // const url = "http://localhost:4000/api/user"; // Admin API base URL
  const navigate=useNavigate()
  const isMobile = window.innerWidth <= 768;
  // Fetch admin data (users, orders, etc.)
  const getdata = async () => {
    try {
        console.log('getting..')
      setLoading(true);
      const { data } = await axios.get(`${url}/getAllUsers`, {
        withCredentials: true, // Include credentials (cookies) if needed
      });

      if (!data.users || !data.orders) {
        throw new Error("Invalid response structure from the server.");
      }
      else{
        // logout()
      }
      // Filter pending orders
      const pendingOrders = data.orders.filter((order) => order.status === "Pending");

      // Set data in state
      setUsers(data.users);
      setOrders(data.orders);
      setPendingOrders(pendingOrders);

      // Calculate totals for pending orders
      let totalPieces = 0;
      let totalCost = 0;
      let serialNumber = 0;

      pendingOrders.forEach((order) => {
        order.items.forEach((item) => {
          const pieces = item.itemType === "single" ? item.quantity : item.quantity * 12;
          totalPieces += pieces;
          totalCost += item.price;
        });
        serialNumber += 1;
      });

      setTotalPieces(totalPieces);
      setTotalCost(totalCost);
      setSerialNumber(serialNumber);
    } catch (error) {
      console.log("Error fetching orders:", error);
      setError("Failed to fetch orders. Please try again later.");
      toast.error("Failed to fetch orders. Please try again later.");
      logout()
      // navigate('/auth')
      
    } finally {
      setLoading(false);
    }
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
  // Delete an order
  const deleteOrder = async (orderId, email, cancellationReason) => {
    try {
      const deleteurl = `${url}/order/${orderId}`;
      await axios.delete(deleteurl, {
        headers: { "Content-Type": "application/json" },
        data: { email, cancellationReason },
      });

      toast.success("Order deleted successfully");
      getdata(); // Refresh order list
    } catch (error) {
      console.log("Error deleting order:", error);
      toast.error("Failed to delete the order. Please try again.");
    }
  };
  const confirmDeleteOrder = async (orderId) => {
    try {
      const deleteUrl = `${url}/removeOrder/${orderId}`;
      const res=  await axios.delete(deleteUrl, {
        headers: { 'Content-Type': 'application/json' },
      });
     if(res.status==200){
     // Show success toast
     toastfun('Order history deleted successfully', 'success');
     }
     else{
      toastfun('Failed to delete the order history. Please try again.', 'error');
     }
 
    } catch (error) {
      console.log(error)
      toastfun('Failed to delete the order history. Please try again.', 'error');
    }
  };

  
  // Fetch data on mount
  useEffect(() => {
    getdata();
  }, []);

  return (
    <AdminContext.Provider
      value={{
        users,
        orders,
        pendingOrders,
        totalPieces,
        totalCost,
        serialNumber,
        loading,
        error,
        deleteOrder,
        getdata, // Expose the getdata function for manual refetching
        confirmDeleteOrder
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};