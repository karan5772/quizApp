import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import CreateTest from "./CreateTest";
import TestAnalytics from "./TestAnalytics";
import StudentManagement from "./StudentManagement";
import TestMonitoring from "./TestMonitoring";
import {
  BarChart3,
  Users,
  FileText,
  Plus,
  LogOut,
  Clock,
  TrendingUp,
  GraduationCap,
  Activity,
  Monitor,
} from "lucide-react";

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({
    totalTests: 0,
    totalStudents: 0,
    totalAttempts: 0,
    recentAttempts: [],
  });
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchTests();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/analytics/dashboard`
      );
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const fetchTests = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/tests` // yaha ye testNames Nishyant Sir ka hai, hata dena
      );
      setTests(response.data);
    } catch (error) {
      console.error("Error fetching tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEndTest = async (testId) => {
    if (
      window.confirm(
        "Are you sure you want to end this test? All active students will be forced to submit."
      )
    ) {
      try {
        await axios.patch(
          `${import.meta.env.VITE_BACKEND_URL}/api/tests/${testId}/end`
        );
        fetchTests();
        alert("Test ended successfully");
      } catch (error) {
        console.error("Error ending test:", error);
        alert("Failed to end test");
      }
    }
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "tests", label: "Tests", icon: FileText },
    { id: "create", label: "Create Test", icon: Plus },
    { id: "monitoring", label: "Live Monitoring", icon: Monitor },
    { id: "students", label: "Students", icon: Users },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl mr-3 shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Test Platform Admin
                </h1>
                <p className="text-sm text-gray-600">
                  Manage tests and students
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome Back</p>
                <p className="font-semibold text-gray-800">{user.name} </p>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all ${
                        activeTab === tab.id
                          ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200 shadow-sm"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Total Tests
                        </p>
                        <p className="text-3xl font-bold text-gray-800 mt-1">
                          {stats.totalTests}
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          Active tests
                        </p>
                      </div>
                      <div className="bg-blue-100 p-3 rounded-xl">
                        <FileText className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Total Students
                        </p>
                        <p className="text-3xl font-bold text-gray-800 mt-1">
                          {stats.totalStudents}
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          Registered users
                        </p>
                      </div>
                      <div className="bg-green-100 p-3 rounded-xl">
                        <Users className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Total Attempts
                        </p>
                        <p className="text-3xl font-bold text-gray-800 mt-1">
                          {stats.totalAttempts}
                        </p>
                        <p className="text-sm text-purple-600 mt-1">
                          Test submissions
                        </p>
                      </div>
                      <div className="bg-purple-100 p-3 rounded-xl">
                        <Activity className="w-8 h-8 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800">
                      Recent Test Attempts
                    </h3>
                    <TrendingUp className="w-5 h-5 text-gray-400" />
                  </div>

                  {stats.recentAttempts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Student
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Test
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Score
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {stats.recentAttempts.map((attempt, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {attempt.studentName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {attempt.testTitle}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span
                                  className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                    attempt.percentage >= 60
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {attempt.percentage.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(
                                  attempt.completedAt
                                ).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No recent test attempts</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "tests" && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      All Tests
                    </h2>
                    <p className="text-gray-600">
                      Manage and monitor your tests
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("create")}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center space-x-2 shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Test</span>
                  </button>
                </div>

                {tests.length > 0 ? (
                  <div className="grid gap-6">
                    {tests.map((test) => (
                      <div
                        key={test._id}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                              {test.title}
                            </h3>
                            {test.description && (
                              <p className="text-gray-600 mb-3">
                                {test.description}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                test.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {test.isActive ? "Active" : "Ended"}
                            </span>
                            {test.isActive && (
                              <button
                                onClick={() => handleEndTest(test._id)}
                                className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-red-600 transition-colors"
                              >
                                End Test
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {test.duration} minutes
                          </div>
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-1" />
                            {test.questions.length} questions
                          </div>
                          <div>
                            Created:{" "}
                            {new Date(test.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      No tests created yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Create your first test to get started
                    </p>
                    <button
                      onClick={() => setActiveTab("create")}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center space-x-2 mx-auto shadow-lg"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Test</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "create" && (
              <CreateTest onTestCreated={fetchTests} />
            )}
            {activeTab === "monitoring" && <TestMonitoring tests={tests} />}
            {activeTab === "students" && <StudentManagement />}
            {activeTab === "analytics" && <TestAnalytics tests={tests} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
