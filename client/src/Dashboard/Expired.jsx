import React, { useEffect, useState } from 'react';
import './Expired.css'
import Topbar from './Dtopbar';
import axios from 'axios';
import { RxCross2 } from "react-icons/rx";
import { PiCurrencyInr } from "react-icons/pi";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const Expired = () => {
  const [ddata, setddata] = useState([]);
  const [demail, setdemail] = useState('');
  const [dquantity, setdquantity] = useState(0);
  const [dprice, setdprice] = useState(0);
  const [phoneFilter, setPhoneFilter] = useState('');
  const [sno, setsno] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const isMobile=window.innerWidth<=760
  const url = 'https://palmyra-fruit.onrender.com/api/user';
  //const url = 'http://localhost:4000/api/user';
  const getdata = async () => {
    try {
 
      const { data } = await axios.get(`${url}/getAllUsers`);
      setddata(data.user);
      
      let totalPieces = 0;
      let totalCost = 0;
      let serialNumber = 0;

      data.user.forEach((user) => {
        user.orders
          .filter((order) => order.status === 'expired')
          .forEach((order) => {
            const pieces = order.item === 'single' ? order.quantity : order.quantity * 12;
            totalPieces += pieces;
            totalCost += order.price;
            serialNumber += 1;
          });
      });

      setdquantity(totalPieces);
      setdprice(totalCost);
      setsno(serialNumber);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setErrorMessage('Failed to fetch data. Please try again later.');
    }
  };
  const toastfun = (msg, type) => {
    toast[type](msg, {
      position: 'top-right',
      autoClose: 3000,
      style: {
        position: 'absolute',
       top:isMobile?'6vh':'60px',
        right: '0em',
        width:isMobile?'60vw': "35vw", // Set width for mobile
        height:isMobile?'8vh':'10vh',
        fontSize: "1.2rem", // Adjust font size
        padding: "10px", // Adjust padding
      },
      onClick: () => {
        toast.dismiss(); // Dismiss the toast when clicked
      },
    });
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
  

  useEffect(() => {
    getdata();
  }, []);

  return (
    <div>
      <ToastContainer></ToastContainer>
      <Topbar />
      <div className="dorder2">
        <h1 id='dall'>Expired Orders</h1>
        <div className="dnumber" id='fdnumber'>
          <label htmlFor="dnumber2">Enter Number:</label>
          <input 
            type="number" 
            id="dnumber2" 
            value={phoneFilter} 
            onChange={(e) => setPhoneFilter(e.target.value)} 
          />
        </div>

        <div className="dtotal" id='dtotal'>
          <p>Total Orders: {sno}</p>
          <p>Total Quantity: {dquantity} Pieces</p>
          <p id='mtcost'>Total Cost: <PiCurrencyInr />{dprice}</p>
        </div>

        {/* {errorMessage && <p className="error-message">{errorMessage}</p>} */}

        <div className="dtable2 dtable3 detable1">
          {ddata.length > 0 ? (
            <table border="1px" className="dtable detable">
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
                {ddata
                  .filter((user,index) => 
                    phoneFilter === '' || user.orders.some((order, index) => 
                      order.status === 'expired' &&
                      user.phone[index] && user.phone[index].includes(phoneFilter)
                  )
                  )
                  .flatMap((user, userIndex) =>
                    user.orders.filter((order) => order.status === 'expired').map((order,index) => {
                      return (
                        <tr key={order._id}>
                          <td>{index + 1}</td>
                          <td>
                            Expired
                          </td>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{user.phone[user.orders.indexOf(order)]}</td> {/* Consider if you want to show a specific phone */}
                          <td>{user.address[user.orders.indexOf(order)]}</td> {/* Same for address */}
                          <td>{order.item}</td>
                          <td>{order.type === 'single' ? order.quantity : order.quantity * 12}</td>
                          <td>
                            <PiCurrencyInr />
                            {order.price}
                          </td>
                          <td>{order.status}</td>
                          <td>{new Date(order.date).toLocaleDateString()}</td>
                          <td>{new Date(order.date).toLocaleTimeString()}</td>
                          <td>
                            <button onClick={() => handleDelete(order.orderId,user.email)} style={{cursor:'pointer'}} className='del' id='del'>Delete</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
              </tbody>
            </table>
          ) : (
            <p className='domsg'>No orders available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Expired;
