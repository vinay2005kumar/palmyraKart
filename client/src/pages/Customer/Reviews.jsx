import React, { useState, useEffect } from "react";
import Topbar from '../../components/Topbar';
import "./Reviews.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from '../../context/AuthContext';
import FruitLoader from "../../components/FruitLoader";
import { useNavigate } from "react-router-dom";

const Reviews = () => {
  const [compose, setCompose] = useState(true);
  const [rating, setRating] = useState("");
  const [highlight, setHighlight] = useState("");
  const [description, setDescription] = useState("");
  const [editingReview, setEditingReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [animateEntry, setAnimateEntry] = useState(false);
  const isMobile = window.innerWidth < 765;
  const [activeToastId, setActiveToastId] = useState(null);
  const {
    userDetails,
    reviewDetails,
    allReviews,
    checkAuth,
    fetchReviews,
    addReview,
    updateReview,
    deleteReview,
    isLoading,
    isAuthenticated
  } = useAuth();
  const { name, email: userEmail } = userDetails;
  const navigate=useNavigate()
  const toastfun = (msg, type, toastId = 'default-toast') => {
    if (!toast.isActive(toastId)) {
      const messageLength = msg.length;
      const lineLength = isMobile ? 30 : 50;
      const lines = Math.ceil(messageLength / lineLength);

      const minWidth = isMobile ? '80vw' : '30vw';
      const maxWidth = isMobile ? '90vw' : '40vw';
      const baseHeight = isMobile ? '10vh' : '10vh';
      const lineHeight = '1.5rem';

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
          width: 'auto',
          height: 'auto',
          minHeight: baseHeight,
          fontSize: '1.2rem',
          padding: '10px',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderLeft: `5px solid ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#FF9800'}`,
        },
      });
    }
  };

  useEffect(() => {
    checkAuth();
    fetchReviews();
    // Trigger animation after component mounts
    setTimeout(() => {
      setAnimateEntry(true);
    }, 300);
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
          <div style={{ display: "flex", width: "100%", justifyContent: "space-around" }}>
            <button
              onClick={() => {
                if (toast.isActive(toastId)) {
                  toast.dismiss(toastId);
                }
              }}
              style={{
                width: "40%",
                fontSize: "1.1em",
                padding: "8px 10px",
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
                width: "40%",
                fontSize: "1.1em",
                padding: "8px 10px",
                background: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginTop: "10px",
              }}
            >
              Confirm
            </button>
          </div>
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
            width: isMobile ? "90%" : "350px",
            top: "6em",
            padding: "15px",
            borderRadius: "8px",
            backgroundColor: "#f5f5f5",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
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
    const fruitColors = [
      "#FF9F1C", // Orange
      "#2EC4B6", // Teal
      "#E71D36", // Red
      "#FF9F1C", // Orange
      "#8CB369", // Green
      "#5E2CA5", // Purple
      "#448AFF", // Blue
      "#FF5722", // Deep Orange
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return fruitColors[Math.abs(hash) % fruitColors.length];
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  const renderStars = (rating) => {
    return (
      <div className="star-rating">
        {[...Array(5)].map((_, index) => (
          <span
            key={index}
            className={`star ${index < rating ? 'filled' : 'empty'}`}
          >
            {index < rating ? '★' : '☆'}
          </span>
        ))}
        <span className="rating-text">{rating}/5</span>
      </div>
    );
  };

  return (
    <>
      <Topbar />
      {isLoading ? (
        <FruitLoader></FruitLoader>
      ) : (

        <div className={`reviews-section ${animateEntry ? 'animate-in' : ''}`}>

          <div className="rsec1">
            {compose ? (
              <>

                <div className="section-header my-header">
                  <h1>My Reviews</h1>
                  <div className="palm-leaf"></div>
                </div>
                {isAuthenticated && <button className="compose" onClick={() => {
                  setCompose(false);
                  setEditingReview(null);
                }}>
                  <span className="button-icon">✏️</span> Write Review
                </button>}
               
                <div className="reviews-container">
                  {reviewDetails.length === 0 ? (
                    <div className="no-reviews">
                      <div className="empty-state">
                        <div className="fruit-icon">🌴</div>
                        {isAuthenticated ? (
                          <>
                            <p>You haven't submitted any reviews yet.</p>
                            <p>Share your experience with our palmyra fruits!</p>
                          </>
                        ) : (
                          <>
                            <p>Please sign in to view and write reviews.</p>
                            <button
                              className="sign-in-btn"
                              onClick={() =>navigate('/auth')}
                            >
                              Sign In
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    reviewDetails.map((review, index) => (
                      <div className={`msg-block review-card my-review ${animateEntry ? 'fade-in' : ''}`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                        key={review._id}>
                        <div className="my-profile my-review-profile">
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
                              boxShadow: "0 3px 6px rgba(0,0,0,0.16)",
                            }}
                          >
                            {getInitial(name)}
                          </div>
                          <div className="rname">{name}</div>
                        </div>
                        <div className="my-msg">
                          <div className="review-header">
                            <span className="highlight">{review.highlight}</span>
                            <div className="stars-container">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                          <p className="comment">{review.comment}</p>
                          <div className="review-footer">
                            <span className="rdate">
                              {review.date
                                ? new Date(review.date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })
                                : "N/A"}
                            </span>
                            <div className="rbutton">
                              <button onClick={() => handleEdit(review)} className="cedit">
                                <span className="button-icon">✏️</span> Edit
                              </button>
                              <button onClick={() => handleDelete(review._id)} className="delete-btn">
                                <span className="button-icon">🗑️</span> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </>
            ) : (
              <div className="compose-block">
                <h2>{editingReview ? "Edit Your Review" : "Share Your Experience"}</h2>

                <div className="rating-selector">
                  <label>Your Rating</label>
                  <div className="star-input">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`star-select ${Number(rating) >= star ? 'selected' : ''}`}
                        onClick={() => setRating(star)}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <input
                    type="text"
                    className="highlight-msg"
                    placeholder="Summarize your experience in a few words"
                    value={highlight}
                    onChange={(e) => setHighlight(e.target.value)}
                    maxLength={50}
                  />
                  <div className="input-underline"></div>
                </div>

                <div className="input-group textarea-group">
                  <textarea
                    className="normal-msg"
                    placeholder="Tell us more about your experience with our palmyra fruits..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="rbtns">
                  <button onClick={() => setCompose(true)} className="cancel close">
                    Cancel
                  </button>
                  <button
                    className={`csubmit submit ${loading ? 'loading' : ''}`}
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rsec2">
            <div className="section-header">
              <h1>Customer Reviews</h1>
              <div className="palm-leaf"></div>
            </div>

            <div className="reviews-container">
              {allReviews.length === 0 ? (
                <div className="no-reviews">
                  <div className="empty-state">
                    <div className="fruit-icon">🌴</div>
                    <p>No reviews available yet</p>
                    <p>Be the first to share your experience!</p>
                  </div>
                </div>
              ) : (
                allReviews.map((review, index) => (
                  <div className={`msg-block review-card ${animateEntry ? 'fade-in' : ''}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    key={review._id}>
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
                          boxShadow: "0 3px 6px rgba(0,0,0,0.16)",
                        }}
                      >
                        {getInitial(review.name)}
                      </div>
                      <div className="rname">{review.name}</div>
                    </div>
                    <div className="my-msg my-msg2">
                      <div className="review-header">
                        <span className="highlight">{review.highlight}</span>
                        <div className="stars-container">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      <p className="comment">{review.comment}</p>
                      <div className="review-footer">
                        <span className="rdate">
                          {review.date
                            ? new Date(review.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                            : "N/A"}
                        </span>
                        <span className="verified-badge">
                          <span className="verified-icon">✓</span>{review.email}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}
      <ToastContainer />
    </>
  );
};

export default Reviews;