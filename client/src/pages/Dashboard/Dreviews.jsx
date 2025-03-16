import React, { useState, useEffect } from "react";
import axios from "axios";
import Dtopbar from "./Dtopbar";
import "./Dreviews.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Dreviews = () => {
  const [allReviews, setAllReviews] = useState([]); // All reviews
  const [selectedReview, setSelectedReview] = useState(null); // Review selected for replying
  const [replyMessage, setReplyMessage] = useState(""); // Reply message
  const isMobile = window.innerWidth < 765;
  const [loading, setLoading] = useState(false);
  const url = 'https://palmyra-fruit.onrender.com/api/user';
 // const url = "http://localhost:4000/api/user"; // Update with your backend URL

  // Generate a consistent background color based on initials
  const generateColorFromInitials = (name) => {
    const initial = name?.charAt(0).toUpperCase() || "U"; // Fallback to 'U' if name is undefined
    const hashCode = Array.from(initial).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = (hashCode * 137) % 360;
    return `hsl(${hue}, 70%, 70%)`;
  };

  // Fetch all reviews from the backend
  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${url}/reviews`);
      const reviews = response.data.reviews || [];
      setAllReviews(reviews.sort((a, b) => new Date(b.date) - new Date(a.date))); // Sort by date
    } catch (error) {
      toastfun("Failed to fetch reviews.", "error");
    }
  };

  // Handle sending a reply email
  const handleReplySubmit = async () => {
    if (!selectedReview || !replyMessage.trim()) {
      toastfun("Reply message cannot be empty.", "warn");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${url}/reviews/reply`, {
        email: selectedReview.email,
        sub: selectedReview.highlight,
        msg: replyMessage,
      });

      if (res.status === 200) {
        toastfun("Email sent successfully.", "success");
        setReplyMessage("");
        setSelectedReview(null);
      }
    } catch (error) {
      toastfun("Error sending email.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting a review
  const handleDelete = async (reviewId) => {
    toast(
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <p style={{ padding: "10px", fontSize: "1.2em", textAlign: "center", color: "#444" }}>
          Do you really want to delete this review?
        </p>
        <button
          onClick={async () => {
            try {
              toast.dismiss()
              const res = await axios.delete(`${url}/reviews/${reviewId}`);
              if (res.status === 200) {

                setAllReviews((prev) => prev.filter((r) => r._id !== reviewId));
                toastfun("Review deleted successfully.", "success");
              }
            } catch (error) {
              toastfun("Failed to delete review.", "error");
            }
          }}
          style={{
            fontSize: "1.1em",
            padding: "8px 20px",
            background: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginTop: "10px",
          }}
        >
          Confirm Delete
        </button>
        <button
          onClick={() => toast.dismiss()}
          style={{
            fontSize: "1.1em",
            padding: "8px 20px",
            background: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginTop: "10px",
          }}
        >
          Cancel
        </button>
      </div>,
      {
        autoClose: false,
        position: "top-center",
        style: {
          width: "100%",
          top: "6em",
          padding: "15px",
          borderRadius: "8px",
          backgroundColor: "#f5f5f5",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        },
      }
    );
  };

  // Toast notification function
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
    });
  };

  // Handle selecting a review for replying
  const handleSelectedReview = (review) => {
    setSelectedReview(review);
    console.log("Selected Review:", review); // Log the selected review
  };

  // Fetch reviews on component mount
  useEffect(() => {
    fetchReviews();
  }, []);

  // Log selectedReview when it changes
  useEffect(() => {
    console.log("Selected Review Updated:", selectedReview);
  }, [selectedReview]);

  return (
    <>
      <Dtopbar />
      <ToastContainer />
      <div className="reviews-section">
        {/* Reply to Review Section */}
        <div className="rsec1">
          <h1>Reply To A Review</h1>
          {selectedReview ? (
            <div className="reply-section">
              <h3>To</h3>
              <p className="to-name">
                <span>Name</span>: <span>{selectedReview.name || "N/A"}</span>
              </p>
              <p className="to-email">
                <span>Email</span>: <span>{selectedReview.email || "N/A"}</span>
              </p>
              <p className="user-msg">
                <span className="rkey">Reply To:</span>
                <span className="rvalue">
                  <strong>{selectedReview.highlight}</strong>
                  <br />
                  {selectedReview.comment}
                </span>
              </p>

              <textarea
                className="reply-msg"
                placeholder="Type your reply here..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
              />
              <button className="submit-reply" onClick={handleReplySubmit} disabled={loading}>
                {loading ? "Sending..." : "Send Reply"}
              </button>
            </div>
          ) : (
            <p style={{ textAlign: "center", fontSize: "1.1em", color: "green" }}>
              Select a review to reply.
            </p>
          )}
        </div>

        {/* All Reviews Section */}
        <div className="rsec2">
          <h1>All Customers' Reviews</h1>
          {allReviews.length === 0 ? (
            <p style={{ textAlign: "center", fontSize: "1.1em", color: "green" }}>No reviews yet.</p>
          ) : (
            allReviews.map((review) => (
              <div className="msg-block" key={review._id}>
                <div className="my-profile my-profile2">
                  <div
                    className="my-img my-img2"
                    style={{
                      backgroundColor: generateColorFromInitials(review.user?.name),
                      color: "white",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: "50%",
                    }}
                  >
                    {review.user?.name?.charAt(0) || "U"}
                  </div>
                  <div className="rname" style={{ textAlign: "start" }}>
                    {review.name || "Unknown User"}
                  </div>
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
                    Date: {review.date ? new Date(review.date).toLocaleDateString() : "N/A"}
                  </p>
                  <div className="reply-button">
                    <span style={{ textAlign: "end" }}>{review.email || "N/A"}</span>
                    <button className="reply" onClick={() => handleSelectedReview(review)}>
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