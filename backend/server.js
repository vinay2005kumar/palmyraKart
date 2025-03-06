import express from "express";
import cors from "cors";
import 'dotenv/config';
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";

connectDB();

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(cookieParser()); // Parse cookies

// CORS Configuration
// CORS Configuration
app.use(cors({
  origin: ["https://palmyrakart.onrender.com", "http://localhost:5173"], // ✅ Allow frontend & local dev
  credentials: true, // ✅ Allow cookies & authentication headers
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // ✅ Allow necessary methods
  allowedHeaders: ["Content-Type", "Authorization"], // ✅ Allow important headers
}));
// Handle preflight requests
app.options('*', cors()); // Allow preflight requests for all routes

// Routes
app.get("/", (req, res) => {
  res.send("Backend running on Render!");
});

app.use('/api/user', authRouter);
app.use('/api/user', userRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
