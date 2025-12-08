import multer from "multer";
import XLSX from "xlsx";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// Create user (generic)
router.post("/create-user", async (req, res) => {
  try {
    const { name, email, password, role, studentId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "student",
      studentId: studentId || null,
    });

    await user.save();

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create student (admin only)
router.post("/create-student", async (req, res) => {
  try {
    const { name, email, password, studentId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      studentId,
      role: "student",
    });

    await user.save();

    res.status(201).json({
      message: "Student created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/delete-student", async (req, res) => {
  try {
    const { studentId } = req.body;

    const user = await User.findOne({ _id: studentId });
    if (!user) {
      return res.status(400).json({ message: "User doesn't exists" });
    }
    await User.deleteOne({ _id: studentId });

    res.status(201).json({
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.log("Server error", error);

    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/import-students", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const students = XLSX.utils.sheet_to_json(sheet);

    let created = 0,
      skipped = 0,
      errors = [];
    for (const s of students) {
      const { name, email, password, studentId } = s;
      if (!name || !email || !password || !studentId) {
        skipped++;
        errors.push({ email, reason: "Missing required fields" });
        continue;
      }
      const exists = await User.findOne({ email });
      if (exists) {
        skipped++;
        errors.push({ email, reason: "Already exists" });
        continue;
      }
      const hashedPassword = await bcrypt.hash(password, 12);
      await User.create({
        name,
        email,
        password: hashedPassword,
        studentId,
        role: "student",
      });
      created++;
    }
    res.json({ created, skipped, errors });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
