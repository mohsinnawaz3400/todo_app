// controllers/userController.js
import User from "../models/user.model.js";
import Todo from "../models/todo.model.js";

// ================= REGISTER USER =================
// Sirf user create karega, token NAHI banega
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        // Create new user only - NO TOKEN
        const user = await User.create({ name, email, password });

        res.status(201).json({
            success: true,
            message: "User registered successfully! Please login.",
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt
            },
            // ❌ Token removed from here
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= LOGIN USER =================
// Yahan token create hoga
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide email and password"
            });
        }

        // Find user with password
        const user = await User.findOne({ email }).select("+password");

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // ✅ Generate token ONLY here
        const token = user.generateToken();

        res.json({
            success: true,
            message: "Login successful",
            token, // ✅ Token sirf login pe
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= GET USER PROFILE =================
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        res.json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= UPDATE USER PROFILE =================
export const updateUserProfile = async (req, res) => {
    try {
        const { name, email, avatar } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.avatar = avatar || user.avatar;

        const updatedUser = await user.save();

        res.json({
            success: true,
            message: "Profile updated successfully",
            data: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                avatar: updatedUser.avatar,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= UPDATE PASSWORD =================
export const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id).select("+password");

        if (!(await user.matchPassword(currentPassword))) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: "Password updated successfully",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= DELETE USER =================
export const deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user._id);

        // Delete all todos of this user
        await Todo.deleteMany({ user: req.user._id });

        res.json({
            success: true,
            message: "User and all associated data deleted successfully",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};