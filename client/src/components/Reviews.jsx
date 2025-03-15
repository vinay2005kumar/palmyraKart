import React, { useState, useEffect } from "react";
import axios from "axios";
import Topbar from "./Topbar";
import "./Reviews.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Reviews = () => {
  const [name,setName]=useState('')
  const [allReviews, setAllReviews] = useState([]); // All reviews from all users
  const [userReviews, setUserReviews] = useState([]); // Reviews by the logged-in user
  const [compose, setCompose] = useState(true); // Toggle compose review form
  const [rating, setRating] = useState(""); // Review rating (1-5)
  const [highlight, setHighlight] = useState(""); // Review highlight
  const [description, setDescription] = useState(""); // Review comment
  const [editingReview, setEditingReview] = useState(null); // Review being edited
  const [loading, setLoading] = useState(false); // Loading state for API calls
  const [userEmail, setUserEmail] = useState(""); // Email of the logged-in user
  const isMobile = window.innerWidth < 765; // Check if the device is mobile
  const url = "http://localhost:4000/api/user"; // Backend API base URL

  // Toast notification function
  const toastfun = (msg, type) => {
    toast[type](msg, {
      position: "top-center",
      autoClose: 3000,
      style: {
        position: "absolute",
        right: "0em",
        top: isMobile ? "0em" : "0px",
        left: isMobile ? "18%" : "-2em",
        width: isMobile ? "70vw" : "40vw",
        height: isMobile ? "10vh" : "20vh",
        fontSize: isMobile ? "1.1em" : "1.2em",
        padding: "10px",
      },
      onClick: () => {
        toast.dismiss();
      },
    });
  };

  // Fetch user reviews and all reviews
  useEffect(() => {
    const fetchUserReview = async () => {
      try {
        const response = await axios.get(`${url}/data`, {
          withCredentials: true,
        });
        const email = response.data.userData.email;
        setUserEmail(email);
        const name=response.data.userData.name
        setName(name)
        console.log(name)
        const reviews = response.data.reviewData|| [];
        // console.log('reviews',reviews)
        const sortedReviews = reviews.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setUserReviews(sortedReviews);
      } catch (error) {
        toastfun("You must log in to see your reviews.", "info");
        console.log(error);
      }
    };

    const fetchReviews = async () => {
      try {
        const response = await axios.get(`${url}/reviews`);
        const reviews = response.data.reviews || [];
        const sortedReviews = reviews.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setAllReviews(sortedReviews);

        if (userEmail) {
          setUserReviews(
            sortedReviews.filter((review) => review.user.email === userEmail)
          );
        }
      } catch (error) {
        toastfun("Failed to fetch reviews.", "error");
        console.log(error);
      }
    };

    fetchUserReview();
    fetchReviews();
  }, [userEmail]);

  // Handle review submission (create or update)
  const handleSubmit = async () => {
    if (!rating || !highlight || !description) {
      toastfun("Please fill out all fields before submitting.", "warn");
      return;
    }

    try {
      setLoading(true);
      const reviewData = {
        email:userEmail,
        rating: Number(rating),
        highlight,
        comment: description,
      };

      if (editingReview) {
        // Update existing review
        await axios.put(`${url}/reviews/${editingReview._id}`, reviewData);
        setAllReviews((prev) =>
          prev.map((r) =>
            r._id === editingReview._id ? { ...r, ...reviewData } : r
          )
        );
        setUserReviews((prev) =>
          prev.map((r) =>
            r._id === editingReview._id ? { ...r, ...reviewData } : r
          )
        );
        toastfun("Review updated successfully.", "success");
      } else {
        // Create new review
        const response = await axios.post(`${url}/add-reviews`, reviewData, {
          withCredentials: true,
        });
        const newReview = response.data.review;
        setAllReviews((prev) => [newReview, ...prev]);
        setUserReviews((prev) => [newReview, ...prev]);
        toastfun("Review added successfully.", "success");
      }

      // Reset form fields
      setRating("");
      setHighlight("");
      setDescription("");
      setEditingReview(null);
      setCompose(true);
    } catch (error) {
      toastfun("Failed to submit review.", "error");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle review deletion
  const handleDelete = async (reviewId) => {
    toast(
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <p style={{ padding: "1em", fontSize: "1.2em", textAlign: "center", color: "#444" }}>
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
        autoClose: false,
        position: "top-center",
        onClick: () => {
          toast.dismiss();
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
  };

  // Handle review edit
  const handleEdit = (review) => {
    setRating(review.rating);
    setHighlight(review.highlight);
    setDescription(review.comment);
    setEditingReview(review);
    setCompose(false);
  };

  // Generate random color for user avatar
  const getRandomColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `#${((hash >> 8) & 0x00ffffff).toString(16).padStart(6, "0")}`;
    return color;
  };

  // Get initial for user avatar
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
                          backgroundColor:getRandomColor(name),
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
                      backgroundColor: getRandomColor(name),
                      color: "white",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      fontWeight: "bold",
                    }}
                  >
                    {getInitial(name)}
                  </div>
                  <div className="rname" style={{ textAlign: "start" }}>
                    {review.user.name}
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
                  <span className="remail">{userEmail}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default Reviews;