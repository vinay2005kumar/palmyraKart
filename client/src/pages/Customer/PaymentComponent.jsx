import React, { forwardRef, useImperativeHandle, useState } from 'react';
import axios from 'axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PaymentComponent = forwardRef(({ amount, productName, description, customerEmail, customerPhone, onPaymentSuccess }, ref) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const url = 'https://palmyra-fruit.onrender.com/api/user';
  //const url = "http://localhost:4000/api/user";
  const isMobile = window.innerWidth <= 765;

  const toastfun = (msg, type, toastId = 'default-toast') => {
    if (!toast.isActive(toastId)) {
      // Calculate approximate dimensions based on message length
      const messageLength = msg.length;
      const lineLength = isMobile ? 30 : 50; // Characters per line
      const lines = Math.ceil(messageLength / lineLength);
      
      // Calculate dynamic dimensions
      const minWidth = isMobile ? '80vw' : '30vw';
      const maxWidth = isMobile ? '90vw' : '40vw';
      const baseHeight = isMobile ? '10vh' : '10vh';
      const lineHeight = '1.5rem';
      const padding = 20; // px
      
      const dynamicHeight = `calc(${baseHeight} + ${Math.max(0, lines - 3)} * ${lineHeight})`;
      
      toast[type](msg, {
        position: 'top-right',
        autoClose: 3000,
        toastId,
        style: {
          position: 'absolute',
          top: isMobile ? '6vh' : '7vh',
          left: isMobile ? '5%' : 'auto',
          right: isMobile ? '5%' : '20px',
          minWidth: minWidth,
          maxWidth: maxWidth,
          width: 'auto', // Let it grow based on content
          height: 'auto', // Let it grow based on content
          minHeight: baseHeight,
          fontSize: '1.2rem',
          padding: '10px',
          whiteSpace: 'pre-wrap', // Preserve line breaks and wrap text
          wordWrap: 'break-word', // Break long words
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      });
    }
  };

  useImperativeHandle(ref, () => ({
    initiatePayment: async (buyComponentData) => {
      try {
        setLoading(true);
        setError(null);

        const { bname, btype, bcount, tprice, baddress, bphone2, generateOrderId, navigate, userId } = buyComponentData;

        // Load Razorpay SDK
        const res = await loadRazorpay();
        if (!res) {
          throw new Error('Razorpay SDK failed to load');
        }

        const finalAmount = tprice || amount;
        const orderId = generateOrderId();

        // Create order on the server
        const orderData = await axios.post(
          `${url}/create-order`,
          {
            amount: finalAmount * 100,
            currency: 'INR',
            productName: btype,
            description: `Purchase of ${bcount} ${btype}`,
            address: baddress,
            phone: bphone2,
            items: [{
              itemType: btype,
              itemName: 'Palmyra Fruit',
              quantity: bcount,
              price: tprice,
              imagePath: buyComponentData.bpath,
            }],
            paymentMethod: 'Credit Card',
            finalAmount: finalAmount,
            user: userId,
            orderId,
          },
          { withCredentials: true }
        );

        const { id: razorpayOrderId, amount: orderAmount, currency } = orderData.data;

        // Razorpay options
        const options = {
          key: import.meta.env.VITE_APP_RAZORPAY_KEY_ID,
          amount: orderAmount,
          currency,
          name: 'Palmyra Fruits',
          description: `Purchase of ${bcount} ${btype}`,
          order_id: razorpayOrderId,
          handler: async function (response) {
            try {
              const paymentData = {
                orderCreationId: orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              };

              const result = await axios.post(`${url}/verify`, paymentData, { withCredentials: true });

              if (result.data.success) {
                const orderOtp = Math.floor(100000 + Math.random() * 900000).toString();
                await axios.post(`${url}/send-orderOtp`, { oid: orderId, orderOtp }, { withCredentials: true });
                
                toastfun('Payment successful! Check your email for Order OTP', 'success');
                onPaymentSuccess?.(true);
                navigate?.('/order');
              } else {
                throw new Error('Payment verification failed');
              }
            } catch (err) {
              toastfun(err.message || 'Payment verification failed', 'error');
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: bname || 'Customer Name',
            email: customerEmail || '',
            contact: bphone2 || customerPhone || '',
          },
          notes: {
            productName: btype || productName,
            quantity: bcount || 1,
          },
          theme: { color: '#3399cc' },
          modal: {
            ondismiss: () => setLoading(false),
          },
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();

        paymentObject.on('payment.failed', function (response) {
          toastfun(`Payment failed: ${response.error.description}`, 'error');
          setLoading(false);
        });

      } catch (error) {
        toastfun(error.message || 'Error initiating payment', 'error');
        setLoading(false);
      }
    },
  }));

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
        return resolve(true);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  return (
    <>
      {loading && <LoadingSpinner />}
      <ToastContainer />
    </>
  );
});

export default PaymentComponent;