// models/inventorySchema.js
import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
  productType: { type: String, required: true, unique: true },
  limit: { type: Number, required: true },       // Max available
  stock: { type: Number, default: 0 },          // Already sold
  reserved: { type: Number, default: 0 },       // Temporarily reserved
  version: { type: Number, default: 0 }         // For optimistic concurrency control
});

const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);
export { Inventory };