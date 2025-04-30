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
      style: {
        width: isMobile ? '80vw' : '400px',
        fontSize: isMobile ? '14px' : '16px'
      }
    });
  };

  const handleError = (error) => {
    console.error('Payment error details:', error);
    const message = error.response?.data?.error || error.message || 'Payment failed';
    showToast(message, 'error');
    setLoading(false); // Ensure loading state is reset on error
  };

  const calculateActualQuantity = (item) => {
    return item.itemType?.toLowerCase() === 'dozen' ? item.quantity * 12 : item.quantity;
  };

  const releaseInventory = async (orderId, items) => {
    try {
      const quantity = items.reduce((sum, item) => sum + calculateActualQuantity(item), 0);
      await axios.post(`${url}/release-inventory`, { orderId, quantity }, { withCredentials: true });
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

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        let orderPayload = null;

        // STEP 1: Generate Razorpay Order (no DB save here)
        const razorpayOrderRes = await axios.post(`${url}/generate-razorpay-order`, {
          amount: 5 * 100
        }, { withCredentials: true });

        const razorpayOrderId = razorpayOrderRes.data.razorpayOrderId;

        // Prepare order payload - moved outside the handler for access in ondismiss
        orderPayload = {
          amount: 5 * 100,
          totalAmount: tprice,
          finalAmount: 5,
          tax: 0,
          shippingCost: 0,
          discount: 0,
          productName: btype,
          description: `Purchase of ${bcount} ${btype}`,
          shippingAddress: {
            street: baddress || '',
            phoneNumber: bphone2 || ''
          },
          items: [{
            itemType: btype,
            itemName: 'Palmyra Fruit',
            quantity: bcount,
            price: tprice,
            imagePath: bpath || ''
          }],
          paymentMethod: 'Credit Card',
          date: new Date().toISOString(),
          otp,
          orderId: generateOrderId(),
          user: { id: userId }
        };

        const rzp = new window.Razorpay({
          key: import.meta.env.VITE_APP_RAZORPAY_KEY_ID,
          amount: 5 * 100,
          currency: 'INR',
          order_id: razorpayOrderId,
          name: 'Your Business',
          description: `Purchase of ${bcount} ${btype}`,
          handler: async function (response) {
            try {
              // Add razorpay details to order payload
              orderPayload.razorpayPaymentId = response.razorpay_payment_id;
              orderPayload.razorpayOrderId = response.razorpay_order_id;
              orderPayload.razorpaySignature = response.razorpay_signature;

              // STEP 2: Create actual Order in DB after successful payment
              let orderResponse;
              try {
                orderResponse = await axios.post(`${url}/create-order`, orderPayload, { withCredentials: true });
              } catch (error) {
                if (error.response) {
                  showToast(`Error creating order: ${error.response.data.message || 'An error occurred while creating the order'}`, 'error');
                } else if (error.request) {
                  showToast('Error: Network issue or server is down when creating the order', 'error');
                } else {
                  showToast(`Error: ${error.message}`, 'error');
                }
                setLoading(false); // Stop loading if there's an error
                return;
              }

              // STEP 3: Verify payment
              const verification = await axios.post(`${url}/verify-payment`, {
                orderCreationId: orderPayload.orderId,
                razorpayOrderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                amount: 5 * 100,
                items: orderPayload.items
              }, { withCredentials: true });

              if (verification.data.success) {
                rzp.close();
                setLoading(false); // Reset loading state after successful payment
                showToast('Payment successfully verified!', 'success');

                await axios.post(`${url}/send-orderOtp`, {
                  oid: orderPayload.orderId,
                  orderOtp: otp
                }, { withCredentials: true });

                if (onPaymentSuccess) {
                  onPaymentSuccess({
                    orderId: orderPayload.orderId,
                    paymentId: response.razorpay_payment_id,
                    amount: tprice
                  });
                }

                if (navigate) {
                  navigate('/order', {
                    state: {
                      orderId: orderPayload.orderId,
                      paymentId: response.razorpay_payment_id
                    }
                  });
                }
              } else {
                await releaseInventory(orderPayload.orderId, orderPayload.items);
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
              setLoading(false); // Reset loading state when modal is dismissed
              showToast('Payment was cancelled', 'info');
              
              // Only attempt to release inventory if we have an orderId
              if (orderPayload && orderPayload.orderId) {
                await releaseInventory(orderPayload.orderId, orderPayload.items);
              }
            }
          }
        });

        rzp.on('payment.failed', async (response) => {
          showToast(`Payment failed: ${response.error.description}`, 'error');
          setLoading(false); // Reset loading state on payment failure
          
          // Only attempt operations if we have an orderId
          if (orderPayload && orderPayload.orderId) {
            await releaseInventory(orderPayload.orderId, orderPayload.items);
            try {
              await axios.delete(`${url}/deleteOrder/${orderPayload.orderId}`);
              console.log('Order deleted due to payment failure');
            } catch (deleteError) {
              console.error('Failed to delete order after payment failure:', deleteError);
            }
          }
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
      setLoading(false); // Reset loading state when payment is closed
    }
  }));

  return (
    <>
      {loading && <LoadingSpinner />}
      <ToastContainer />
    </>
  );
});

export default PaymentComponent;