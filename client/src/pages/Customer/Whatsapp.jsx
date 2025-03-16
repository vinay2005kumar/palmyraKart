import React, { useState, useRef, useEffect } from 'react';
import { RxCrossCircled } from "react-icons/rx";
const Whatsapp = () => {
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: 30, y: window.innerHeight - 230 });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 765); // Track if it's a mobile device
  const dragRef = useRef(null);

  // Update the `isMobile` state dynamically based on window size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 765);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle mouse down event (start dragging)
  const handleMouseDown = (e) => {
    if (!isMobile) return; // Only enable dragging on mobile

    const offsetX = e.clientX - position.x;
    const offsetY = e.clientY - position.y;

    setDragging(true);
    dragRef.current = { offsetX, offsetY }; // Store the offset for dragging
  };

  // Handle mouse move event (dragging in progress)
  const handleMouseMove = (e) => {
    if (dragging) {
      setPosition({
        x: e.clientX - dragRef.current.offsetX,
        y: e.clientY - dragRef.current.offsetY,
      });
    }
  };

  // Handle mouse up event (stop dragging)
  const handleMouseUp = () => {
    setDragging(false);
  };

  // Handle touch start event (start dragging)
  const handleTouchStart = (e) => {
    if (!isMobile) return; // Only enable dragging on mobile

    const offsetX = e.touches[0].clientX - position.x;
    const offsetY = e.touches[0].clientY - position.y;

    setDragging(true);
    dragRef.current = { offsetX, offsetY }; // Store the offset for dragging
  };

  // Handle touch move event (dragging in progress)
  const handleTouchMove = (e) => {
    if (dragging) {
      setPosition({
        x: e.touches[0].clientX - dragRef.current.offsetX,
        y: e.touches[0].clientY - dragRef.current.offsetY,
      });
    }
  };

  // Handle touch end event (stop dragging)
  const handleTouchEnd = () => {
    setDragging(false);
  };
  const handledisplay=()=>{
    document.getElementById('wmsg').style.display='none'
  }

  useEffect(() => {
    // Add event listeners for mouse and touch events
    if (isMobile) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      // Clean up event listeners when the component unmounts
      if (isMobile) {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [dragging, isMobile]);
  const bounceKeyframes = `
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-15px);
    }
    60% {
      transform: translateY(-7px);
    }
  }
`;
  return (
    <>
     <style>
        {bounceKeyframes}
      </style>
    <div
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        position: 'absolute',
        left: position.x,
        width:isMobile?'50%':'30%',
        top: position.y,
        cursor: dragging ? 'grabbing' : 'grab', // Switch cursor between grabbing and grab
        touchAction: 'none', // Prevent default touch behavior on mobile
        userSelect: 'none', // Prevent text selection
        zIndex: 1000, // Make sure it stays above other elements
        animation: 'bounce 2s infinite', // Apply the bounce effect
      }}
    >
      <div style={{
    width:isMobile?'100%':'100%',
    height: 'auto',
    border: '1px solid black',
    padding: '10px',

    backdropFilter: 'blur(15px)',
    borderRadius: '10px', // Optional styling for rounded corners
    background: 'rgba(255, 255, 255, 0.8)',
  }} id='wmsg'>
    <RxCrossCircled style={{ position: 'absolute', right: '0em', fontSize: '2em', cursor: 'pointer',top:'0em'}} onClick={handledisplay} />
    <p>
      Have a question or want to know more about fresh Palmyra fruits? 
      <strong> Contact us on WhatsApp!</strong> We're here to assist you.
    </p>
  </div>
      <a href="https://wa.me/9704089217" target="_blank" rel="noopener noreferrer">
        <img
          src="whatsapp.png"
          alt="Start a chat on WhatsApp"
          style={{
            width: isMobile ? '60px' : '60px', // Set a fixed size
            height: '60px', // Fixed height to maintain aspect ratio
            maxWidth: '100px', // Optional max width to prevent stretching
            maxHeight: '100px', // Optional max height to prevent stretching
          }}
        />
      </a>
    </div>
    </>
  );
};

export default Whatsapp;
