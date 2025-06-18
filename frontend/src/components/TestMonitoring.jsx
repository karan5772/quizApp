import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Monitor,
  Users,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

function TestMonitoring({ tests }) {
  const [selectedTest, setSelectedTest] = useState("");
  const [activeAttempts, setActiveAttempts] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    if (tests.length > 0 && !selectedTest) {
      const activeTest = tests.find((test) => test.isActive);
      if (activeTest) {
        setSelectedTest(activeTest._id);
      }
    }
  }, [tests, selectedTest]);

  useEffect(() => {
    if (selectedTest) {
      fetchActiveAttempts();
      // Set up auto-refresh every 10 seconds
      const interval = setInterval(fetchActiveAttempts, 10000);
      setRefreshInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [selectedTest]);

  const fetchActiveAttempts = async () => {
    if (!selectedTest) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/tests/${selectedTest}/active-attempts`
      );
      setActiveAttempts(response.data);
    } catch (error) {
      console.error("Error fetching active attempts:", error);
    } finally {
      setLoading(false);
    }
  };

  const viewStudentAttempt = async (studentId) => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/tests/${selectedTest}/student/${studentId}/attempt`
      );
      setSelectedAttempt(response.data);
    } catch (error) {
      console.error("Error fetching student attempt:", error);
    }
  };

  const formatTimeElapsed = (startTime) => {
    const elapsed = Math.floor(
      (Date.now() - new Date(startTime).getTime()) / 1000
    );
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getAnsweredCount = (attempt) => {
    if (!attempt.answers) return 0;
    return attempt.answers.filter(
      (answer) =>
        answer.selectedAnswer !== null && answer.selectedAnswer !== undefined
    ).length;
  };

  const activeTests = tests.filter((test) => test.isActive);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Live Test Monitoring
            </h2>
            <p className="text-gray-600">
              Monitor students taking tests in real-time
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            >
              <option value="">Select an active test</option>
              {activeTests.map((test) => (
                <option key={test._id} value={test._id}>
                  {test.title}
                </option>
              ))}
            </select>
            <button
              onClick={fetchActiveAttempts}
              disabled={!selectedTest || loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {selectedTest && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Attempts List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Active Students
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{activeAttempts.length} students taking test</span>
                </div>
              </div>

              {activeAttempts.length > 0 ? (
                <div className="space-y-3">
                  {activeAttempts.map((attempt) => (
                    <div
                      key={attempt._id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => viewStudentAttempt(attempt.studentId._id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {attempt.studentId.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            ID: {attempt.studentId.studentId}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1 text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium">ACTIVE</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{formatTimeElapsed(attempt.startedAt)}</span>
                          </div>
                          <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            <span>{getAnsweredCount(attempt)} answered</span>
                          </div>
                        </div>
                        <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-700">
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-gray-200 rounded-xl">
                  <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    No Active Students
                  </h3>
                  <p className="text-gray-600">
                    No students are currently taking this test
                  </p>
                </div>
              )}
            </div>

            {/* Student Detail View */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Student Details
              </h3>

              {selectedAttempt ? (
                <div className="border border-gray-200 rounded-xl p-6">
                  <div className="mb-6">
                    <h4 className="text-xl font-semibold text-gray-800 mb-2">
                      {selectedAttempt.studentId.name}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Student ID:</span>
                        <span className="ml-2 font-medium">
                          {selectedAttempt.studentId.studentId}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <span className="ml-2 font-medium">
                          {selectedAttempt.studentId.email}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Started:</span>
                        <span className="ml-2 font-medium">
                          {new Date(
                            selectedAttempt.startedAt
                          ).toLocaleTimeString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Time Elapsed:</span>
                        <span className="ml-2 font-medium">
                          {formatTimeElapsed(selectedAttempt.startedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="font-semibold text-gray-800">
                      Question Progress
                    </h5>
                    <div className="grid gap-3 max-h-96 overflow-y-auto">
                      {selectedAttempt.testId.questions.map(
                        (question, index) => {
                          const answer = selectedAttempt.answers[index];
                          const isAnswered =
                            answer &&
                            answer.selectedAnswer !== null &&
                            answer.selectedAnswer !== undefined;

                          return (
                            <div
                              key={index}
                              className={`p-3 rounded-lg border ${
                                isAnswered
                                  ? "bg-green-50 border-green-200"
                                  : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-800">
                                  Question {index + 1}
                                </span>
                                <div className="flex items-center space-x-2">
                                  {isAnswered ? (
                                    <>
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                      <span className="text-sm text-green-700">
                                        Option {answer.selectedAnswer + 1}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle className="w-4 h-4 text-gray-400" />
                                      <span className="text-sm text-gray-500">
                                        Not answered
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mt-1 truncate">
                                {question.question}
                              </p>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border border-gray-200 rounded-xl">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    Select a Student
                  </h3>
                  <p className="text-gray-600">
                    Click on a student from the list to view their progress
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {!selectedTest && (
          <div className="text-center py-12">
            <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              No Active Tests
            </h3>
            <p className="text-gray-600">
              Create and activate a test to start monitoring students
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TestMonitoring;
