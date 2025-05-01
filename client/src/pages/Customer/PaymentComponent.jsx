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
  //const url = "http://localhost:4000/api/user";

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
      console.log(`Inventory released for order ${orderId}`);
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
          tprice, // Use the actual price from buyComponentData
          baddress,
          bphone2,
          generateOrderId,
          navigate,
          userId,
          customerEmail,
          bpath
        } = buyComponentData;

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Generate order ID once and use it consistently
        const orderId = generateOrderId();
        
        // Calculate amount in paisa (Razorpay expects amount in smallest currency unit)
        const amountInPaisa = Math.round(2 * 100);
        
        // STEP 1: Generate Razorpay Order (backend only creates a Razorpay order, not DB entry)
        const razorpayOrderRes = await axios.post(
          `${url}/generate-razorpay-order`, 
          { amount: amountInPaisa }, 
          { withCredentials: true }
        );

        const razorpayOrderId = razorpayOrderRes.data.razorpayOrderId;
        console.log('Razorpay order created:', razorpayOrderId);

        // Prepare order payload
        const orderPayload = {
          amount: amountInPaisa,
          totalAmount: tprice,
          finalAmount: amountInPaisa,
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
            price: tprice , // Calculate per-item price
            imagePath: bpath || ''
          }],
          paymentMethod: 'Credit Card',
          date: new Date().toISOString(),
          otp,
          orderId, // Use the consistently generated orderId
          user: { id: userId }
        };

        // Initialize Razorpay interface
        const rzp = new window.Razorpay({
          key: import.meta.env.VITE_APP_RAZORPAY_KEY_ID,
          amount: amountInPaisa,
          currency: 'INR',
          order_id: razorpayOrderId,
          name: 'Your Business',
          description: `Purchase of ${bcount} ${btype}`,
          handler: async function (response) {
            try {
              console.log('Payment successful, creating order in DB');
              
              // Add razorpay details to order payload
              orderPayload.razorpayPaymentId = response.razorpay_payment_id;
              orderPayload.razorpayOrderId = response.razorpay_order_id;
              orderPayload.razorpaySignature = response.razorpay_signature;

              // STEP 2: Create actual Order in DB after successful payment
              let orderResponse;
              try {
                orderResponse = await axios.post(`${url}/create-order`, orderPayload, { withCredentials: true });
                console.log('Order created in DB:', orderResponse.data);
              } catch (error) {
                if (error.response) {
                  showToast(`Error creating order: ${error.response.data.error || 'An error occurred while creating the order'}`, 'error');
                } else if (error.request) {
                  showToast('Error: Network issue or server is down when creating the order', 'error');
                } else {
                  showToast(`Error: ${error.message}`, 'error');
                }
                setLoading(false);
                return;
              }

              console.log('Verifying payment for order ID:', orderId);
              
              // STEP 3: Verify payment
              const verification = await axios.post(`${url}/verify-payment`, {
                orderCreationId: orderId, // Use consistent orderId
                razorpayOrderId: response.razorpay_order_id, // Use response value
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                amount: amountInPaisa, // Use calculated amount
                items: orderPayload.items
              }, { withCredentials: true });

              console.log('Payment verification response:', verification.data);

              if (verification.data.success) {
                rzp.close();
                setLoading(false);
                showToast('Payment successfully verified!', 'success');

                // STEP 4: Send OTP in a separate try-catch to ensure it doesn't block success flow
                try {
                  console.log('Sending order OTP for order:', orderId);
                  const otpResponse = await axios.post(`${url}/send-orderOtp`, {
                    oid: orderId, // Use consistent orderId
                    orderOtp: otp
                  },{ withCredentials: true });
                  console.log('OTP sent successfully:', otpResponse.data);
                } catch (otpError) {
                  console.error('OTP sending failed:', otpError);
                  showToast('Payment successful but OTP sending failed', 'warning');
                  // Continue with success flow even if OTP fails
                }

                // Callback and navigation on success
                if (onPaymentSuccess) {
                  onPaymentSuccess({
                    orderId: orderId,
                    paymentId: response.razorpay_payment_id,
                    amount: amountInPaisa
                  });
                }
                  
                if (navigate) {
                  navigate('/order', {
                    state: {
                      orderId: orderId,
                      paymentId: response.razorpay_payment_id
                    }
                  });
                }
              } else {
                // If verification fails, release inventory and show error
                await releaseInventory(orderId, orderPayload.items);
                throw new Error(verification.data.error || 'Verification failed');
              }
            } catch (error) {
              console.error('Payment process error:', error);
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
              setLoading(false);
              showToast('Payment was cancelled', 'info');

              // Release inventory if order was created but payment was dismissed
              await releaseInventory(orderId, orderPayload.items);
            }
          }
        });

        rzp.on('payment.failed', async (response) => {
          showToast(`Payment failed: ${response.error.description}`, 'error');
          setLoading(false);

          await releaseInventory(orderId, orderPayload.items);
          try {
            // Clean up the order if payment failed
            await axios.delete(`${url}/deleteOrder/${orderId}`);
            console.log('Order deleted due to payment failure');
          } catch (deleteError) {
            console.error('Failed to delete order after payment failure:', deleteError);
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
      setLoading(false);
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