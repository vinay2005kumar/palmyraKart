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

// CORS Configuration - Set this BEFORE other middleware for best results
const corsOptions = {
  origin: ["https://palmyrakart.onrender.com", "http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Content-Length", "X-Requested-With", "Accept"],
  exposedHeaders: ["set-cookie"]
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Other middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.get("/", (req, res) => {
  res.send("Backend running on Render!");
});

app.use('/api/user', authRouter);
app.use('/api/user', userRouter);

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});