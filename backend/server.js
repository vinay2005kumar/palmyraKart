import express from "express";
import cors from "cors";
import 'dotenv/config';
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Fix __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

connectDB();

const app = express();
const port = process.env.PORT || 4000;

// Serve static files from the React frontend build
app.use(express.static(path.join(__dirname, '../client/build')));

// React Router: Serve index.html for all unknown routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(cookieParser()); // Parse cookies

// CORS Configuration
app.use(cors({
  origin: ["https://palmyra-fruit-1.onrender.com", "http://localhost:5173"], // ✅ Allow both frontend and local dev
  credentials: true,  // ✅ Allow cookies and authentication headers
}));

// Handle preflight requests
app.options('*', cors()); // Allow preflight requests for all routes

// Routes
app.get("/", (req, res) => {
  res.send("Backend running on Vercel!");
});

app.use('/api/user', authRouter);
app.use('/api/user', userRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
