import React, { useEffect, useState } from 'react';
import Dtopbar from './Dtopbar';
import './Dhome.css';
import axios from 'axios';
import { PiCurrencyInrBold } from "react-icons/pi";
import AuthPage from '../components/AuthForm';
import { useAuth } from '../components/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { database, ref, set, onValue } from "../firebase/firebase";

// import { database, ref, set} from '../firebase/firebase'
const Dhome = () => {
 
  const[email,setemail]=useState()
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const[todayOrders,setTodayOrders]=useState(0)
  const [todayQuantity, setTodayQuantity] = useState(0);
  const [todayPrice, setTodayPrice] = useState(0);
  const[totalOrders,setTotalOrders]=useState(0)
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const[deliveredOrders,setDeliveredOrders]=useState(0)
  const [deliveredTodayQuantity, setDeliveredTodayQuantity] = useState(0);
  const [deliveredTodayPrice, setDeliveredTodayPrice] = useState(0);
  const [imgPreview, setImgPreview] = useState('No-picture.png');
  const[hrender,sethrender]=useState(false)
  const[hdata,sethdata]=useState([])
  const[hlimit,sethlimit]=useState()
  const {Limit,setLimit}=useAuth()
  const [limit2,setlimit2]=useState()
  const isMobile=window.innerWidth<=760
  const [closeTime, setCloseTime] = useState(null); // Store the time when close button is clicked
  const [cnotify,setcnotify]=useState(false)
  const [isKartOpen, setIsKartOpen] = useState();
  const url = 'https://palmyra-fruit.onrender.com/api/user';
  //const url = 'http://localhost:4000/api/user';
 const [currlimit,setcurrlimit]=useState()
 const {dashboardkart}=useAuth()
 const [loading,setloading]=useState(false)
//  const socket = io(url1, {
//   transports: ["websocket", "polling"], // Force WebSocket transport
//   withCredentials: true, // Include credentials (optional)
//   reconnection: true, // Enable auto-reconnect
//   reconnectionAttempts: 5, // Try reconnecting 5 times
//   reconnectionDelay: 1000, // Delay between reconnect attempts
// });
// --------------------------------------

  const [isOpen, setIsOpen] = useState(true);
  useEffect(() => {
    const statusRef = ref(database, "users/AmIewDOW747kvqkfhNE2"); // Updated path in Firebase
    onValue(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        setIsOpen(snapshot.val()); // Update state with the fetched value
      } else {
        setIsOpen(false); // Default value if not found
      }
    });
  }, []);
  const toggleAvailability = async () => {
    const newState = !isOpen;
   
    console.log("state", newState);
  
    try {
      await set(ref(database, "users/AmIewDOW747kvqkfhNE2"), { isOpen: newState });
      toastfun(
        newState ? "PalmyraKart Closed Successfully" : "PalmyraKart Opened Successfully",
        "success"
      );
      setIsOpen(newState);
    } catch (error) {
      console.error("Error updating Firebase:", error);
      toastfun("Failed to update PalmyraKart status", "error");
    }
  };
  

// const handleKartStatus = async (status) => {
//   try {
    
//     console.log('dhome',status)
//     // socket.emit("kart-status-updated", status);
//     await axios.put(`${url}/kart-status`, {value: status });
//    // 🔥 Notify all clients
//     if(status){
//       toastfun(`PalmyraKart Closed Successfully`,'success')
//       setIsKartOpen(status);
//     }
//     else{
//       toastfun(`PalmyraKart Opened Successfully`,'success')
//       setIsKartOpen(status);
//     }
    
//   } catch (error) {
//     console.error("Error updating kart status:", error);
//   }
// };

 const handleCloseToday = async () => {
    try {
      const subject='Order Cancelled'
      const message='Sorry for canceling your order, you can make a new order for tomorrow freshly..!'
      const currentCloseTime = new Date(); // Capture the current time
      setCloseTime(currentCloseTime); // Store the close time
      // Send request to close orders
     const res= await axios.post(`${url}/close-orders`,{subject});
      if(res.status==200){
      toastfun('Session closed successfully', 'success');
      toastfun('Notifications sent successfully to expired orders', 'success');
      // Reset today's orders count
      setTodayOrders(0);
      setTodayQuantity(0);
      setTodayPrice(0);
      }
      else if(res.status==201){
        toastfun('no user found','warn')
      }
      // Prepare notification subject and message
    //   setSubject('Order Cancelled');
    //   setMessage('Sorry for canceling your order, you can make a new order for tomorrow freshly..!');
    //  setcnotify(true)
    //  const res= await axios.post(`http://${url1}:5005/send-notification`,{subject,message,cnotify});
    //   if(res.status==300){
    //   toastfun('Notifications sent successfully to expired orders', 'success');
    //   } 
    //   else{
    //       toastfun('not working')
    //   }
      
    } catch (error) {
    
      console.error('Error closing orders or sending notifications:', error);
      toastfun('Error closing orders or sending notifications', 'error');
    }
};

  const toastfun = (msg, type) => {
    toast[type](msg, {
      position: 'top-center',
      autoClose: 3000,
      style: {
         position: 'absolute',
        top:isMobile?'6vh':'60px',
        left:isMobile && '13%',
        width:isMobile?'80vw': "40vw", // Set width for mobile
        height:isMobile?'10vh':'10vh',
        fontSize: "1.2rem", // Adjust font size
        padding: "10px", // Adjust padding
      },
      onClick: () => {
        toast.dismiss(); // Dismiss the toast when clicked
      },
    });
  };

  const getdata = async () => {
    try {
      const { data } = await axios.get(`${url}/getAllUsers`);
      sethdata(data.user);
       console.log(data.user)
      let todayOrders = 0;
      let todayQuantity = 0;
      let todayPrice = 0;
      let deliveredOrders = 0;
      let deliveredQuantity = 0;
      let deliveredPrice = 0;
      let totaldorders=0;
      let totaldquantity=0;
      let totaldcost=0;
  
      const today = new Date();
      const todayString = today.toISOString().split('T')[0]; // Format YYYY-MM-DD
  
      // Set 9:00 AM today as the start time
      const startTime = new Date();
      startTime.setHours(8, 0, 0, 0); // Set time to 9:00 AM
      const endTime = closeTime || new Date(); 
      
      data.user.forEach(user => {
        setcurrlimit(user.limit)
        user.orders.forEach(order => {
          const orderDate = new Date(order.date);
          // console.log(orderDate)
          const orderString = orderDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
          // console.log('orderstring',orderString)
          if (order.status === 'pending') {
            todayOrders++;
            const pieces = order.item === 'dozen' ? order.quantity * 12 : order.quantity;
            todayQuantity += pieces;
            todayPrice += order.price;
          }
        //  console.log('today string',todayString)
          // Calculate delivered orders only between 9:00 AM and close time
          if (order.status === 'delivered' && orderString === todayString && orderDate >= startTime && orderDate <= endTime) {
            // console.log(closeTime)
            deliveredOrders++;
            const deliveredPieces = order.item === 'dozen' ? order.quantity * 12 : order.quantity;
            deliveredQuantity += deliveredPieces;
            deliveredPrice += order.price;
          }
          
          if(order.status === 'delivered'){
            totaldorders++;
            const totaldcount = order.item === 'dozen' ? order.quantity * 12 : order.quantity;
            totaldquantity += totaldcount;
            totaldcost += order.price;
            // console.log('dhome',totaldorders,totaldquantity,totaldcost)
          }
        });
      });
  
      // Set the state values
      setTodayOrders(todayOrders);
      setTodayQuantity(todayQuantity);
      setTodayPrice(todayPrice);
      setDeliveredOrders(deliveredOrders);
      setDeliveredTodayQuantity(deliveredQuantity);
      setDeliveredTodayPrice(deliveredPrice);
      setTotalOrders(totaldorders);
      setTotalQuantity(totaldquantity);
      setTotalPrice(totaldcost);
    } catch (error) {
      //console.log(err);
      console.error(error)
    }
  };
  
  // useEffect(() => {
  //   getdata();
  //   sethrender(true);
  // }, []);
  
 
  // const fetchKartStatus = async () => {
  //   try {
  //     const res = await axios.get(`${url}/kart-status`);
  
  //     const value = res.data; // Access the value
  //    // console.log('dhomebar',value)
  //     setIsKartOpen(value); 
  //   } catch (error) {
  //     console.error('Error fetching user:', error);
  //   }
  // };

  useEffect(() => {
    // fetchData();22
    // fetchKartStatus()
    getdata()
    // sethrender(true)
  }, []);

  const handleSubmit = async (e) => {
   
    e.preventDefault();
    try {
      setloading(true)
      const response = await axios.post(`${url}/send-notification`, { subject, message});

      if (response.status === 200) {
        toastfun('Notification sent successfully!','success');
      } else {
        toastfun('Failed to send notification.','error');
      }
    } catch (error) {
      if(error.response.status=== 404){
        toastfun('Error sending notification.','error');
      }
      //console.error('Error sending notification:', error);
      toastfun('Error sending notification.','error');
    }
    finally{
      setloading(false)
    }
  };
  const handlelimit = () => {
    const toastId = 'limit-toast';
    
    if (!toast.isActive(toastId)) {
      toast.info(
        <div>
          <p style={{ padding: '1px' }}>Do you really want to set the limit to {hlimit} pieces?</p>
          <button
            onClick={async () => {
              await handleConfirmLimit(); // Call function to update limit
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
          onClick: () => {
            toast.dismiss(toastId);
          },
          toastId,
          style: {
            top: '6em',
            width: isMobile ? '70%' : '100%',
          },
        }
      );
    }
  };
  
  // Function to actually update the limit
  const handleConfirmLimit = async () => {
    try {
      const res = await axios.put(`${url}/update-limit`, { hlimit }); // Await API call
      toastfun(`Limit set to ${hlimit} pieces`, 'success'); // Show success message
      document.getElementById('curr').innerHTML = `${hlimit}`;
    } catch (error) {
      toastfun('Error updating limit', 'error');
      console.error('Error updating limit:', error);
    }
  };
  
   const closeToday = () => {
      const toastId = 'logout-toast';
      if (!toast.isActive(toastId)) {
        toast.info(
          <div>
            <p style={{ padding: '1px' }}>Do you really want to close the today's session</p>
            <button
              onClick={() => {
               handleCloseToday()
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
            onClick: () => {
              toast.dismiss(toastId);
            },
            toastId,
            style: {
              top: '6em',
              width: isMobile ? '70%' : '100%',
            },
          }
        );
      }
    };
    const dstopKart=()=>{
      // handleKartStatus(true)
      toggleAvailability()
     
  }
  const dopenKart=()=>{
    //handleKartStatus(false)
    toggleAvailability()
 
  }
    const handleKart = (msg,type) => {
   
      const toastId = 'logout-toast';
      if (!toast.isActive(toastId)) {
        toast.info(
          <div>
            <p style={{ padding: '1px' }}>{msg}</p>
            <button
              onClick={() => {
                if(type=='close'){
               dstopKart()
                }
                else{
                  dopenKart()
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
            closeOnClick: true,
            draggable: false,
            autoClose: false,
            onClick: () => {
              toast.dismiss(toastId);
            },
            toastId,
            style: {
              top: '6em',
              width: isMobile ? '70%' : '100%',
            },
          }
        );
      }
    };
  
  return (
    <>
    <ToastContainer></ToastContainer>
      <Dtopbar />
      <div className="dhome">
        <div className="dhlimit dbox">
          <div className="dlbox dlbox-s">
            <h1>TODAY'S DETAILS</h1>
            <div className="dlbox1 dlbox11">
              <h3>Getting Orders</h3>
              <h3>Getting Pieces</h3>
              <h3>Getting Amount</h3>
            </div>
            <div className="dlbox2 dlbox12">
              <p>:</p>
              <p>:</p>
              <p>:</p>
            </div>
            <div className="dlbox3 dlbox13">
              <h3>{todayOrders}</h3>
              <h3>{todayQuantity}</h3> {/* Adjust if pieces need to be calculated differently */}
              <h3><PiCurrencyInrBold />{todayPrice}</h3>
              
            </div>
        
          </div>
          <div className="dlbox">
            
          <div className="dlbox1 dlbox21">
              <h3>Delivered Orders</h3> {/* Change title to reflect delivered orders */}
              <h3>Delivered Pieces</h3>
              <h3>Recieving Amount</h3>
            </div>
            <div className="dlbox2 dlbox22">
              <p>:</p>
              <p>:</p>
              <p>:</p>
            </div>
            <div className="dlbox23">
              <h3>{deliveredOrders}</h3>
              <h3>{deliveredTodayQuantity}</h3> 
              <h3><PiCurrencyInrBold />{deliveredTodayPrice}</h3>
             
            </div>
          </div>
           <div className="dlbox dlbox33">
            <div className="dlbox31">
              <input type="number" name="" id="limit" onChange={(e)=>sethlimit(e.target.value)}/>
              <label htmlFor="">Enter The Today's Limit</label>
              <button className='dbut' type='submit' onClick={()=>handlelimit()}>SET</button>
              <p > Current limit is : <span id='curr'>{currlimit}</span></p>
            </div>
            <div className="dlbox32">
              <label htmlFor="">Close Today's Selling</label>
            <button onClick={closeToday} className='dbut close'>CLOSE</button>
            </div>
        
           </div>
        </div>
        <div className="dprofile">
          <h1 style={{ textAlign: 'center' }}>WELCOME VINAY</h1>
          <div className="dbox1">
            <label htmlFor="image">
              <img src='profile.jpg' alt="Profile" />
            </label>
            <p>Believe Yourself</p>
            <div className="admin-details">
              <div className="adetails">
                <span className="label">Admin</span>
                <span className='dots'>:</span>
                <span className="value">Vinay</span>
              </div>
              <div className="adetails">
                <span className="label">Email</span>
                <span className='dots'>:</span>
                <span className="value" id='aemail'>buttalavinay@gmail.com</span>
              </div>
              <div className="adetails">
                <span className="label">Total Orders</span>
                <span className='dots dots2'>:</span>
                <span className="value value2">{totalOrders}</span>
              </div>
              <div className="adetails">
                <span className="label">Total Pieces</span>
                <span className='dots dots2'>:</span>
                <span className="value value2">{totalQuantity}</span>
              </div>
              <div className="adetails">
                <span className="label">Total Amount</span>
                <span className='dots dots2'>:</span>
                <span className="value value2"><PiCurrencyInrBold />{totalPrice}</span>
              </div>
              <div className="dkart">
                {!isOpen ?   <div className="close-kart"><button onClick={()=>handleKart('Do you really want to close PalmyraKart','close')}>close kart</button></div>:
                <div className="open-kart"><button onClick={()=>handleKart('Do you want to open PalmyraKart','open')}>open kart</button></div>
                }
                
                {/* <button onClick={toggleKart}>
               {isOpen ? "Close Kart" : "Open Kart"}
               </button> */}
              </div>

            </div>
          </div>
        </div>
        <div className="dnotification">
          <div className="dbox">
            <h1>SEND NOTIFICATION...</h1>
            <form onSubmit={handleSubmit}>
              <label htmlFor="dsub">SUBJECT :</label>
              <input
                type="text"
                id="dsub"
                className="dsub"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
              <textarea
                rows="10"
                placeholder="Enter Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              ></textarea>
              <button type="submit" className="dhbutton" id='dhbutton'>{loading?'Sending...':'Send Notification'}</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dhome;
