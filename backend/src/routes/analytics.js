import express from "express";
import * as XLSX from "xlsx";
import Test from "../models/Test.js";
import TestAttempt from "../models/TestAttempt.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get test analytics
// router.get("/test/:id", auth, async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({ message: "Access denied" });
//     }

//     const testId = req.params.id;
//     const { branch } = req.query;
//     const attempts = await TestAttempt.find({ testId })
//       .populate("studentId", "name email studentId branch")
//       .populate("testId", "title")
//       .sort({ percentage: -1 });

//     const test = await Test.findById(testId);
//     const filteredAttempts = branch
//       ? attempts.filter((attempt) => attempt.studentId?.branch === branch)
//       : attempts;

//     const analytics = {
//       totalAttempts: attempts.length,
//       averageScore:
//         attempts.length > 0
//           ? attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) /
//             attempts.length
//           : 0,
//       highestScore:
//         attempts.length > 0
//           ? Math.max(...attempts.map((a) => a.percentage))
//           : 0,
//       lowestScore:
//         attempts.length > 0
//           ? Math.min(...attempts.map((a) => a.percentage))
//           : 0,
//       passRate:
//         attempts.length > 0
//           ? (attempts.filter((a) => a.percentage >= 60).length /
//               attempts.length) *
//             100
//           : 0,
//       attempts: attempts.map((attempt) => ({
//         studentName: attempt.studentId.name,
//         studentEmail: attempt.studentId.email,
//         studentId: attempt.studentId.studentId,
//         score: attempt.score,
//         totalPoints: attempt.totalPoints,
//         percentage: attempt.percentage,
//         timeSpent: attempt.timeSpent,
//         completedAt: attempt.completedAt,
//       })),
//     };

//     res.json(analytics);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// });

// ...existing code...

// Get test analytics with branch filter
router.get("/test/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const testId = req.params.id;
    const { branch } = req.query;

    const attempts = await TestAttempt.find({ testId })
      .populate("studentId", "name email studentId branch")
      .populate("testId", "title")
      .sort({ completedAt: -1 });

    // Filter by branch if specified
    const filteredAttempts = branch
      ? attempts.filter((attempt) => attempt.studentId?.branch === branch)
      : attempts;

    const test = await Test.findById(testId);

    const analytics = {
      totalAttempts: filteredAttempts.length,
      averageScore:
        filteredAttempts.length > 0
          ? filteredAttempts.reduce(
              (sum, attempt) => sum + attempt.percentage,
              0
            ) / filteredAttempts.length
          : 0,
      highestScore:
        filteredAttempts.length > 0
          ? Math.max(...filteredAttempts.map((a) => a.percentage))
          : 0,
      lowestScore:
        filteredAttempts.length > 0
          ? Math.min(...filteredAttempts.map((a) => a.percentage))
          : 0,
      passRate:
        filteredAttempts.length > 0
          ? (filteredAttempts.filter((a) => a.percentage >= 60).length /
              filteredAttempts.length) *
            100
          : 0,
      attempts: filteredAttempts.map((attempt) => ({
        studentName: attempt.studentId?.name || "Unknown",
        studentEmail: attempt.studentId?.email || "",
        studentId: attempt.studentId?.studentId || "",
        branch: attempt.studentId?.branch || "N/A",
        score: attempt.score,
        totalPoints: attempt.totalPoints,
        percentage: attempt.percentage,
        timeSpent: attempt.timeSpent,
        completedAt: attempt.completedAt,
      })),
      availableBranches: [
        ...new Set(attempts.map((a) => a.studentId?.branch).filter(Boolean)),
      ],
    };

    res.json(analytics);
  } catch (error) {
    console.error("Error in analytics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ...existing code...

// Export results to Excel
router.get("/export/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const testId = req.params.id;
    const test = await Test.findById(testId);
    const attempts = await TestAttempt.find({ testId })
      .populate("studentId", "name email studentId branch")
      .populate("testId", "title")
      .sort({ percentage: -1 });

    // Prepare question columns
    const questionColumns = test.questions.map((q, idx) => ({
      key: `Q${idx + 1}`,
      text: q.question,
      options: q.options,
    }));

    // Prepare export data
    const exportData = attempts.map((attempt) => {
      const row = {
        "Student Name": attempt.studentId.name,
        "Student Email": attempt.studentId.email,
        "Student ID": attempt.studentId.studentId,
        Branch: attempt.studentId.branch || "N/A",
        Score: attempt.score,
        "Total Points": attempt.totalPoints,
        Percentage: `${attempt.percentage.toFixed(2)}%`,
        "Time Spent (minutes)": Math.round(attempt.timeSpent / 60),
        "Completed At": new Date(attempt.completedAt).toLocaleString(),
        Status: attempt.percentage >= 60 ? "Pass" : "Fail",
      };

      // Add question-wise answers
      // questionColumns.forEach((q, idx) => {
      //   // Find the answer for this question
      //   const answerObj = attempt.answers?.[idx];
      //   let selected = "";
      //   if (answerObj && answerObj.selectedAnswer !== undefined && q.options) {
      //     selected = q.options[answerObj.selectedAnswer] || "N.A.";
      //   }
      //   row[`Q${idx + 1}: ${q.text}`] = selected;
      // });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Test Results");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=test-results-${testId}.xlsx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get dashboard analytics
router.get("/dashboard", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const totalTests = await Test.countDocuments();
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalAttempts = await TestAttempt.countDocuments();

    const recentAttempts = await TestAttempt.find()
      .populate("studentId", "name")
      .populate("testId", "title")
      .sort({ completedAt: -1 })
      .limit(10);

    const analytics = {
      totalTests,
      totalStudents,
      totalAttempts,
      recentAttempts: recentAttempts.map((attempt) => ({
        studentName: attempt.studentId.name || "",
        testTitle: attempt.testId.title || "",
        percentage: attempt.percentage,
        completedAt: attempt.completedAt,
      })),
    };

    res.json(analytics);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
