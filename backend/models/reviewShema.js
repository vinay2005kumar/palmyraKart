import mongoose from "mongoose";
const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user
    rating: { type: Number, required: true, min: 1, max: 5 },
    name:{type: String},
    email:{type:String},
    highlight: { type: String, required: true },
    comment: { type: String, required: true },
    date: { type: Date, default: Date.now }
  });
  
  const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
  export { Review };