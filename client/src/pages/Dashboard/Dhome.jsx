import React, { useEffect, useState } from 'react';
import Dtopbar from './Dtopbar';
import './Dhome.css';
import axios from 'axios';
import { PiCurrencyInrBold } from "react-icons/pi";
import { useAuth } from '../../context/AuthContext'; 
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { database, ref, set, onValue, get, update } from '../../firebase/firebase';
import { useAdmin } from '../../context/AdminContext'; 
import FruitLoader from '../../components/FruitLoader';
const Dhome = () => {
    const {
        users,
        orders,
        loading,
        error,
        getdata: fetchAdminData,
        deleteOrder,
    } = useAdmin(); // Use AdminContext
    const [email, setEmail] = useState();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [todayOrders, setTodayOrders] = useState(0);
    const [todayQuantity, setTodayQuantity] = useState(0);
    const [todayPrice, setTodayPrice] = useState(0);
    const [totalOrders, setTotalOrders] = useState(0);
    const [totalQuantity, setTotalQuantity] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);
    const [deliveredOrders, setDeliveredOrders] = useState(0);
    const [deliveredTodayQuantity, setDeliveredTodayQuantity] = useState(0);
    const [deliveredTodayPrice, setDeliveredTodayPrice] = useState(0);
    const [imgPreview, setImgPreview] = useState('No-picture.png');
    const [hrender, sethrender] = useState(false);
    const [hdata, sethdata] = useState([]);
    const [hlimit, sethlimit] = useState();
    const { Limit, setLimit } = useAuth();
    const [limit2, setlimit2] = useState();
    const isMobile = window.innerWidth <= 760;
    const [closeTime, setCloseTime] = useState(null);
    const [cnotify, setcnotify] = useState(false);
    const [isKartOpen, setIsKartOpen] = useState();
    const url = 'http://localhost:4000/api/user';
    const [currlimit, setcurrlimit] = useState();
    const { dashboardkart } = useAuth();
    

    const [isOpen, setIsOpen] = useState(true);

    const toastfun = (msg, type) => {
        toast[type](msg, {
            position: 'top-center',
            autoClose: 3000,
            style: {
                position: 'absolute',
                top: isMobile ? '6vh' : '60px',
                left: isMobile && '13%',
                width: isMobile ? '80vw' : "40vw", // Set width for mobile
                height: isMobile ? '10vh' : '10vh',
                fontSize: "1.2rem", // Adjust font size
                padding: "10px", // Adjust padding
            },
            onClick: () => {
                toast.dismiss(); // Dismiss the toast when clicked
            },
        });
    };
    // Fetch kart status from Firebase
    useEffect(() => {
        const url = import.meta.env.VITE_FIREBASE_URL;
        const collection = import.meta.env.VITE_FIREBASE_COLLECTION;
        const statusRef = ref(database, `${url}/${collection}`);
        get(statusRef).then((snapshot) => {
            if (snapshot.exists()) {
                setIsOpen(snapshot.val().isOpen);
            }
        });
    }, []);
    useEffect(() => {
        const url = import.meta.env.VITE_FIREBASE_URL;
        const collection = import.meta.env.VITE_FIREBASE_COLLECTION;
        const limitRef = ref(database, `${url}/${collection}`);

        // Listen for real-time updates for `limit`
        const unsubscribe = onValue(limitRef, (snapshot) => {
            if (snapshot.exists()) {
                document.getElementById("curr").innerHTML = snapshot.val().limit;
            }
        });

        return () => unsubscribe(); // Cleanup on unmount
    }, []);

    // Toggle kart availability
    const toggleAvailability = async () => {
        const newState = !isOpen;
        const url = import.meta.env.VITE_FIREBASE_URL;
        const collection = import.meta.env.VITE_FIREBASE_COLLECTION;

        try {
            await update(ref(database, `${url}/${collection}`), { isOpen: newState });
            toastfun(
                newState ? "PalmyraKart Opened Successfully" : "PalmyraKart Closed Successfully",
                "success"
            );
            setIsOpen(newState);
        } catch (error) {
            console.error("Error updating Firebase:", error);
            toastfun("Failed to update PalmyraKart status", "error");
        }
    };

   // Fetch data from the backend
   const getdata = async () => {
    try {
        // console.log('Fetching data...');
        // await fetchAdminData(); // Use the getdata function from AdminContext
         console.log('dh',orders)
        const today = new Date();
        const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        const startTime = new Date(todayUTC);
        startTime.setUTCHours(9, 0, 0, 0);

        let todayOrders = 0;
        let todayQuantity = 0;
        let todayPrice = 0;
        let deliveredOrders = 0;
        let deliveredQuantity = 0;
        let deliveredPrice = 0;
        let totaldorders = 0;
        let totaldquantity = 0;
        let totaldcost = 0;

        orders.forEach((order) => {
            const orderDate = new Date(order.date);
            const orderUTC = new Date(Date.UTC(orderDate.getUTCFullYear(), orderDate.getUTCMonth(), orderDate.getUTCDate()));

            if (order.status === 'Pending' && orderUTC.getTime() === todayUTC.getTime()) {
                todayOrders++;
                order.items.forEach((item) => {
                    const pieces = item.itemType === 'dozen' ? item.quantity * 12 : item.quantity;
                    todayQuantity += pieces;
                    todayPrice += item.price;
                });
            }

            if (order.status === 'Delivered' && orderDate >= startTime) {
                deliveredOrders++;
                order.items.forEach((item) => {
                    const deliveredPieces = item.itemType === 'dozen' ? item.quantity * 12 : item.quantity;
                    deliveredQuantity += deliveredPieces;
                    deliveredPrice += item.price * item.quantity;
                });
            }

            if (order.status === 'Delivered') {
                totaldorders++;
                order.items.forEach((item) => {
                    const totaldcount = item.itemType === 'dozen' ? item.quantity * 12 : item.quantity;
                    totaldquantity += totaldcount;
                    totaldcost += item.price * item.quantity;
                });
            }
        });

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
        console.error('Error fetching data:', error);
    }
};

useEffect(() => {
    getdata();
}, [getdata]);
  if (loading) {
    return <FruitLoader></FruitLoader>;
  }    

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
    const dstopKart = () => {
        // handleKartStatus(true)
        toggleAvailability()

    }
    const dopenKart = () => {
        //handleKartStatus(false)
        toggleAvailability()

    }
    const handleKart = (msg, type) => {

        const toastId = 'logout-toast';
        if (!toast.isActive(toastId)) {
            toast.info(
                <div>
                    <p style={{ padding: '1px' }}>{msg}</p>
                    <button
                        onClick={() => {
                            if (type == 'close') {
                                dstopKart()
                            }
                            else {
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

    // Handle closing today's session
    const handleCloseToday = async () => {
        try {
            const subject = 'Order Cancelled';
            const res = await axios.post(`${url}/close-orders`, { subject });
            if (res.status === 200) {
                toastfun('Session closed successfully', 'success');
                setTodayOrders(0);
                setTodayQuantity(0);
                setTodayPrice(0);
            } else if (res.status === 201) {
                toastfun('No user found', 'warn');
            }
        } catch (error) {
            console.error('Error closing orders:', error);
            toastfun('Error closing orders', 'error');
        }
    };

    // Handle sending notifications
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${url}/send-notification`, { subject, message });
            if (response.status === 200) {
                toastfun('Notification sent successfully!', 'success');
            } else {
                toastfun('Failed to send notification.', 'error');
            }
        } catch (error) {
            toastfun('Error sending notification.', 'error');
        } finally {
           
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
    // Handle setting limit
    const handleConfirmLimit = async () => {
        const url = import.meta.env.VITE_FIREBASE_URL;
        const collection = import.meta.env.VITE_FIREBASE_COLLECTION;

        try {
            await update(ref(database, `${url}/${collection}`), { limit: hlimit });
            toastfun(`Limit set to ${hlimit} pieces`, 'success');
            document.getElementById("curr").innerHTML = hlimit;
        } catch (error) {
            toastfun("Error updating limit", "error");
            console.error("Error updating limit:", error);
        }
    };

    return (
        <>
            <ToastContainer />
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
                            <h3>{todayQuantity}</h3>
                            <h3><PiCurrencyInrBold />{todayPrice}</h3>
                        </div>
                    </div>
                    <div className="dlbox">
                        <div className="dlbox1 dlbox21">
                            <h3>Delivered Orders</h3>
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
                            <input type="number" id="limit" onChange={(e) => sethlimit(e.target.value)} />
                            <label>Enter The Today's Limit</label>
                            <button className='dbut' type='submit' onClick={handlelimit}>SET</button>
                            <p>Current limit is: <span id='curr'>{currlimit}</span></p>
                        </div>
                        <div className="dlbox32">
                            <label>Close Today's Selling</label>
                            <button onClick={closeToday} className='dbut close'>CLOSE</button>
                        </div>
                    </div>
                </div>
                <div className="dprofile">
                    <h1 style={{ textAlign: 'center' }}>WELCOME VINAY</h1>
                    <div className="dbox1">
                        <label htmlFor="image">
                            <img src='/profile.jpg' alt="Profile" />
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
                                {!isOpen ? (
                                    <div className="close-kart">
                                        <button onClick={() => handleKart('Do you really want to close PalmyraKart', 'close')}>Close Kart</button>
                                    </div>
                                ) : (
                                    <div className="open-kart">
                                        <button onClick={() => handleKart('Do you want to open PalmyraKart', 'open')}>Open Kart</button>
                                    </div>
                                )}
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
                            <button type="submit" className="dhbutton" id='dhbutton'>Send Notification</button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dhome;