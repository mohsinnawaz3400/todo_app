// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import todoRoutes from "./routes/todoRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Health check
app.get("/", (req, res) => {
    res.json({
        message: "🚀 Todo App API is running",
        status: "active",
        version: "1.0.0"
    });
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/todos", todoRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

// app.listen(PORT, () => {
//     console.log(`✅ Server is running on port ${PORT}`);
//     console.log(`📚 API Documentation: http://localhost:${PORT}/`);
// });

export default app;