import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BookOpen,
  Clock,
  PlayCircle,
  LogOut,
  User,
  Calendar,
  Award,
  GraduationCap,
  FileText,
} from "lucide-react";

function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/tests`
      );
      setTests(response.data);
    } catch (error) {
      console.error("Error fetching tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = (testId) => {
    navigate(`/test/${testId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl mr-3 shadow-lg shrink-0">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-bold text-gray-800 truncate">
                  BKBIET Portal
                </h1>
                <p className="text-xs md:text-sm text-gray-600 hidden sm:block">
                  Take your scheduled tests
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-gray-600">Welcome,</p>
                <p className="font-semibold text-gray-800">{user.name}</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Student Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6 md:mb-8 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4 text-center sm:text-left">
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-xl inline-flex">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1 w-full">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                {user.name}
              </h2>
              <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 mt-2 text-gray-600 text-sm md:text-base">
                <p>
                  ID: <span className="font-medium">{user.studentId}</span>
                </p>
                <span className="hidden sm:inline text-gray-300">|</span>
                <p>
                  Email: <span className="font-medium">{user.email}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Available Tests */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                Available Tests
              </h2>
              <p className="text-sm md:text-base text-gray-600">
                Take your scheduled tests below
              </p>
            </div>
            <div className="flex items-center space-x-2 text-gray-500 text-xs md:text-sm">
              <Clock className="w-4 h-4 md:w-5 md:h-5" />
              <span>Tests are ordered by date</span>
            </div>
          </div>
          {tests.length === 0 ? (
            <div className="text-center py-12 md:py-16">
              <BookOpen className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                No tests available
              </h3>
              <p className="text-gray-600">
                Check back later for new assignments.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:gap-6">
              {tests.map((test) => (
                <div
                  key={test._id}
                  className="border border-gray-200 rounded-xl p-4 md:p-6 hover:shadow-md transition-all hover:border-gray-300"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
                          {test.title}
                        </h3>
                        {/* Mobile Badge displayed next to title only on small screens if desired, but sticking to bottom area works better for layout. 
                            Let's keep structure clean. */}
                      </div>
                      {test.description && (
                        <p className="text-sm md:text-base text-gray-600 mb-4 line-clamp-2 md:line-clamp-none">
                          {test.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 md:gap-6 text-xs md:text-sm text-gray-600">
                        <div className="flex items-center bg-gray-50 px-2 py-1 rounded md:bg-transparent md:px-0 md:py-0">
                          <Clock className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                          <span>{test.duration} mins</span>
                        </div>
                        <div className="flex items-center bg-gray-50 px-2 py-1 rounded md:bg-transparent md:px-0 md:py-0">
                          <FileText className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                          <span>{test.questions.length} Qs</span>
                        </div>
                        {test.scheduledAt && (
                          <div className="flex items-center w-full sm:w-auto mt-1 sm:mt-0">
                            <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                            <span>
                              Scheduled: {formatDate(test.scheduledAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 mt-2 md:mt-0">
                      <span
                        className={`px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium whitespace-nowrap ${
                          test.isActive
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : "bg-gray-100 text-gray-800 border border-gray-200"
                        }`}
                      >
                        {test.isActive ? "Active" : "Inactive"}
                      </span>

                      {test.isActive && (
                        <button
                          onClick={() => handleStartTest(test._id)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center space-x-2 shadow-lg text-sm md:text-base flex-1 md:flex-initial"
                        >
                          <PlayCircle className="w-4 h-4" />
                          <span>Start Test</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Test Stats Preview */}
                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-gray-500">
                      <div className="flex items-center">
                        <Award className="w-4 h-4 mr-1" />
                        <span>
                          Total Points:{" "}
                          {test.questions.reduce((sum, q) => sum + q.points, 0)}
                        </span>
                      </div>
                      <div className="hidden sm:block text-gray-300">|</div>
                      <div>
                        Created: {new Date(test.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
