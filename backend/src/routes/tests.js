import express from "express";
import multer from "multer";
import XLSX from "xlsx";
import Test from "../models/Test.js";
import User from "../models/User.js";
import TestAttempt from "../models/TestAttempt.js";
import auth from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Create test with Excel upload
router.post("/create", auth, upload.single("excelFile"), async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { title, description, duration, scheduledAt } = req.body;
    let questions = [];

    if (req.file) {
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);

      questions = data.map((row) => ({
        question: row.question || row.Question,
        code: row.code || row.Code,
        image: row.image || row.Image,
        language: row.language || row.Language || "javascript",
        options: [
          row.optionA || row.option_a || row["Option A"],
          row.optionB || row.option_b || row["Option B"],
          row.optionC || row.option_c || row["Option C"],
          row.optionD || row.option_d || row["Option D"],
        ].filter(Boolean),
        correctAnswer:
          parseInt(
            row.correctAnswer || row.correct_answer || row["Correct Answer"]
          ) - 1,
        points: parseInt(row.points || row.Points) || 1,
      }));
    }

    const test = new Test({
      title,
      description,
      questions,
      duration: parseInt(duration),
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      createdBy: req.user.userId,
      isActive: true,
    });

    await test.save();
    res.status(201).json({ message: "Test created successfully", test });
  } catch (error) {
    console.log("Error creating test:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Only test names
router.get("/testNames", auth, async (req, res) => {
  try {
    const tests = await Test.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all tests
router.get("/", auth, async (req, res) => {
  try {
    const currentUser = await User.findOne({ _id: req.user.userId });

    const tests = await Test.find({
      description: currentUser.studentId,
    })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get test by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const currentUser = await User.findOne({ _id: req.user.userId });
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    if (test.description === currentUser.studentId) {
      // If student, don't send correct answers
      if (req.user.role === "student") {
        const testWithoutAnswers = {
          ...test.toObject(),
          questions: test.questions.map((q) => ({
            ...q.toObject(),
            correctAnswer: undefined,
          })),
        };
        return res.json(testWithoutAnswers);
      }

      res.json(test);
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// End test (admin only)
router.patch("/:id/end", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const test = await Test.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    res.json({ message: "Test ended successfully", test });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get active test attempts (admin only)
router.get("/:id/active-attempts", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const attempts = await TestAttempt.find({
      testId: req.params.id,
      completedAt: { $exists: false },
    })
      .populate("studentId", "name email studentId")
      .sort({ startedAt: -1 });

    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get student's detailed attempt (admin only)
router.get("/:testId/student/:studentId/attempt", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const attempt = await TestAttempt.findOne({
      testId: req.params.testId,
      studentId: req.params.studentId,
    })
      .populate("studentId", "name email studentId")
      .populate("testId", "title questions");

    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    res.json(attempt);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Submit test attempt
router.post("/:id/submit", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res
        .status(403)
        .json({ message: "Only students can submit tests" });
    }

    const { answers, timeSpent } = req.body;
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    if (!test.isActive) {
      return res
        .status(400)
        .json({ message: "Test has been ended by the administrator" });
    }

    // Check if student already submitted
    const existingAttempt = await TestAttempt.findOne({
      testId: req.params.id,
      studentId: req.user.userId,
      completedAt: { $exists: true },
    });

    if (existingAttempt) {
      return res
        .status(400)
        .json({ message: "You have already submitted this test" });
    }

    // Calculate score
    let score = 0;
    let totalPoints = 0;
    const processedAnswers = answers.map((answer, index) => {
      const question = test.questions[index];
      const isCorrect = question.correctAnswer === answer.selectedAnswer;
      const points = isCorrect ? question.points : 0;

      score += points;
      totalPoints += question.points;

      return {
        questionId: question._id,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
        points,
      };
    });

    const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

    const attempt = new TestAttempt({
      testId: req.params.id,
      studentId: req.user.userId,
      answers: processedAnswers,
      score,
      totalPoints,
      percentage,
      completedAt: new Date(),
      timeSpent,
    });

    await attempt.save();
    res.json({ score, totalPoints, percentage, attempt });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
