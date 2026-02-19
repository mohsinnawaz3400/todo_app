// models/todoModel.js
import mongoose from "mongoose";

const todoSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
            index: true
        },
        title: {
            type: String,
            required: [true, "Please enter todo title"],
            trim: true,
            maxlength: [200, "Title cannot exceed 200 characters"]
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, "Description cannot exceed 1000 characters"]
        },
        isCompleted: {
            type: Boolean,
            default: false
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium"
        },
        dueDate: {
            type: Date,
            default: null
        },
        dueTime: {
            type: String,
            default: null,
            match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter valid time format (HH:MM)"]
        },
        category: {
            type: String,
            enum: ["personal", "work", "shopping", "health", "finance", "education", "other"],
            default: "other"
        },
        tags: [{
            type: String,
            trim: true
        }],
        subtasks: [{
            title: { type: String, required: true },
            isCompleted: { type: Boolean, default: false }
        }],
        attachments: [{
            filename: String,
            url: String,
            fileType: String
        }],
        reminder: {
            type: Boolean,
            default: false
        },
        notes: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual for checking if todo is overdue
todoSchema.virtual("isOverdue").get(function () {
    if (!this.dueDate || this.isCompleted) return false;
    return new Date(this.dueDate) < new Date();
});

// Virtual for time remaining
todoSchema.virtual("timeRemaining").get(function () {
    if (!this.dueDate || this.isCompleted) return null;
    const now = new Date();
    const due = new Date(this.dueDate);
    const diff = due - now;

    if (diff < 0) return "Overdue";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} days ${hours} hours`;
    return `${hours} hours`;
});

// Index for better query performance
todoSchema.index({ user: 1, isCompleted: 1, priority: 1, dueDate: 1 });

const Todo = mongoose.model("Todo", todoSchema);
export default Todo;