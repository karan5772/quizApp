import React, { useState } from "react";
import axios from "axios";
import {
  Upload,
  FileText,
  Clock,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  Code,
} from "lucide-react";

import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function formatDate(date) {
  if (!date) {
    return "";
  }
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
function isValidDate(date) {
  if (!date) {
    return false;
  }
  return !isNaN(date.getTime());
}

function CreateTest({ onTestCreated }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    scheduledAt: "",
    branch: "",
    questionsPerStudent: "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [dragActive, setDragActive] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("duration", formData.duration);
      formDataToSend.append("scheduledAt", formData.scheduledAt);
      formDataToSend.append("scheduledAt", formData.branch);

      if (formData.questionsPerStudent) {
        formDataToSend.append(
          "questionsPerStudent",
          formData.questionsPerStudent
        );
      }

      if (file) {
        formDataToSend.append("excelFile", file);
      }

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/tests/create`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage({ type: "success", text: "Test created successfully!" });
      setFormData({
        title: "",
        description: "",
        duration: "",
        scheduledAt: "",
        branch: "",
        questionsPerStudent: "",
      });
      setFile(null);

      if (onTestCreated) {
        onTestCreated();
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to create test",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState(new Date());
  const [month, setMonth] = React.useState(new Date());
  const [value, setValue] = React.useState(formatDate(new Date()));

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Create New Test
        </h2>
        <p className="text-gray-600">
          Upload an Excel file with questions or create a test manually
        </p>
      </div>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center ${
            message.type === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
          )}
          <span
            className={
              message.type === "success" ? "text-green-700" : "text-red-700"
            }
          >
            {message.text}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Test Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
              placeholder="Enter test title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Duration (minutes)
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                placeholder="60"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Questions Per Student
            </label>
            <input
              type="number"
              name="questionsPerStudent"
              value={formData.questionsPerStudent}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
              placeholder="Leave empty for all questions"
              min="1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Number of random questions each student will receive
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
            placeholder="Enter test description"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Branch
          </label>
          <textarea
            name="branch"
            value={formData.branch}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
            placeholder="Enter test branch"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Scheduled At
          </label>
          <div className="relative flex gap-2">
            <Input
              id="date"
              value={value}
              placeholder="June 31, 2025"
              className="bg-background pr-10"
              onChange={(e) => {
                const date = new Date(e.target.value);
                setValue(e.target.value);
                if (isValidDate(date)) {
                  setDate(date);
                  setMonth(date);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setOpen(true);
                }
              }}
            />
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="date-picker"
                  variant="ghost"
                  className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                >
                  <CalendarIcon className="size-3.5" />
                  <span className="sr-only">Select date</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden p-0"
                align="end"
                alignOffset={-8}
                sideOffset={10}
              >
                <Calendar
                  mode="single"
                  selected={date}
                  captionLayout="dropdown"
                  month={month}
                  onMonthChange={setMonth}
                  onSelect={(date) => {
                    setDate(date);
                    setValue(formatDate(date));
                    setOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Upload Excel File (Optional)
          </label>
          <div
            className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${
              dragActive
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="text-center">
              {file ? (
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <FileText className="w-8 h-8" />
                  <div>
                    <p className="font-semibold">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-700 mb-2">
                    Drop your Excel file here
                  </p>
                  <p className="text-gray-500">
                    or click to browse files (.xlsx, .xls)
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-50/50 p-5 shadow-sm">
            <div className="flex items-center gap-3 border-b border-blue-100/50 pb-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg shadow-sm">
                <Code className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-bold text-gray-800">
                Excel File Format Guide
              </h4>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              {[
                {
                  label: "question",
                  desc: "The main question text (Required)",
                  required: true,
                },
                {
                  label: "optionA...D",
                  desc: "Answer choices (Required)",
                  required: true,
                },
                {
                  label: "correctAnswer",
                  desc: "Number 1-4 indicating correct option",
                  required: true,
                },
                { label: "code", desc: "Code snippet to display" },
                { label: "image", desc: "Image URL for visual questions" },
                { label: "language", desc: "Prog. language for highlighting" },
                { label: "points", desc: "Score value (default: 1)" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col bg-white/60 p-3 rounded-lg border border-blue-50 hover:bg-white transition-colors hover:shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100/50 px-2 py-1 rounded border border-blue-100">
                      {item.label}
                    </span>
                    {item.required && (
                      <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">
                        Req
                      </span>
                    )}
                  </div>
                  <span className="text-gray-600 text-xs leading-relaxed pl-1">
                    {item.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
              Creating Test...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Plus className="w-5 h-5 mr-2" />
              Create Test
            </div>
          )}
        </button>
      </form>
    </div>
  );
}

export default CreateTest;
