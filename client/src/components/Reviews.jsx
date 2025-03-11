import React, { useState, useEffect } from "react";
import axios from "axios";
import Topbar from "./Topbar";
import "./Reviews.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Reviews = () => {
  const [allReviews, setAllReviews] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [compose, setCompose] = useState(true);
  const [rating, setRating] = useState("");
  const [highlight, setHighlight] = useState("");
  const [description, setDescription] = useState("");
  const [editingReview, setEditingReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const[userEmail,setuserEmail]=useState()
  const isMobile = window.innerWidth < 765;
  const url = 'https://palmyra-fruit.onrender.com/api/user';
  //const url = 'http://localhost:4000/api/user';

  useEffect(() => {
    const fetchUserReview = async () => {
      try {
        const response = await axios.get(`${url}/data`, { withCredentials: true });
        const email = response.data.userData.email;
        setuserEmail(email);
  
        const reviews = response.data.userData.reviews || [];
        const sortedReviews = reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
        setUserReviews(sortedReviews);
      } catch (error) {
        toastfun("You Should Login to See Your Reviews.", "info");
        console.log(error);
      }
    };
  
    const fetchReviews = async (email) => {
      try {
        const response = await axios.get(`${url}/reviews`);
        const reviews = response.data.reviews || [];
        const sortedReviews = reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
        setAllReviews(sortedReviews);
  
        if (email) {
          setUserReviews(sortedReviews.filter((review) => review.user.email === email));
        }
      } catch (error) {
        toastfun("Failed to fetch reviews.", "error");
        console.log(error);
      }
    };
  
    // Fetch user data first, then fetch reviews
    fetchUserReview().then(() => {
      fetchReviews(userEmail); // Now userEmail is properly set
    });
  
    return () => {
      toast.dismiss();
    };
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
        rating,
        highlight,
        comment: description,
      };

      if (editingReview) {
        await axios.put(`${url}/reviews/${editingReview._id}`, reviewData);
        setAllReviews((prev) =>
          prev.map((r) =>
            r._id === editingReview._id
              ? { ...r, rating, highlight, comment: description }
              : r
          )
        );
        setUserReviews((prev) =>
          prev.map((r) =>
            r._id === editingReview._id
              ? { ...r, rating, highlight, comment: description }
              : r
          )
        );
        toastfun("Review updated successfully.", "success");
      } else {
        const response = await axios.post(`${url}/add-reviews`, reviewData);
        const newReview = response.data.review;
        setAllReviews((prev) => [newReview, ...prev]);
        setUserReviews((prev) => [newReview, ...prev]);
        toastfun("Review added successfully.", "success");
      }

      setRating("");
      setHighlight("");
      setDescription("");
      setEditingReview(null);
      setCompose(true);
    } catch (error) {
      toastfun("Failed to submit review.", "error");
      console.log(error)
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId) => {
    toast(
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <p style={{ padding: '1em', fontSize: '1.2em', textAlign: 'center', color: '#444'}}>
          Do you really want to delete this review?
        </p>
        <button
          onClick={async () => {
            try {
              await axios.delete(`${url}/reviews/${reviewId}`);
              setAllReviews((prev) => prev.filter((r) => r._id !== reviewId));
              setUserReviews((prev) => prev.filter((r) => r._id !== reviewId));
              toast.dismiss();
              toastfun("Review deleted successfully.", "success");
            } catch (error) {
              toastfun("Failed to delete review.", "error");
            }
          }}
          style={{
            width:isMobile?'40%':'90%',
            fontSize: '1.1em',
            padding: '8px 10px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px',
            transition: 'background-color 0.3s ease',
          }}
        >
          Confirm Delete
        </button>
      </div>,
      {
        autoClose: false,
        position: 'top-center',
        onClick: () => { toast.dismiss() },
        style: {
          width: '100%',
          top: '6em', 
          padding: '15px',
          borderRadius: '8px',
          backgroundColor: '#f5f5f5',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }
      }
    );
  };

  const handleEdit = (review) => {
    console.log('review',review)
    setRating(review.rating);
    setHighlight(review.highlight);
    setDescription(review.comment);
    setEditingReview(review);
    setCompose(false);
  };

  // Utility functions for random color and initials
  const getRandomColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `#${((hash >> 8) & 0x00FFFFFF).toString(16).padStart(6, "0")}`;
    return color;
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  return (
    <>
      <Topbar />
      <div className="reviews-section">
        <div className="rsec1">
          <h1>My Reviews</h1>
          {compose ? (
            <>
              {userReviews.length === 0 ? (
                <p style={{ textAlign: "center" }}>No reviews submitted yet.</p>
              ) : (
                userReviews.map((review) => (
                  <div className="msg-block" key={review._id}>
                    <div className="my-profile">
                      <div
                        className="my-img"
                        style={{
                          backgroundColor: getRandomColor(review.user.name),
                          color: "white",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          borderRadius: "50%",
                          fontWeight:'bold',
                        }}
                      >
                        {getInitial(review.user.name)}
                      </div>
                      <div className="rname" style={{ textAlign: "start" }}>{review.user.name}</div>
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
                        Date: {review.date ? new Date(review.date).toLocaleDateString() : 'N/A'}
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
              <h2 style={{color:'green'}}>{editingReview ? "Edit Review" : "Make Your Own Review"}</h2>
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
                      backgroundColor: getRandomColor(review.user.name),
                      color: "white",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                     
                      fontWeight:'bold',
                    }}
                  >
                    {getInitial(review.user.name)}
                  </div>
                  <div className="rname" style={{ textAlign: "start" }}>{review.user.name}</div>
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
                    Date: {review.date ? new Date(review.date).toLocaleDateString() : 'N/A'}
                  </span>
                  <span className="remail">
                   {review.user.email}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default Reviews;
