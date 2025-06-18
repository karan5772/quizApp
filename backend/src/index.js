import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import testRoutes from "./routes/tests.js";
import userRoutes from "./routes/users.js";
import analyticsRoutes from "./routes/analytics.js";
import db from "./db/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://trader-intended-unemployment-catalog.trycloudflare.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/users", userRoutes);
app.use("/api/analytics", analyticsRoutes);

// MongoDB connection
db();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
