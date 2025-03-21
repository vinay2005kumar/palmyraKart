
// import mongoose from "mongoose";



// // Order Schema
// const orderSchema = new mongoose.Schema({
//     orderId: { type: String },
//     item: String,
//     quantity: Number,
//     price: Number,
//     imagePath: String,
//     status: { type: String },
//     date: { type: String, default: '' },
//     otp: { type: String },
//   });
// // Review Schema
// const reviewSchema = new mongoose.Schema({
//     user: {
//       email: { type: String, required: true },
//       name: { type: String, required: true }
//     },
//     rating: { type: Number, required: true, min: 1, max: 5 }, // Rating (1-5)
//     highlight: { type: String, required: true },
//     comment: { type: String, required: true },
//     date: { type: Date, default: Date.now }
//   });
// const userSchema=new mongoose.Schema({
//     name:{type:String, required:true},
//     email:{type:String, required:true},
//     password:{type:String,required:true},
//     verifyOtp:{type:Number,default:''},
//     verifyOtpExpireAt:{type:Number,default:0},
//     isAccountVerified:{type:Boolean,default:false},
//     emailVerified: { type: Boolean, default: false },
//     resetOtp:{type:String,default:''},
//     resetOtpExpireAt:{type:Number,default:0},
//     limit:{type:Number,default:900},
//     phone: [{ type: String }],
//     address: [{ type: String }],
//     orders: [orderSchema], // Embedding order schema
//     reviews: [reviewSchema] ,// Embedding review schema
//     isKart:{type:Boolean,default:false},
//     isadmin:{type:Boolean,default:false}
   
// },{collection:'user'})
// const userModel=mongoose.models.user || mongoose.model('user',userSchema)
// export default userModel


import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  provider: { type: String},
  googleId: { type: String},
  verifyOtp: { type: String, default: '' },
  verifyOtpExpireAt: { type: Date, default: null },
  isAccountVerified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  resetOtp: { type: String, default: '' },
  resetOtpExpireAt: { type: Date, default: null },
  limit: { type: Number, default: 900 },
  phone: [{ type: String ,default:''}],
  address: [{ type: String ,default:''}],
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }], // Reference to orders
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }], // Reference to reviews
  isKart: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false } // Corrected field name to follow conventions
}, { collection: 'user' });

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;