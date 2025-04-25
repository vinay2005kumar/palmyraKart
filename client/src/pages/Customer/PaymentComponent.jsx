import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadingSpinner from '../../components/LoadingSpinner';

const PaymentComponent = forwardRef(({ onPaymentSuccess }, ref) => {
  const [loading, setLoading] = useState(false);
  const [rzpInstance, setRzpInstance] = useState(null);
  const isMobile = window.innerWidth <= 765;
  const url = 'https://palmyra-fruit.onrender.com/api/user';
  // const url = "http://localhost:4000/api/user";

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      window.RazorpayLoaded = true;
    };
    script.onerror = () => showToast('Failed to load payment gateway', 'error');
    document.body.appendChild(script);

    return () => {
      if (rzpInstance) {
        rzpInstance.close();
      }
      document.body.removeChild(script);
      window.RazorpayLoaded = false;
    };
  }, []);

  const showToast = (msg, type) => {
    toast[type](msg, {
      position: "top-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      style: {
        width: isMobile ? '80vw' : '400px',
        fontSize: isMobile ? '14px' : '16px'
      }
    });
  };

  const handleError = (error) => {
    console.error('Payment error details:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });

    let message = error.message || 'Payment processing failed';

    if (error.response?.data?.code === 'OUT_OF_STOCK') {
      message = 'Item is out of stock. Please try again later.';
    } else if (error.response?.data?.code === 'ORDER_CREATION_FAILED') {
      message = 'Failed to create order. Please try again.';
    } else if (error.response?.data?.code === 'VERIFICATION_FAILED') {
      message = 'Payment verification failed. Please contact support.';
    } else if (error.response?.data?.error) {
      message = error.response.data.error;
    }

    showToast(message, 'error');
    setLoading(false);
  };

  const calculateActualQuantity = (item) => {
    if (item.itemType && item.itemType.toLowerCase() === 'dozen') {
      return item.quantity * 12;
    }
    return item.quantity;
  };

  const releaseInventory = async (orderId, items) => {
    try {
      const quantity = items.reduce((sum, item) => sum + calculateActualQuantity(item), 0);
      await axios.post(
        `${url}/release-inventory`,
        { orderId, quantity },
        { withCredentials: true }
      );
    } catch (error) {
      console.error('Failed to release inventory:', error);
    }
  };

  useImperativeHandle(ref, () => ({
    initiatePayment: async (buyComponentData) => {
      if (!window.RazorpayLoaded) {
        showToast('Payment gateway loading. Please wait...', 'warning');
        return;
      }

      try {
        setLoading(true);

        const {
          bname,
          btype,
          bcount,
          tprice,
          baddress,
          bphone2,
          generateOrderId,
          navigate,
          userId,
          customerEmail,
          bpath
        } = buyComponentData;

        const orderPayload = {
          amount: tprice * 100,
          totalAmount: tprice,
          tax: 0,
          shippingCost: 0,
          discount: 0,
          finalAmount: tprice,
          productName: btype,
          description: `Purchase of ${bcount} ${btype}`,
          shippingAddress: {
            street: baddress || '',
            city: '',
            state: '',
            country: '',
            zipCode: '',
            phoneNumber: bphone2 || ''
          },
          items: [{
            itemType: btype,
            itemName: 'Palmyra Fruit',
            quantity: bcount,
            price: tprice,
            imagePath: bpath || '',
          }],
          paymentMethod: 'Credit Card',
          date: new Date().toISOString(),
          otp: Math.floor(100000 + Math.random() * 900000).toString(),
          orderId: generateOrderId(),
          user: {
            id: userId
          }
        };

        const orderResponse = await axios.post(
          `${url}/create-order`,
          orderPayload,
          { withCredentials: true }
        );

        if (!orderResponse.data.success) {
          throw new Error(orderResponse.data.error || 'Order creation failed');
        }

        const rzp = new window.Razorpay({
          key: import.meta.env.VITE_APP_RAZORPAY_KEY_ID,
          amount: orderResponse.data.finalAmount * 100,
          currency: 'INR',
          order_id: orderResponse.data.razorpayOrderId,
          name: 'Your Business',
          description: `Purchase of ${bcount} ${btype}`,
          handler: async function (response) {
            try {
              rzp.modal = {
                ondismiss: () => false,
                escape: false,
                backdropclose: false
              };

              const verification = await axios.post(
                `${url}/verify-payment`,
                {
                  orderCreationId: orderResponse.data.orderId,
                  razorpayOrderId: orderResponse.data.razorpayOrderId,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  amount: orderResponse.data.finalAmount * 100,
                  items: orderResponse.data.items
                },
                { withCredentials: true }
              );

              if (verification.data.success) {
                rzp.close();
                showToast('Payment successfully verified!', 'success');
                // Send OTP after successful verification
                await axios.post(
                  `${url}/send-orderOtp`,
                  {
                    oid: orderResponse.data.orderId,
                    orderOtp: orderPayload.otp // The OTP you generated earlier
                  },
                  { withCredentials: true }
                );
                if (onPaymentSuccess) {
                  onPaymentSuccess({
                    orderId: orderResponse.data.orderId,
                    paymentId: response.razorpay_payment_id,
                    amount: tprice
                  });
                }

                if (navigate) {
                  navigate('/order', {
                    state: {
                      orderId: orderResponse.data.orderId,
                      paymentId: response.razorpay_payment_id
                    }
                  });
                }
              } else {
                await releaseInventory(orderResponse.data.orderId, orderPayload.items);
                throw new Error(verification.data.error || 'Verification failed');
              }
            } catch (error) {
              handleError(error);
              rzp.close();
            }
          },
          prefill: {
            name: bname || 'Customer',
            email: customerEmail || '',
            contact: bphone2 || ''
          },
          theme: { color: '#3399cc' },
          modal: {
            ondismiss: async () => {
              showToast('Payment was cancelled', 'info');
              await releaseInventory(orderResponse.data.orderId, orderPayload.items);
              setLoading(false);
            }
          }
        });

        rzp.on('payment.failed', async (response) => {
          showToast(`Payment failed: ${response.error.description}`, 'error');
          await releaseInventory(orderResponse.data.orderId, orderPayload.items);
          setLoading(false);
        });

        rzp.open();
        setRzpInstance(rzp);

      } catch (error) {
        handleError(error);
      }
    },
    closePayment: () => {
      if (rzpInstance) {
        rzpInstance.close();
        setRzpInstance(null);
      }
      setLoading(false);
    }
  }));

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      {loading && <LoadingSpinner />}
      <ToastContainer />
    </>
  );
});

export default PaymentComponent;