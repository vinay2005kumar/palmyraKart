import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import LoadingSpinner from './LoadingSpinner'; // Import the LoadingSpinner

const PaymentComponent = forwardRef(({ amount, productName, description, customerEmail, customerPhone, onPaymentSuccess }, ref) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const url = 'http://localhost:4000/api/user';

  useImperativeHandle(ref, () => ({
    initiatePayment: async (buyComponentData) => {
      try {
        setLoading(true); // Show loading spinner
        setError(null);

        const {
          bname,
          btype,
          bcount,
          tprice,
          baddress,
          bphone2,
          generateOrderId,
          toastfun,
          navigate,
        } = buyComponentData;

        // Load Razorpay SDK
        const res = await loadRazorpay();
        if (!res) {
          setError('Razorpay SDK failed to load. Check your internet connection.');
          toastfun?.('Razorpay SDK failed to load. Check your internet connection.', 'error');
          setLoading(false);
          return;
        }

        const finalAmount = tprice || amount;
        const orderId = generateOrderId ? generateOrderId() : 'order_' + Date.now().toString();

        // Create order on the server
        const orderData = await axios.post(
          `${url}/create-order`,
          {
            amount: finalAmount * 100, // Convert to paise
            currency: 'INR',
            productName: btype,
            description: `Purchase of ${bcount} ${btype}`,
            address: baddress,
            phone: bphone2,
            items: [
              {
                itemType: btype,
                itemName: 'Palmyra Fruit',
                quantity: bcount,
                price: tprice,
                imagePath: buyComponentData.bpath,
              },
            ],
            paymentMethod: 'Credit Card',
            finalAmount: finalAmount,
            user: buyComponentData.userId,
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

                // Send OTP
                const sendotp = await axios.post(
                  `${url}/send-orderOtp`,
                  {
                    oid: orderId,
                    orderOtp
                  },
                  { withCredentials: true }
                );

                if (sendotp.data.success) {
                  toastfun?.('Payment successful! Check your email for Order OTP', 'success');
                } else {
                  toastfun?.('Payment successful but error in OTP sending. Your order is confirmed.', 'info');
                }
                onPaymentSuccess?.(true);
                navigate?.('/order');
              } else {
                setError('Payment verification failed');
                toastfun?.('Payment verification failed', 'error');
              }
            } catch (err) {
              setError('Payment verification failed: ' + err.message);
              toastfun?.('Payment verification failed: ' + err.message, 'error');
            } finally {
              setLoading(false); // Hide loading spinner
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
            ondismiss: function () {
              setLoading(false); // Hide loading spinner
            },
          },
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();

        paymentObject.on('payment.failed', function (response) {
          setError(`Payment failed: ${response.error.description}`);
          toastfun?.(`Payment failed: ${response.error.description}`, 'error');
          setLoading(false); // Hide loading spinner
        });
      } catch (error) {
        setError('Error initiating payment: ' + error.message);
        toastfun?.('Error initiating payment: ' + error.message, 'error');
        setLoading(false); // Hide loading spinner
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
      {loading && <LoadingSpinner />} {/* Show loading spinner when processing */}
    </>
  );
});

export default PaymentComponent;