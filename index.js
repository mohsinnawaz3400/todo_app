import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import morgan from "morgan";
import connectDB from "./config/db.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT;

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
    res.send("Welcome to the Notes App API");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



app.use("/api/users", userRoutes);
