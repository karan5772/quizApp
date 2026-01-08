import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  code: String,
  language: String,
  image: String,
  options: [
    {
      type: String,
      required: true,
    },
  ],
  correctAnswer: {
    type: Number,
    required: true,
  },
  points: {
    type: Number,
    default: 1,
  },
});

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  branch: String,
  description: String,
  questions: [questionSchema],
  questionsPerStudent: {
    type: Number,
    default: null, // null means all questions
  },
  duration: {
    type: Number,
    required: true,
  },
  scheduledAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Test", testSchema);
