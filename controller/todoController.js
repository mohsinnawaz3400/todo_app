// controllers/todoController.js
import Todo from "../models/todo.model.js";

// ================= CREATE TODO =================
export const createTodo = async (req, res) => {
    try {
        const {
            title,
            description,
            priority,
            dueDate,
            dueTime,
            category,
            tags,
            reminder,
            notes
        } = req.body;

        const todo = await Todo.create({
            user: req.user._id,
            title,
            description,
            priority: priority || "medium",
            dueDate,
            dueTime,
            category: category || "other",
            tags: tags || [],
            reminder: reminder || false,
            notes
        });

        res.status(201).json({
            success: true,
            message: "Todo created successfully",
            data: todo
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= GET ALL TODOS (with filters) =================
export const getAllTodos = async (req, res) => {
    try {
        const {
            isCompleted,
            priority,
            category,
            search,
            sortBy = "createdAt",
            order = "desc",
            page = 1,
            limit = 10
        } = req.query;

        // Build query
        const query = { user: req.user._id };

        if (isCompleted !== undefined) {
            query.isCompleted = isCompleted === "true";
        }
        if (priority) query.priority = priority;
        if (category) query.category = category;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        // Sorting
        const sortOptions = {};
        if (sortBy === "dueDate") sortOptions.dueDate = order === "asc" ? 1 : -1;
        else if (sortBy === "priority") {
            sortOptions.priority = order === "asc" ? 1 : -1;
        }
        else sortOptions[sortBy] = order === "asc" ? 1 : -1;

        // Pagination
        const skip = (Number(page) - 1) * Number(limit);

        const todos = await Todo.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(Number(limit));

        const total = await Todo.countDocuments(query);

        // Statistics
        const stats = await Todo.aggregate([
            { $match: { user: req.user._id } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ["$isCompleted", true] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ["$isCompleted", false] }, 1, 0] } },
                    highPriority: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } }
                }
            }
        ]);

        res.json({
            success: true,
            count: todos.length,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            stats: stats[0] || { total: 0, completed: 0, pending: 0, highPriority: 0 },
            data: todos
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= GET SINGLE TODO =================
export const getTodoById = async (req, res) => {
    try {
        const todo = await Todo.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!todo) {
            return res.status(404).json({ success: false, message: "Todo not found" });
        }

        res.json({
            success: true,
            data: todo
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= UPDATE TODO =================
export const updateTodo = async (req, res) => {
    try {
        const {
            title,
            description,
            isCompleted,
            priority,
            dueDate,
            dueTime,
            category,
            tags,
            subtasks,
            notes
        } = req.body;

        let todo = await Todo.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!todo) {
            return res.status(404).json({ success: false, message: "Todo not found" });
        }

        // Update fields
        if (title !== undefined) todo.title = title;
        if (description !== undefined) todo.description = description;
        if (isCompleted !== undefined) todo.isCompleted = isCompleted;
        if (priority !== undefined) todo.priority = priority;
        if (dueDate !== undefined) todo.dueDate = dueDate;
        if (dueTime !== undefined) todo.dueTime = dueTime;
        if (category !== undefined) todo.category = category;
        if (tags !== undefined) todo.tags = tags;
        if (subtasks !== undefined) todo.subtasks = subtasks;
        if (notes !== undefined) todo.notes = notes;

        // Auto-complete if all subtasks done
        if (todo.subtasks.length > 0 && todo.subtasks.every(st => st.isCompleted)) {
            todo.isCompleted = true;
        }

        const updatedTodo = await todo.save();

        res.json({
            success: true,
            message: "Todo updated successfully",
            data: updatedTodo
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= TOGGLE TODO COMPLETION =================
export const toggleTodo = async (req, res) => {
    try {
        const todo = await Todo.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!todo) {
            return res.status(404).json({ success: false, message: "Todo not found" });
        }

        todo.isCompleted = !todo.isCompleted;

        // Update subtasks if marking complete
        if (todo.isCompleted) {
            todo.subtasks.forEach(st => st.isCompleted = true);
        }

        await todo.save();

        res.json({
            success: true,
            message: `Todo marked as ${todo.isCompleted ? "completed" : "pending"}`,
            data: todo
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= DELETE TODO =================
export const deleteTodo = async (req, res) => {
    try {
        const todo = await Todo.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!todo) {
            return res.status(404).json({ success: false, message: "Todo not found" });
        }

        await todo.deleteOne();

        res.json({
            success: true,
            message: "Todo deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= DELETE MULTIPLE TODOS =================
export const deleteMultipleTodos = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ success: false, message: "Please provide array of ids" });
        }

        await Todo.deleteMany({
            _id: { $in: ids },
            user: req.user._id
        });

        res.json({
            success: true,
            message: `${ids.length} todos deleted successfully`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= GET DASHBOARD STATS =================
export const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const stats = await Todo.aggregate([
            { $match: { user: req.user._id } },
            {
                $facet: {
                    overview: [
                        {
                            $group: {
                                _id: null,
                                total: { $sum: 1 },
                                completed: { $sum: { $cond: ["$isCompleted", 1, 0] } },
                                pending: { $sum: { $cond: [{ $eq: ["$isCompleted", false] }, 1, 0] } }
                            }
                        }
                    ],
                    byPriority: [
                        {
                            $group: {
                                _id: "$priority",
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    byCategory: [
                        {
                            $group: {
                                _id: "$category",
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    todayDue: [
                        {
                            $match: {
                                dueDate: { $gte: today, $lt: tomorrow },
                                isCompleted: false
                            }
                        },
                        { $count: "count" }
                    ],
                    overdue: [
                        {
                            $match: {
                                dueDate: { $lt: today },
                                isCompleted: false
                            }
                        },
                        { $count: "count" }
                    ]
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                overview: stats[0].overview[0] || { total: 0, completed: 0, pending: 0 },
                byPriority: stats[0].byPriority,
                byCategory: stats[0].byCategory,
                todayDue: stats[0].todayDue[0]?.count || 0,
                overdue: stats[0].overdue[0]?.count || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};