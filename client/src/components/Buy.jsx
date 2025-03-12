import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Buy.css';
import { PiCurrencyInrBold } from "react-icons/pi";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
const Buy = ({ count, price, path, itemtype, totalcount, quantity ,llimit3,handlePaymentSuccess}) => {
  const [bname, setbname] = useState(localStorage.getItem('username'));
  const [bphone, setbphone] = useState('');
  const [bphone2, setbphone2] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState('');
  const [baddress, setbaddress] = useState('');
  const [save, setsave] = useState(false);
  const [itemprice, setitemprice] = useState(price);
  const [bcount, setbcount] = useState(count);
  const [bpath, setbpath] = useState(path);
  const [btype, setbtype] = useState(itemtype);
  const [tprice, settprice] = useState(0);
  const [bemail, setbemail] = useState(localStorage.getItem('email'));
  const [status, setstatus] = useState('pending');
  const[order,setorder]=useState(false)
  const [totalcount1, settotalcount1] = useState(totalcount);
  const [totalcount2, settotalcount2] = useState(0);
  const[limit,setlimit]=useState(llimit3)
  // const[orderOtp,setOrderOtp]=useState()
  const navigate = useNavigate();
 // const url = 'https://palmyra-fruit.onrender.com/api/user';
  const url = 'http://localhost:4000/api/user';
   const isMobile=window.innerWidth<=765
  const areaPlaceMapping = {
    Parvathipuram: ['Place 1', 'Place 2', 'Place 3'],
    Bobbili: ['Place A', 'Place B', 'Place C'],
  };
  const toastfun = (msg, type) => {
    toast[type](msg, {
      position: 'top-center',
      autoClose: 3000,
      style: {
        position: 'absolute',
        right: '0em',
        top:isMobile?'0em':'0px',
        left:isMobile?'18%': '-2em',
        width:isMobile?'70vw':'40vw', // Set width for mobile
        height:isMobile?'10vh':'20vh',
        fontSize:isMobile?'1.1em': "1.2em", // Adjust font size
        padding: "10px", // Adjust padding
      },
      onClick: () => {
        toast.dismiss(); // Dismiss the toast when clicked
      },
    });
  };
  useEffect(() => {
    const calculateTotal = () => {
      const a = itemprice || 0;
      const c = 3;  // Platform Fee
      const d = 10;  // GST and Restaurant Charges
      settprice(a + c + d);
    };
    
    calculateTotal();
  }, [itemprice],[totalcount2]);

  useEffect(() => {
    // Fetch available quantity when component mounts or `count` or `btype` changes
  }, [count, btype,order]);

  const handleSave = () => {
    // console.log('hi')
    if (!bname) {
    
      toastfun('Please login first ','warn')
      // window.alert('You need to login');
      setsave(false);
    } else if (bphone === '') {
      toastfun('Please enter mobile number ','warn')
      setsave(false);
    } else if (selectedArea === '' || selectedPlace === '') {
      toastfun('Please enter your address', 'warn');
      setsave(false);
    } else {
      setbphone2(bphone);
      setbaddress(`${selectedArea}, ${selectedPlace}`);
      setsave(true);
      // console.log('details:',bphone2,baddress)
    }
  };

  const generateOrderId = () => {
    const prefix = "ORD"; // Fixed prefix
    const timestamp = Date.now().toString(36).toUpperCase(); // Base36 encoded timestamp
    const randomStr = Math.random().toString(36).slice(2, 6).toUpperCase(); // Random 4-letter string
    const middleText = "PALMYRA"; // Fixed text in between
    const randomNum = Math.floor(1000 + Math.random() * 9000); // Random 4-digit number
  
    return `${prefix}-${timestamp}-${middleText}-${randomStr}${randomNum}`;
  };
  

  const handleAreaChange = (e) => {
    const selectedArea = e.target.value;
    setSelectedArea(selectedArea);
    setPlaces(areaPlaceMapping[selectedArea] || []);
    setSelectedPlace('');
  };
  const handlePay = async () => {
    if(!save){
      toastfun('please fill the details','warn')
    }
    else{
    const updatedTotalCount2 = await fetchAvailableQuantity(); // Return the updated value
    if (updatedTotalCount2 < limit) {
      if (save) {

        // setOrderOtp(generateOTP)
        const orderDetails = {
          orderId:generateOrderId(),
          item: btype,
          quantity: bcount,
          price: tprice,
          imagePath: bpath,
          status: status,
          date: Date.now(),
          // orderOtp: generatedOtp,
        };
       console.log(orderDetails.orderId)
        try {
          const response = await axios.post(`${url}/order`,{
              address: baddress,
              phone: bphone2,
              orders: [orderDetails],
            },{withCredentials:true}
          );
          const email=response.data.email
          const msg='ORDER SUCCESSFUL'
         if(response.data.success){
          console.log('coming',response.data.user)
          const oid=orderDetails.orderId
          const orderOtp= Math.floor(100000 + Math.random() * 900000).toString();
         console.log('buy',orderOtp,oid)
          const sendotp = await axios.post(`${url}/send-orderOtp`,{oid,orderOtp}, { withCredentials: true });
          console.log(sendotp.data.message)
          if (sendotp.data.success) {
            setorder(true)
            // console.log('order',order)
            // window.alert('success')
            toastfun('Payment successful and Check your Email for OrderED OTP ','success');
            handlePaymentSuccess(true)
            navigate('/order');
          } else {
            setorder(false)
            handlePaymentSuccess(order)
            toastfun(`Error:Error in otp sending`,'error');

          }
        }
        } catch (error) {
          toastfun('Error occurred during payment','error');
          console.log(error)
        }
      } else {
        toastfun('Please fill and confirm details','warn');
      }
    } else {
      toastfun(`Sorry, the orders have reached the limit ,only ${updatedTotalCount2-limit} are available`,'info');
    }
  }
  };
  const fetchAvailableQuantity = async () => {
    try {
      const availableQuantity = await quantity(count);
      settotalcount1(availableQuantity);
      let updatedTotalCount2 = 0;
      if (btype === 'single') {
        updatedTotalCount2 = availableQuantity + bcount;
      } else if (btype === 'dozen') {
        updatedTotalCount2 = availableQuantity + bcount * 12;
      }

      return updatedTotalCount2; // Return updated value directly
    } catch (error) {
      console.error('Error fetching available quantity:', error);
      return 0; // Fallback value in case of error
    }
  };
  

  return (
    <>
    <ToastContainer></ToastContainer>
      <div className="goback">
        <Link to='/ordermenu'>Go Back</Link>
      </div>
      <div id='bmain'>
        <div className="card1">
          <div className="blocation2">
            <div className="chooseloc">
              <p>Delivery Details</p>
              <label htmlFor="phone" className='l1'>Your Mobile Number:</label>
              <input type="tel" name="number" id="number" required onChange={(e) => setbphone(e.target.value)} />
              <div className="bblock">
                <marquee behavior="" direction="" className='marquee'>Currently, the delivery location is available for some areas</marquee>
                <div className="area">
                  <div className="area1">
                    <label htmlFor="area" className='label'>Select Area:</label>
                    <select name="area" id="area" value={selectedArea} onChange={handleAreaChange}>
                      <option value="">Select Area</option>
                      {Object.keys(areaPlaceMapping).map((area) => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>
                  <div className="area2">
                    <label htmlFor="place" className='label'>Select Place:</label>
                    <select name="place" id="place" value={selectedPlace} onChange={(e) => setSelectedPlace(e.target.value)}>
                      <option value="">Select Place</option>
                      {places.map((place) => (
                        <option key={place} value={place}>{place}</option>
                      ))}
                    </select>
                  </div>
                  <button id='save' onClick={handleSave}>Save</button>
                </div>
              </div>
            </div>
          </div>
          <div className="details">
            <h2>Customer Details</h2>
            <hr />
            <div className="titles">
              <p>Name</p>
              <p>Phone Number</p>
              <p>Delivery Address</p>
            </div>
            <div className="cols">
              <p>:</p>
              <p>:</p>
              <p>:</p>
            </div>
            <div className="dvalues">
              <p id='bname'>{bname}</p>
              <p id='bphone'>{bphone2}</p>
              <p id='bloc'>{baddress}</p>
            </div>
          </div>
        </div>
        <div className="card2">
          <div className="bitem">
            <p id='btype'>You are buying <strong>{bcount} {btype}</strong> palmyra fruits</p>
            <div className="bimg">
              <img src={bpath} alt="hi" />
            </div>
            <div className="bill">
              <p id='tbill'>BILL DETAILS </p>
              <hr />
              <p>Item Total</p>
              <p>Platform Fee</p>
              <p className='gst'>Transport Charges</p>
              <hr />
              <p>TOTAL PAY</p>
              <div className="values">
                <p id='itemcost'><PiCurrencyInrBold className='vicon' />{itemprice}</p>
                <p id='platform'><PiCurrencyInrBold className='vicon' />3</p>
                <p id='gst'><PiCurrencyInrBold className='vicon' />10</p>
                <p id='totalcost'><PiCurrencyInrBold className='vicon' />{tprice}</p>
                {/* <hr /> */}
              </div>
            </div>
            <button id='pay' onClick={handlePay}>PAY NOW</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Buy;
