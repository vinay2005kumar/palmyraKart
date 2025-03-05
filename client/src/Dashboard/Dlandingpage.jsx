import React, { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import Dhome from './Dhome'; 
import Dorders from './Dorders'; // Import your orders component
import Dauth from './Dauth'; // Import your authentication component
import Ddelivered from './Ddelivered'; // Import delivered orders component
import Expired from './Expired'; 
import AuthPage from '../components/AuthForm';
import { useAuth } from '../components/AuthContext';
import Dreviews from './Dreviews'
const Dlandingpage = () => {
  const[dkart,setdkart]=useState()
  const [orderDetails, setOrderDetails] = useState(null);
  // Callback function to receive order details from Dorders
  const handleOrderDetails = (details) => {
    setOrderDetails(details);
    console.log('lading',details)
  };
  const handleiskartOpen=()=>{

    setdkart(prev=>!prev)
    console.log('dlanding kart',dkart)
  }
  return (
    <div>
      <Routes>
        <Route path='/dhome' element={<Dhome onKartOpen={handleiskartOpen}/>} />
        <Route path='/dorders' element={<Dorders onOrderDetails={handleOrderDetails} />} />
        <Route path='/dauth' element={<Dauth />} />
        <Route path='/delivered' element={<Ddelivered />} />
        <Route path='/expired' element={<Expired />} />
        <Route path='/dreviews' element={<Dreviews />} />
        <Route path="/components/AuthPage" element={<AuthPage />} />
      </Routes>
{/* 
      {orderDetails && (
        <div>
          <h2>Order Details:</h2>
          <pre>{JSON.stringify(orderDetails, null, 2)}</pre>
        </div>
      )} */}
    </div>
  );
};

export default Dlandingpage;
