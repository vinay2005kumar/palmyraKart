import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Buy.css";
import { PiCurrencyInrBold, PiCurrencyInr } from "react-icons/pi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PaymentComponent from "./PaymentComponent";
import { useAuth } from '../../context/AuthContext';
import { database, ref, onValue } from '../../firebase/firebase';

const Buy = ({ count, price, path, itemtype, handlePaymentSuccess }) => {
  const [bphone, setbphone] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState("");
  const [save, setsave] = useState(false);
  const [itemprice, setitemprice] = useState(price);
  const [bcount, setbcount] = useState(count);
  const [bpath, setbpath] = useState(path);
  const [btype, setbtype] = useState(itemtype);
  const [tprice, settprice] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableStock, setAvailableStock] = useState(0);
  const [isStockChecking, setIsStockChecking] = useState(false);
  const isMobile = window.innerWidth <= 765;
  const navigate = useNavigate();
  const paymentRef = useRef(null);

  const { userDetails, checkAuth } = useAuth();
  const { name: bname, email: customerEmail } = userDetails;

  const areaPlaceMapping = {
    Parvathipuram: ["Place 1", "Place 2", "Place 3"],
    Bobbili: ["Place A", "Place B", "Place C"],
  };

  const toastfun = (msg, type) => {
    toast[type](msg, {
      position: "top-center",
      autoClose: 3000,
      style: {
        position: "absolute",
        right: "0em",
        top: isMobile ? "0em" : "0px",
        left: isMobile ? "18%" : "-2em",
        width: isMobile ? "70vw" : "40vw",
        height: isMobile ? "10vh" : "20vh",
        fontSize: isMobile ? "1.1em" : "1.2em",
        padding: "10px",
      },
      onClick: () => {
        toast.dismiss();
      },
    });
  };

  useEffect(() => {
    const calculateTotal = () => {
      const a = itemprice || 0;
      const c = 3; // Platform Fee
      const d = 10; // GST and Restaurant Charges
      settprice(a + c + d);
    };
    calculateTotal();
  }, [itemprice]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const url = import.meta.env.VITE_FIREBASE_URL;
    const collection = import.meta.env.VITE_FIREBASE_COLLECTION;
    const inventoryRef = ref(database, `${url}/${collection}`);

    const unsubscribe = onValue(inventoryRef, (snapshot) => {
      if (snapshot.exists()) {
        const { limit, stock } = snapshot.val();
        setAvailableStock(limit - stock);
      }
    });

    return () => unsubscribe();
  }, []);

  const generateOrderId = () => {
    const prefix = "ORD";
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomStr = Math.random().toString(36).slice(2, 6).toUpperCase();
    const middleText = "PALMYRA";
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${timestamp}-${middleText}-${randomStr}${randomNum}`;
  };

  const handleSave = () => {
    if (!bname) {
      toastfun("Please login first", "warn");
      setsave(false);
    } else if (bphone === "") {
      toastfun("Please enter mobile number", "warn");
      setsave(false);
    } else if (selectedArea === "" || selectedPlace === "") {
      toastfun("Please enter your address", "warn");
      setsave(false);
    } else {
      setsave(true);
    }
  };

  const handleAreaChange = (e) => {
    const selectedArea = e.target.value;
    setSelectedArea(selectedArea);
    setPlaces(areaPlaceMapping[selectedArea] || []);
    setSelectedPlace("");
  };

  const handlePay = async () => {
    if (!save) {
      toastfun("Please fill and confirm details", "warn");
      return;
    }

    if (isProcessing || isStockChecking) {
      toastfun("Please wait...", "info");
      return;
    }

    setIsStockChecking(true);
    
    try {
      const totalSelectedQuantity = btype === "single" ? bcount : bcount * 12;
      
      if (totalSelectedQuantity > availableStock) {
        toastfun(`Only ${availableStock} pieces available. Please reduce quantity.`, "error");
        return;
      }

      setIsProcessing(true);

      const buyComponentData = {
        bname,
        btype,
        bcount,
        tprice,
        bpath,
        baddress: `${selectedArea}, ${selectedPlace}`,
        bphone2: bphone,
        generateOrderId,
        navigate,
        userId: userDetails.id
      };

      if (paymentRef.current) {
        await paymentRef.current.initiatePayment(buyComponentData);
      }
    } catch (error) {
      console.error("Payment processing failed:", error);
      toastfun("Payment processing failed. Please try again.", "error");
    } finally {
      setIsProcessing(false);
      setIsStockChecking(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="goback">
        <Link to="/ordermenu">Go Back</Link>
      </div>
      <div className="stock-info">
          <div className="pieces">
          {availableStock > 10 ? (
                <span className="in-stock">Remaining Pieces are:{availableStock}</span>
              ) : availableStock > 0 ? (
                <span className="low-stock">Only {availableStock} left!</span>
              ) : (
                <span className="out-of-stock">Out of Stock</span>
              )}
          </div>
            
              <div className="snote">(<span>Note</span>: Other customers are buying these pieces in real time. You can see the updated stock here. Grab yours quickly before they sell out!)</div>
            </div>
      <div id="bmain">
        <div className="card1">
          <div className="blocation2">
            <div className="chooseloc">
              <p>Delivery Details</p>
              <label htmlFor="phone" className="l1">
                Your Mobile Number:
              </label>
              <input type="tel" name="number" id="number" required onChange={(e) => setbphone(e.target.value)} />
              <div className="bblock">
                <marquee behavior="" direction="" className="marquee">
                  Currently, the delivery location is available for some areas
                </marquee>
                <div className="area">
                  <div className="area1">
                    <label htmlFor="area" className="label">
                      Select Area:
                    </label>
                    <select name="area" id="area" value={selectedArea} onChange={handleAreaChange}>
                      <option value="">Select Area</option>
                      {Object.keys(areaPlaceMapping).map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="area2">
                    <label htmlFor="place" className="label">
                      Select Place:
                    </label>
                    <select name="place" id="place" value={selectedPlace} onChange={(e) => setSelectedPlace(e.target.value)}>
                      <option value="">Select Place</option>
                      {places.map((place) => (
                        <option key={place} value={place}>
                          {place}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button id="save" onClick={handleSave}>
                    Save
                  </button>
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
            <div className="dvalues" style={{ display: save ? "flex" : "none" }}>
              <p id="bname">{bname}</p>
              <p id="bphone">{bphone}</p>
              <p id="bloc">{`${selectedArea}, ${selectedPlace}`}</p>
            </div>
          </div>
        </div>
     

        <div className="card2">
        
          <div className="bitem">
            <p id="btype">
              You are buying <strong>{bcount} {btype}</strong> palmyra fruits
            </p>
         
            <div className="bimg">
              <img src={bpath} alt="hi" />
            </div>
            <div className="bill">
              <p id="tbill">BILL DETAILS </p>
              <hr />
              <p>Item Total</p>
              <p>Platform Fee</p>
              <p className="gst">Transport Charges</p>
              <hr />
              <p>TOTAL PAY</p>
              <div className="values">
                <p id="itemcost"><PiCurrencyInr />{itemprice}</p>
                <p id="platform"><PiCurrencyInr />3</p>
                <p id="gst"><PiCurrencyInr />10</p>
                <p id="totalcost"><PiCurrencyInr />{tprice}</p>
              </div>
            </div>
            <button 
              id="pay" 
              onClick={handlePay} 
              disabled={isProcessing || isStockChecking || (bcount > availableStock)}
            >
              {isProcessing ? "Processing..." : 
               isStockChecking ? "Checking Stock..." : "PAY NOW"}
            </button>
          </div>
        </div>
      </div>
      <PaymentComponent
        ref={paymentRef}
        amount={tprice}
        productName={btype}
        description={`Purchase of ${bcount} ${btype}`}
        customerEmail={customerEmail}
        customerPhone={bphone}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
};

export default Buy;