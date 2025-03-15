import React from 'react';
import './LoadingSpinner.css'; // Import the CSS for styling

const LoadingSpinner = () => {
  return (
    <div className="loading-overlay">
      <div className="spinner-container">
        <div className="spinner"></div>
        <p>Processing your payment...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;