import React from 'react';
import './GoogleLoader.css'; // Assuming you'll create a CSS file

const GoogleLoader = ({ text = "Loading..." }) => {
  return (
    <div className="loader-container">
      <div className="spinner"></div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default GoogleLoader;