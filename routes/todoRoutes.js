// routes/todoRoutes.js
import express from "express";
import {
    createTodo,
    getAllTodos,
    getTodoById,
    updateTodo,
    toggleTodo,
    deleteTodo,
    deleteMultipleTodos,
    getDashboardStats
} from "../controllers/todoController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect); // All todo routes are protected

router.route("/")
    .get(getAllTodos)
    .post(createTodo)
    .delete(deleteMultipleTodos);

router.get("/stats/dashboard", getDashboardStats);

router.route("/:id")
    .get(getTodoById)
    .put(updateTodo)
    .delete(deleteTodo);

router.patch("/:id/toggle", toggleTodo);

export default router;