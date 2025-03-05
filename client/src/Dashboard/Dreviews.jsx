import React, { useState, useEffect } from "react";
import axios from "axios";
import Dtopbar from "./Dtopbar";
import "./Dreviews.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import emailjs from 'emailjs-com';

const Dreviews = () => {
  const [allReviews, setAllReviews] = useState([]); // All reviews
  const [selectedReview, setSelectedReview] = useState(null); // Review selected for replying
  const [replyMessage, setReplyMessage] = useState(""); // Reply message
  const isMobile = window.innerWidth < 765;
  const [message, setMessage] = useState('');
  const url = 'https://palmyra-fruit.onrender.com/api/user';
  //const url = 'http://localhost:4000/api/user';
  const [loading,setloading]=useState(false)
  // Function to generate a consistent background color based on the initials
  const generateColorFromInitials = (name) => {
    const initial = name.charAt(0).toUpperCase(); // Get the first letter and make it uppercase
    const hashCode = Array.from(initial).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = (hashCode * 137) % 360; // Generate a color hue based on the hash code
    return `hsl(${hue}, 70%, 70%)`; // HSL color with a fixed saturation and lightness for consistency
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };
  const handleReplySubmit=async()=>{
    const email=selectedReview.user.email;
    console.log('email',email)
    const msg=message;
    const sub=selectedReview.comment
    setloading(true)
    try {
      const res=await axios.post(`${url}/reviews/reply`,{email,sub,msg})
      const data=res.data;
      if(res.status === 200){
        toastfun('Email sent successfully','success')
        // Optionally clear the message field after sending
        setMessage('');
        console.log('success')
      }
    } catch (error) {
      toastfun('Error sending email',error)
    }
    finally{
      setloading(false)
    } 
  }
  // const handleReplySubmit = (e) => {
  //   setloading(true)
  //   e.preventDefault();
  //   console.log('email',selectedReview.user.email)
  //   // Use EmailJS to send the email
  //   const templateParams = {
  //     to_email:'omonikpaparao@gmail.com',
     
  //     from_email: 'vinaybuttala@gmail.com', 
  //     message: message,
  //     review_message: selectedReview.comment
  //   };

  //   console.log('Template Params:', templateParams);
  //   emailjs.send('service_m33k2v7', 'template_jfvue4k', templateParams, 'lRcEqsNCpIrBwqDWc')
  //     .then(response => {
  //       toastfun('Email sent successfully', 'success');
  //       setMessage('');
  //       setloading(false)
  //     })
  //     .catch(error => {
  //       toastfun('Error sending email', 'error');
  //     });
   
  // };

  const toastfun = (msg, type) => {
    toast[type](msg, {
      position: "top-right",
      autoClose: 3000,
      style: {
        position: "absolute",
        right: "0em",
        top: isMobile ? "4em" : "70px",
        width: isMobile ? "65vw" : "40vw",
        height: isMobile ? "10vh" : "17vh",
        fontSize: isMobile ? "1.1em" : "1.2em",
        padding: "10px",
      },
      onClick: () => {
        toast.dismiss();
      },
    });
  };
  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${url}/reviews`);
      const reviews = response.data.reviews || [];
      if(reviews.length>0)
      setAllReviews(reviews.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      toastfun("Failed to fetch reviews.", "error");
    }
  };
  useEffect(() => {

    fetchReviews();
  }, []);

  const handleReply = (review) => {
    setSelectedReview(review);
  };

  // const handleSubmitReply = () => {
  //   if (!replyMessage) {
  //     toastfun("Reply cannot be empty.", "warn");
  //     return;
  //   }
  //   toastfun("Reply sent successfully!", "success");
  //   setReplyMessage("");
  //   setSelectedReview(null);
  // };

  const handleDelete = async (reviewId) => {
    toast(
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <p style={{ padding: '10px', fontSize: '1.2em', textAlign: 'center', color: '#444' }}>
          Do you really want to delete this review?
        </p>
        <button
          onClick={async () => {
            try {
             const res= await axios.delete(`${url}/reviews/${reviewId}`);
              setAllReviews((prev) => prev.filter((r) => r._id !== reviewId));
              toast.dismiss();
              if(res.status==200){
              toastfun("Review deleted successfully.", "success");
             
              }
              fetchReviews()
            } catch (error) {
              toastfun("Failed to delete review.", "error");
              console.log(error)
            }
          }}
          style={{
            fontSize: '1.1em',
            padding: '8px 20px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px',
            transition: 'background-color 0.3s ease',
            display: 'inline'
          }}
        >
          Confirm Delete
        </button>
        <button
          onClick={() => toast.dismiss()}
          style={{
            fontSize: '1.1em',
            padding: '8px 20px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px',
            transition: 'background-color 0.3s ease',
          }}
        >
          Cancel
        </button>
      </div>,
      {
        autoClose: false,
        position: 'top-center',
        onClick: () => { toast.dismiss() },
        style: {
          width: '100%',
          top: '6em', // Adjusted to position the toast higher
          padding: '15px',
          borderRadius: '8px',
          backgroundColor: '#f5f5f5',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }
      }
    );
  };

  return (
    <>
      <Dtopbar />
      <ToastContainer></ToastContainer>
      <div className="reviews-section">
        {/* Reply to Review Section */}
        <div className="rsec1">
          <h1>Reply To A Review</h1>
          {selectedReview ? (
            <div className="reply-section">
              <h3>To</h3>
              <p className="to-name">
                <span>Name</span>: <span>{selectedReview.user.name}</span>
              </p>
              <p className="to-email">
                <span>Email</span>: <span>{selectedReview.user.email}</span>
              </p>
              <p className="user-msg">
                <span className="rkey">Reply To:</span>
                <span className="rvalue">
                  <strong>{selectedReview.highlight}</strong><br />
                  {selectedReview.comment}
                </span>
              </p>

              <textarea
                className="reply-msg"
                placeholder="Type your reply here..."
                value={message}
                onChange={handleMessageChange}
              />
              <button className="submit-reply" onClick={handleReplySubmit}>
                {loading?'Send Reply...':'Send Reply'}
              </button>
            </div>
          ) : (
            <p style={{ textAlign: 'center', fontSize: '1.1em', color: 'green' }}>Select a review to reply.</p>
          )}
        </div>

        {/* All Reviews Section */}
        <div className="rsec2">
          <h1>All Customers' Reviews</h1>
          {allReviews.length === 0 ? (
            <p style={{ textAlign: 'center', fontSize: '1.1em', color: 'green' }}>No reviews yet.</p>
          ) : (
            allReviews.map((review) => (
              <div className="msg-block" key={review._id}>
                <div className="my-profile my-profile2">
                  <div
                    className="my-img my-img2"
                    style={{
                      backgroundColor: generateColorFromInitials(review.user.name),
                      color: 'white',
          
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRadius: '50%',
                   
                    }}
                  >
                    {review.user.name.charAt(0)}
                  </div>
                  <div className="rname" style={{ textAlign: "start" }}>{review.user.name}</div>
                </div>
                <div className="my-msg my-msg2">
                  <strong>
                    <span className="highlight" style={{ textTransform: "uppercase" }}>
                      {review.highlight}
                    </span>
                  </strong>
                  <span className="stars" style={{ position: "absolute", right: "3em" }}>
                    {[...Array(Number(review.rating))].map((_, index) => (
                      <span key={index}>⭐</span>
                    ))}
                    <span>{review.rating}/5 Star . Rating</span>
                  </span>
                  <p className="comment">{review.comment}</p>
                  <p className="rdate rdate3">
                    Date: {review.date ? new Date(review.date).toLocaleDateString() : 'N/A'}
                  </p>
                  <div className="reply-button">
                    <span style={{ textAlign: 'end' }}>{review.user.email}</span>
                    <button className="reply" onClick={() => handleReply(review)}>
                      Reply
                    </button>
                    <button className="rdel" onClick={() => handleDelete(review._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default Dreviews;
