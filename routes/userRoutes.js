// routes/userRoutes.js
import express from "express";
import {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    updatePassword,
    deleteUser
} from "../controller/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.put("/password", protect, updatePassword);
router.delete("/delete", protect, deleteUser);

export default router;