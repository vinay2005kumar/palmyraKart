import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import About from './About';
import Topbar from './Topbar';
import Order from './Order';
import AuthPage from './AuthForm';
import OrderMenu from './OrderMenu';
import Buy from './Buy';
import Reviews from './Reviews';
import './LandingPage.css';
import Dhome from '../Dashboard/Dhome';
import { useAuth } from './AuthContext'; // Assuming this provides authentication info


const Landingpage = () => {
  const {isAuthenticated, admin } = useAuth(); // Get limit, authentication status, and admin status
  const [lcount, setlcount] = useState(0);
  const [ltotal, setltotal] = useState(0);
  const [lsrc, setlsrc] = useState('');
  const [ltype, setltype] = useState('');
  const [lquantity, setlquantity] = useState(0);
  const [llimit, setllimit] = useState();
  const [order, setorder] = useState(false);
  const[lmenu,setlmenu]=useState()
  const url = 'https://palmyra-fruit.onrender.com/api/user';
  //const url = 'http://localhost:4000/api/user';
 
  //----------------------------change next
  const handlelimit = async () => {
    try {
      const res = await axios.get(`${url}/get`);
  
      const user= res.data.user;
      // console.log('user',user)
        const limit = user.limit;
        setllimit(limit);
        // console.log('land', limit,isadmin);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handlebuy = (count, total, src, type) => {
    setlcount(count);
    setltotal(total);
    setlsrc(src);
    setltype(type);
    setlmenu(true)
    // console.log('landing', lcount, ltotal);
  };

  const handlequantity = async () => {
    try {
      const response = await axios.get(`${url}/quantity`);
      if (response.status === 200) {
        const count = response.data.totalPieces || 0;
        setlquantity(count); // Correctly set lquantity
        // console.log('land count',count)
        return count; // Return the quantity value
      }
    } catch (error) {
      console.error('Error fetching quantity:', error);
    }
  };
  const handlePaymentSuccessfull = (s) => {
    if (s) {
      setorder(true);
    } else {
      setorder(false);
    }
  };

  useEffect(() => {
    handlelimit();
    handlequantity(); 
    console.log('land',admin)
  },[order]);
  
  useEffect(() => {
    handlelimit();
    handlequantity(); 
    console.log('land',admin)
  },[]);

  return (
    <div>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/home' element={<Home />} />
        <Route path='/about' element={<About />} />
        <Route path='/order' element={<Order order2={order} resetOrder={() => setorder(false)} />} />
        <Route path='/auth' element={<AuthPage />} />
        <Route path='/ordermenu' element={<OrderMenu buy={handlebuy} quantity={handlequantity} llimit2={llimit} />} />
        {/* Redirect to /auth if not authenticated */}
        <Route
  path='/buy'
  element={
    !isAuthenticated ? (
      <Navigate to="/auth" />
    ) :!lmenu ? (
      <Navigate to="/ordermenu" />
    ) : (
      <Buy
        count={lcount}
        price={ltotal}
        path={lsrc}
        itemtype={ltype}
        totalcount={lquantity}
        quantity={handlequantity}
        llimit3={llimit}
        handlePaymentSuccess={handlePaymentSuccessfull}
      />
    )
  }
/>

        {/* Redirect to /auth if not authenticated or not an admin */}
        <Route
          path='/Dashboard'
          element={true? (
            <Dhome />
          ) : (
            <Navigate to="/auth" />
          )}
        />
        <Route path='/reviews' element={<Reviews />} />
      
      </Routes>
    </div>
  );
};

export default Landingpage;
