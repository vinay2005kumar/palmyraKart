// src/components/FruitLoader/FruitLoader.jsx
import React from 'react';
import './FruitLoader.css';

const FruitLoader = ({ message = "Loading..." }) => {
  return (
    <div className="palyra-loader-overlay">
      <div className="palyra-spinner-wrapper">
        <div className="palyra-spinner-circle"></div>
      </div>
      <div className="palyra-loader-content">
        <h3 className="palyra-loader-message">{message}</h3>
        <p className="palyra-loader-tagline">Palyra Fruits - Fresh From Nature</p>
      </div>
    </div>
  );
};

export default FruitLoader;