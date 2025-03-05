
import mongoose from "mongoose";



// Order Schema
const orderSchema = new mongoose.Schema({
    orderId: { type: String },
    item: String,
    quantity: Number,
    price: Number,
    imagePath: String,
    status: { type: String },
    date: { type: Date, default: Date.now },
    otp: { type: String },
  });
// Review Schema
const reviewSchema = new mongoose.Schema({
    user: {
      email: { type: String, required: true },
      name: { type: String, required: true }
    },
    rating: { type: Number, required: true, min: 1, max: 5 }, // Rating (1-5)
    highlight: { type: String, required: true },
    comment: { type: String, required: true },
    date: { type: Date, default: Date.now }
  });
const userSchema=new mongoose.Schema({
    name:{type:String, required:true},
    email:{type:String, required:true},
    password:{type:String,required:true},
    verifyOtp:{type:Number,default:''},
    verifyOtpExpireAt:{type:Number,default:0},
    isAccountVerified:{type:Boolean,default:false},
    emailVerified: { type: Boolean, default: false },
    resetOtp:{type:String,default:''},
    resetOtpExpireAt:{type:Number,default:0},
    limit:{type:Number,default:900},
    phone: [{ type: String }],
    address: [{ type: String }],
    orders: [orderSchema], // Embedding order schema
    reviews: [reviewSchema] ,// Embedding review schema
    isKart:{type:Boolean,default:false},
    isadmin:{type:Boolean,default:false}
   
},{collection:'user'})
const userModel=mongoose.models.user || mongoose.model('user',userSchema)
export default userModel