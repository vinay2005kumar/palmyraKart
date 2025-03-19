import mongoose from "mongoose";
const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user
    items: [{
    //   itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // Reference to the product
      itemType:{type: String, required: true},
      itemName: { type: String,default:'Palmyra Fruit' },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      imagePath: { type: String }
    }],
    totalAmount: { type: Number},
    tax: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
    paymentId: { type: String },
    paymentMethod: { type: String, enum: ['Credit Card', 'Debit Card', 'PayPal', 'UPI', 'Net Banking', 'Cash on Delivery'], required: true },
    paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed', 'Refunded'], default: 'Pending' },
    shippingAddress: {
      street: { type: String,default:''},
      city: { type: String,default:''},
      state: { type: String,default:''},
      country: { type: String,default:''},
      zipCode: { type: String,default:''},
      phoneNumber:{type:Number,default:''}
    },
    deliveryDate: { type: Date },
    status: { type: String, default: 'Pending' },
    trackingId: { type: String },
    carrier: { type: String },
    date: { type:String},
    otp: { type: String },
    notes: { type: String },
    refundId: { type: String },
    cancelledBy: { type: String, enum: ['Customer', 'Admin'] },
    cancellationReason: { type: String }
  });
  
  const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
  export { Order };