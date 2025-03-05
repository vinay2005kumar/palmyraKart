// client/src/components/PhonePePayment.js
import React, { useState } from 'react';
import axios from 'axios';

const PhonePePayment = () => {
    const [amount, setAmount] = useState(0);
    const [orderId, setOrderId] = useState('');

    const initiatePayment = async () => {
        try {
            const response = await axios.post('/api/phonepe/initiatePayment', { amount, orderId });
            if (response.data.success) {
                // Redirect user to PhonePe payment gateway
                window.location.href = response.data.instrumentResponse.redirectUrl;
            } else {
                console.error('Payment initiation failed:', response.data);
            }
        } catch (error) {
            console.error('Error initiating payment:', error);
        }
    };

    const checkPaymentStatus = async () => {
        try {
            const response = await axios.post('/api/phonepe/checkStatus', { orderId });
            console.log('Payment status:', response.data);
        } catch (error) {
            console.error('Error checking payment status:', error);
        }
    };

    return (
        <div>
            <input
                type="text"
                placeholder="Order ID"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
            />
            <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
            />
            <button onClick={initiatePayment}>Pay with PhonePe</button>
            <button onClick={checkPaymentStatus}>Check Payment Status</button>
        </div>
    );
};

export default PhonePePayment;
