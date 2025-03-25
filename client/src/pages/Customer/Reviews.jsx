import React, { useState, useEffect } from "react";
import Topbar from '../../components/Topbar';
import "./Reviews.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from '../../context/AuthContext';
import FruitLoader from "../../components/FruitLoader";

const Reviews = () => {
  const [compose, setCompose] = useState(true);
  const [rating, setRating] = useState("");
  const [highlight, setHighlight] = useState("");
  const [description, setDescription] = useState("");
  const [editingReview, setEditingReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const isMobile = window.innerWidth < 765;
  const [activeToastId, setActiveToastId] = useState(null); // Track the active toast ID
  const {
    userDetails,
    reviewDetails,
    allReviews,
    checkAuth,
    fetchReviews,
    addReview,
    updateReview,
    deleteReview,
    isLoading
  } = useAuth();
  const { name, email: userEmail } = userDetails;

  const toastfun = (msg, type, toastId = 'default-toast') => {
    if (!toast.isActive(toastId)) {
      // Calculate approximate dimensions based on message length
      const messageLength = msg.length;
      const lineLength = isMobile ? 30 : 50; // Characters per line
      const lines = Math.ceil(messageLength / lineLength);
      
      // Calculate dynamic dimensions
      const minWidth = isMobile ? '80vw' : '30vw';
      const maxWidth = isMobile ? '90vw' : '40vw';
      const baseHeight = isMobile ? '10vh' : '10vh';
      const lineHeight = '1.5rem';
      const padding = 20; // px
      
      const dynamicHeight = `calc(${baseHeight} + ${Math.max(0, lines - 3)} * ${lineHeight})`;
      
      toast[type](msg, {
        position: 'top-right',
        autoClose: 3000,
        toastId,
        style: {
          position: 'absolute',
          top: isMobile ? '6vh' : '7vh',
          left: isMobile ? '5%' : 'auto',
          right: isMobile ? '5%' : '20px',
          minWidth: minWidth,
          maxWidth: maxWidth,
          width: 'auto', // Let it grow based on content
          height: 'auto', // Let it grow based on content
          minHeight: baseHeight,
          fontSize: '1.2rem',
          padding: '10px',
          whiteSpace: 'pre-wrap', // Preserve line breaks and wrap text
          wordWrap: 'break-word', // Break long words
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      });
    }
  };

  useEffect(() => {
    checkAuth();
    fetchReviews();
  }, []);

  const handleSubmit = async () => {
    if (!rating || !highlight || !description) {
      toastfun("Please fill out all fields before submitting.", "warn");
      return;
    }

    try {
      setLoading(true);
      const reviewData = {
        email: userEmail,
        rating: Number(rating),
        highlight,
        comment: description,
      };

      if (editingReview) {
        await updateReview(editingReview._id, reviewData);
        toastfun("Review updated successfully.", "success");
      } else {
        await addReview(reviewData);
        toastfun("Review added successfully.", "success");
      }

      setRating("");
      setHighlight("");
      setDescription("");
      setEditingReview(null);
      setCompose(true);
    } catch (error) {
      toastfun("Failed to submit review.", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId) => {
    const toastId = `delete-toast-${reviewId}`;

    if (!toast.isActive(toastId)) {
      toast(
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <p style={{ padding: "1em", fontSize: "1.2em", textAlign: "center", color: "#444" }}>
            Do you really want to delete this review?
          </p>
          <button
            onClick={async () => {
              try {
                await deleteReview(reviewId);
                if (toast.isActive(toastId)) {
                  toast.dismiss(toastId);
                }
                toastfun("Review deleted successfully.", "success");
              } catch (error) {
                toastfun("Failed to delete review.", "error");
              }
            }}
            style={{
              width: isMobile ? "40%" : "90%",
              fontSize: "1.1em",
              padding: "8px 10px",
              background: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "10px",
              transition: "background-color 0.3s ease",
            }}
          >
            Confirm Delete
          </button>
        </div>,
        {
          toastId,
          autoClose: false,
          position: "top-center",
          onClick: () => {
            if (toast.isActive(toastId)) {
              toast.dismiss(toastId);
            }
          },
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
    }
  };

  const handleEdit = (review) => {
    setRating(review.rating);
    setHighlight(review.highlight);
    setDescription(review.comment);
    setEditingReview(review);
    setCompose(false);
  };

  const getRandomColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `#${((hash >> 8) & 0x00ffffff).toString(16).padStart(6, "0")}`;
    return color;
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  return (
    <>
      <Topbar />
      <div className="reviews-section">
        {isLoading ? (
          <FruitLoader />
        ) : (
          <>
            <div className="rsec1">
              <h1>My Reviews</h1>
              {compose ? (
                <>
                  {reviewDetails.length === 0 ? (
                    <p style={{ textAlign: "center" }}>No reviews submitted yet.</p>
                  ) : (
                    reviewDetails.map((review) => (
                      <div className="msg-block" key={review._id}>
                        <div className="my-profile">
                          <div
                            className="my-img"
                            style={{
                              backgroundColor: getRandomColor(name),
                              color: "white",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              borderRadius: "50%",
                              fontWeight: "bold",
                            }}
                          >
                            {getInitial(name)}
                          </div>
                          <div className="rname" style={{ textAlign: "start" }}>
                            {name}
                          </div>
                        </div>
                        <div className="my-msg">
                          <strong>
                            <span
                              className="highlight"
                              style={{
                                textTransform: "uppercase",
                              }}
                            >
                              {review.highlight}
                            </span>
                          </strong>
                          <span
                            className="stars"
                            style={{ position: "absolute", right: "2em" }}
                          >
                            {[...Array(Number(review.rating))].map((_, index) => (
                              <span key={index}>⭐</span>
                            ))}
                            <span>{review.rating}/5 Star. Rating</span>
                          </span>
                          <p className="comment">{review.comment}</p>
                          <span className="rdate">
                            Date:{" "}
                            {review.date
                              ? new Date(review.date).toLocaleDateString()
                              : "N/A"}
                          </span>
                          <div className="rbutton">
                            <button
                              onClick={() => handleEdit(review)}
                              className="cedit"
                            >
                              Edit
                            </button>
                            <button onClick={() => handleDelete(review._id)}>
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <button
                    className="compose"
                    onClick={() => {
                      setCompose(false);
                      setEditingReview(null);
                    }}
                  >
                    Compose Review
                  </button>
                </>
              ) : (
                <div className="compose-block">
                  <h2 style={{ color: "green" }}>
                    {editingReview ? "Edit Review" : "Make Your Own Review"}
                  </h2>
                  <input
                    type="number"
                    className="highlight-msg"
                    placeholder="Rating (1-5)"
                    value={rating}
                    max={5}
                    onChange={(e) =>
                      setRating(
                        e.target.value <= 5
                          ? e.target.value
                          : toastfun("Rating should be between 1-5", "warn")
                      )
                    }
                  />
                  <input
                    type="text"
                    className="highlight-msg"
                    placeholder="Highlight message"
                    value={highlight}
                    onChange={(e) => setHighlight(e.target.value)}
                  />
                  <textarea
                    className="normal-msg"
                    placeholder="Comment"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <div className="rbtns">
                    <button onClick={() => setCompose(true)} className="cancel close">
                      Cancel
                    </button>
                    <button className="csubmit submit" onClick={handleSubmit}>
                      {loading ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </div>
              )}
            </div>
  
            <div className="rsec2">
              <h1>All Customers' Reviews</h1>
              {allReviews.length === 0 ? (
                <p>No reviews available</p>
              ) : (
                allReviews.map((review) => (
                  <div className="msg-block" key={review._id}>
                    <div className="my-profile">
                      <div
                        className="my-img my-img2"
                        style={{
                          backgroundColor: getRandomColor(review.name),
                          color: "white",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          fontWeight: "bold",
                        }}
                      >
                        {getInitial(review.name)}
                      </div>
                      <div className="rname" style={{ textAlign: "start" }}>
                        {review.name}
                      </div>
                    </div>
                    <div className="my-msg my-msg2">
                      <strong>
                        <span
                          className="highlight"
                          style={{
                            textTransform: "uppercase",
                          }}
                        >
                          {review.highlight}
                        </span>
                      </strong>
                      <span
                        className="stars"
                        style={{ position: "absolute", right: "4em" }}
                      >
                        {[...Array(Number(review.rating))].map((_, index) => (
                          <span key={index}>⭐</span>
                        ))}
                        <span>{review.rating}/5 Star. Rating</span>
                      </span>
                      <p className="comment">{review.comment}</p>
                      <span className="rdate">
                        Date:{" "}
                        {review.date
                          ? new Date(review.date).toLocaleDateString()
                          : "N/A"}
                      </span>
                      <span className="remail">{review.email}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
      <ToastContainer />
    </>
  );
};

export default Reviews;