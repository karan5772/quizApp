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
  ChevronLeft,
  X,
} from "lucide-react";

function TestMonitoring({ tests }) {
  const [selectedTest, setSelectedTest] = useState("");
  const [activeAttempts, setActiveAttempts] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

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
      setShowMobileDetail(true);
    } catch (error) {
      console.error("Error fetching student attempt:", error);
    }
  };

  const closeMobileDetail = () => {
    setShowMobileDetail(false);
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
      {/* Mobile Detail Overlay */}
      {showMobileDetail && selectedAttempt && (
        <div className="fixed inset-0 bg-white z-50 lg:hidden overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
            <button
              onClick={closeMobileDetail}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              <span className="font-medium">Back</span>
            </button>
            <h3 className="font-semibold text-gray-800">Student Details</h3>
            <button
              onClick={closeMobileDetail}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="p-4">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                  {selectedAttempt.studentId.name?.charAt(0)?.toUpperCase() ||
                    "S"}
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-800">
                    {selectedAttempt.studentId.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    ID: {selectedAttempt.studentId.studentId}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Email</span>
                  <span className="text-sm font-medium text-gray-800 truncate ml-2 max-w-[60%] text-right">
                    {selectedAttempt.studentId.email}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Started</span>
                  <span className="text-sm font-medium text-gray-800">
                    {new Date(selectedAttempt.startedAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Time Elapsed</span>
                  <span className="text-sm font-medium text-gray-800">
                    {formatTimeElapsed(selectedAttempt.startedAt)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-sm font-medium text-gray-800">
                    {getAnsweredCount(selectedAttempt)} /{" "}
                    {selectedAttempt.testId.questions.length} answered
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="font-semibold text-gray-800">Question Progress</h5>
              <div className="grid gap-3">
                {selectedAttempt.testId.questions.map((question, index) => {
                  const answer = selectedAttempt.answers[index];
                  const isAnswered =
                    answer &&
                    answer.selectedAnswer !== null &&
                    answer.selectedAnswer !== undefined;

                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-xl border ${
                        isAnswered
                          ? "bg-green-50 border-green-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-800 text-sm">
                          Question {index + 1}
                        </span>
                        <div className="flex items-center space-x-2">
                          {isAnswered ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-xs text-green-700 font-medium">
                                Option {answer.selectedAnswer + 1}
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                Not answered
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {question.question}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">
              Live Test Monitoring
            </h2>
            <p className="text-sm text-gray-600">
              Monitor students taking tests in real-time
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-sm w-full sm:w-auto"
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
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h3 className="text-base md:text-lg font-semibold text-gray-800">
                  Active Students
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
                  <Users className="w-4 h-4" />
                  <span>{activeAttempts.length} taking test</span>
                </div>
              </div>

              {activeAttempts.length > 0 ? (
                <div className="space-y-3">
                  {activeAttempts.map((attempt) => (
                    <div
                      key={attempt._id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer active:bg-gray-50"
                      onClick={() => viewStudentAttempt(attempt.studentId._id)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                            {attempt.studentId.name?.charAt(0)?.toUpperCase() ||
                              "S"}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-gray-800 truncate">
                              {attempt.studentId.name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              ID: {attempt.studentId.studentId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 text-green-600 shrink-0">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium hidden sm:inline">
                            ACTIVE
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm text-gray-600">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="flex items-center bg-gray-50 px-2 py-1 rounded-lg">
                            <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                            <span>{formatTimeElapsed(attempt.startedAt)}</span>
                          </div>
                          <div className="flex items-center bg-gray-50 px-2 py-1 rounded-lg">
                            <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                            <span>{getAnsweredCount(attempt)} done</span>
                          </div>
                        </div>
                        <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium">
                          <Eye className="w-3 h-3 md:w-4 md:h-4" />
                          <span className="hidden sm:inline">View Details</span>
                          <span className="sm:hidden">View</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 md:py-12 border border-gray-200 rounded-xl bg-gray-50/50">
                  <Monitor className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base md:text-lg font-medium text-gray-800 mb-2">
                    No Active Students
                  </h3>
                  <p className="text-sm text-gray-600 px-4">
                    No students are currently taking this test
                  </p>
                </div>
              )}
            </div>

            {/* Desktop Student Detail View */}
            <div className="hidden lg:block space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Student Details
              </h3>

              {selectedAttempt ? (
                <div className="border border-gray-200 rounded-xl p-6">
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                        {selectedAttempt.studentId.name
                          ?.charAt(0)
                          ?.toUpperCase() || "S"}
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-gray-800">
                          {selectedAttempt.studentId.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          ID: {selectedAttempt.studentId.studentId}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-xl p-4">
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <span className="ml-2 font-medium block truncate">
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
                      <div>
                        <span className="text-gray-600">Progress:</span>
                        <span className="ml-2 font-medium">
                          {getAnsweredCount(selectedAttempt)} /{" "}
                          {selectedAttempt.testId.questions.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="font-semibold text-gray-800">
                      Question Progress
                    </h5>
                    <div className="grid gap-3 max-h-96 overflow-y-auto pr-2">
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
                              className={`p-3 rounded-xl border ${
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
                <div className="text-center py-12 border border-gray-200 rounded-xl bg-gray-50/50">
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

            {/* Mobile hint for viewing details */}
            <div className="lg:hidden text-center py-4 text-sm text-gray-500">
              <Eye className="w-4 h-4 inline-block mr-1" />
              Tap on a student to view their progress
            </div>
          </div>
        )}

        {!selectedTest && (
          <div className="text-center py-12 md:py-16">
            <div className="bg-gray-100 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Monitor className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
            </div>
            <h3 className="text-base md:text-lg font-medium text-gray-800 mb-2">
              No Active Tests
            </h3>
            <p className="text-sm text-gray-600 max-w-sm mx-auto">
              Create and activate a test to start monitoring students
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TestMonitoring;
