import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Download,
  TrendingUp,
  Users,
  Award,
  Calendar,
  FileText,
  Filter,
  List,
} from "lucide-react";

function TestAnalytics({ tests }) {
  const [selectedTest, setSelectedTest] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [availableBranches, setAvailableBranches] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [allResults, setAllResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedTest === "all") {
      fetchAllResults();
    } else if (selectedTest) {
      fetchAnalytics();
    }
  }, [selectedTest, selectedBranch]);

  const fetchAllResults = async () => {
    setLoading(true);
    try {
      // Fetch all test attempts across all tests
      const results = await Promise.all(
        tests.map(async (test) => {
          try {
            const params = selectedBranch ? `?branch=${selectedBranch}` : "";
            const response = await axios.get(
              `${import.meta.env.VITE_BACKEND_URL}/api/analytics/test/${
                test._id
              }${params}`
            );
            return {
              testId: test._id,
              testTitle: test.title || test.description,
              testDescription: test.description,
              attempts: response.data.attempts || [],
              availableBranches: response.data.availableBranches || [],
            };
          } catch (error) {
            console.error(`Error fetching test ${test._id}:`, error);
            return {
              testId: test._id,
              testTitle: test.title || test.description,
              testDescription: test.description,
              attempts: [],
              availableBranches: [],
            };
          }
        })
      );

      // Flatten all attempts
      const flattenedAttempts = results.flatMap((result) =>
        result.attempts.map((attempt) => ({
          ...attempt,
          testId: result.testId,
          testTitle: result.testTitle,
          testDescription: result.testDescription,
        }))
      );

      // Get unique branches
      const branches = [
        ...new Set(results.flatMap((r) => r.availableBranches)),
      ];
      setAvailableBranches(branches);

      // Calculate overall statistics
      const overallStats = {
        totalAttempts: flattenedAttempts.length,
        averageScore:
          flattenedAttempts.length > 0
            ? flattenedAttempts.reduce(
                (sum, attempt) => sum + attempt.percentage,
                0
              ) / flattenedAttempts.length
            : 0,
        highestScore:
          flattenedAttempts.length > 0
            ? Math.max(...flattenedAttempts.map((a) => a.percentage))
            : 0,
        lowestScore:
          flattenedAttempts.length > 0
            ? Math.min(...flattenedAttempts.map((a) => a.percentage))
            : 0,
        passRate:
          flattenedAttempts.length > 0
            ? (flattenedAttempts.filter((a) => a.percentage >= 60).length /
                flattenedAttempts.length) *
              100
            : 0,
        attempts: flattenedAttempts,
      };

      setAllResults(overallStats);
      setAnalytics(null);
    } catch (error) {
      console.error("Error fetching all results:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!selectedTest || selectedTest === "all") return;

    setLoading(true);
    try {
      const params = selectedBranch ? `?branch=${selectedBranch}` : "";
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/analytics/test/${selectedTest}${params}`
      );
      setAnalytics(response.data);
      setAllResults(null);

      if (response.data.availableBranches) {
        setAvailableBranches(response.data.availableBranches);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (selectedTest === "all") {
      // Export all results
      await exportAllResults();
    } else if (selectedTest) {
      // Export single test results
      await exportSingleTest();
    }
  };

  const exportAllResults = async () => {
    try {
      // Create a comprehensive export for all tests
      const params = selectedBranch ? `?branch=${selectedBranch}` : "";

      // For now, export each test separately
      for (const test of tests) {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/analytics/export/${
            test._id
          }${params}`,
          { responseType: "blob" }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        const filename = selectedBranch
          ? `${test.description}-${selectedBranch}.xlsx`
          : `${test.description}.xlsx`;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();

        // Small delay between downloads
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error("Error exporting all results:", error);
    }
  };

  const exportSingleTest = async () => {
    try {
      const params = selectedBranch ? `?branch=${selectedBranch}` : "";
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/analytics/export/${selectedTest}${params}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const filename = selectedBranch
        ? `test-results-${selectedBranch}-${selectedTest}.xlsx`
        : `test-results-${selectedTest}.xlsx`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting results:", error);
    }
  };

  const currentData = selectedTest === "all" ? allResults : analytics;

  const scoreDistribution = currentData?.attempts
    ? [
        {
          name: "90-100%",
          count: currentData.attempts.filter((a) => a.percentage >= 90).length,
        },
        {
          name: "80-89%",
          count: currentData.attempts.filter(
            (a) => a.percentage >= 80 && a.percentage < 90
          ).length,
        },
        {
          name: "70-79%",
          count: currentData.attempts.filter(
            (a) => a.percentage >= 70 && a.percentage < 80
          ).length,
        },
        {
          name: "60-69%",
          count: currentData.attempts.filter(
            (a) => a.percentage >= 60 && a.percentage < 70
          ).length,
        },
        {
          name: "Below 60%",
          count: currentData.attempts.filter((a) => a.percentage < 60).length,
        },
      ]
    : [];

  const passFailData = currentData?.attempts
    ? [
        {
          name: "Pass",
          value: currentData.attempts.filter((a) => a.percentage >= 60).length,
          color: "#10B981",
        },
        {
          name: "Fail",
          value: currentData.attempts.filter((a) => a.percentage < 60).length,
          color: "#EF4444",
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {selectedTest === "all"
                ? "All Tests Analytics"
                : "Test Analytics"}
            </h2>
            <p className="text-gray-600">
              {selectedTest === "all"
                ? "Comprehensive view of all test results"
                : "Detailed performance insights and statistics"}
              {selectedBranch && (
                <span className="ml-2 text-blue-600 font-medium">
                  • {selectedBranch}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
            {/* Test Selection */}
            <div className="relative">
              <List className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedTest}
                onChange={(e) => {
                  setSelectedTest(e.target.value);
                  setSelectedBranch("");
                }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              >
                <option value="all">📊 All Tests</option>
                <option disabled>──────────</option>
                {tests.map((test) => (
                  <option key={test._id} value={test._id}>
                    {test.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch Filter */}
            {availableBranches.length > 0 && (
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                >
                  <option value="">All Branches</option>
                  {availableBranches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={!currentData || currentData.attempts?.length === 0}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <Download className="w-4 h-4" />
              <span>
                {selectedTest === "all" ? "Export All Tests" : "Export Excel"}
              </span>
            </button>
          </div>
        </div>

        {currentData &&
          currentData.attempts &&
          currentData.attempts.length > 0 && (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-blue-600">
                        Total Attempts
                      </p>
                      <p className="text-3xl font-bold text-blue-800">
                        {currentData.totalAttempts}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-green-600">
                        Average Score
                      </p>
                      <p className="text-3xl font-bold text-green-800">
                        {(currentData.averageScore ?? 0).toFixed(1)}%
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-yellow-600">
                        Highest Score
                      </p>
                      <p className="text-3xl font-bold text-yellow-800">
                        {(currentData.highestScore ?? 0).toFixed(1)}%
                      </p>
                    </div>
                    <Award className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-purple-600">
                        Pass Rate
                      </p>
                      <p className="text-3xl font-bold text-purple-800">
                        {(currentData.passRate ?? 0).toFixed(1)}%
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Score Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Pass/Fail Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={passFailData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {passFailData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Detailed Results Table */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {selectedTest === "all"
                      ? "All Student Results Across All Tests"
                      : "All Student Scores"}
                    {selectedBranch && (
                      <span className="text-sm font-normal text-gray-600 ml-2">
                        ({selectedBranch} Branch)
                      </span>
                    )}
                  </h3>
                  <span className="text-sm text-gray-600">
                    Showing {currentData.attempts.length} result
                    {currentData.attempts.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rank
                        </th>

                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Branch
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Percentage
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time Spent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentData.attempts
                        .sort((a, b) => b.percentage - a.percentage)
                        .map((attempt, index) => (
                          <tr
                            key={`${attempt.testId}-${attempt.studentId}-${index}`}
                            className={`hover:bg-gray-50 ${
                              index < 3 ? "bg-yellow-50" : ""
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                              {index === 0 && (
                                <span className="text-yellow-600">🥇 1st</span>
                              )}
                              {index === 1 && (
                                <span className="text-gray-400">🥈 2nd</span>
                              )}
                              {index === 2 && (
                                <span className="text-orange-600">🥉 3rd</span>
                              )}
                              {index > 2 && (
                                <span className="text-gray-600">
                                  {index + 1}
                                </span>
                              )}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {attempt.studentName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {attempt.studentId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                {attempt.branch || "N/A"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {attempt.score}/{attempt.totalPoints}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                  attempt.percentage >= 90
                                    ? "bg-green-100 text-green-800"
                                    : attempt.percentage >= 80
                                    ? "bg-blue-100 text-blue-800"
                                    : attempt.percentage >= 70
                                    ? "bg-yellow-100 text-yellow-800"
                                    : attempt.percentage >= 60
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {attempt.percentage.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {Math.floor(attempt.timeSpent / 60)}:
                              {String(attempt.timeSpent % 60).padStart(2, "0")}{" "}
                              min
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                  attempt.percentage >= 60
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {attempt.percentage >= 60 ? "✓ Pass" : "✗ Fail"}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Stats Below Table */}
                <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Highest</p>
                    <p className="text-2xl font-bold text-green-600">
                      {currentData.highestScore.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Average</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {currentData.averageScore.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Lowest</p>
                    <p className="text-2xl font-bold text-red-600">
                      {currentData.lowestScore.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Pass Rate</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {currentData.passRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

        {currentData &&
          (!currentData.attempts || currentData.attempts.length === 0) && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                No analytics data available
              </h3>
              <p className="text-gray-600">
                No students have taken{" "}
                {selectedTest === "all" ? "any tests" : "this test"} yet
                {selectedBranch && ` from ${selectedBranch} branch`}.
              </p>
            </div>
          )}

        {!currentData && (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Select a test to view analytics
            </h3>
            <p className="text-gray-600">
              Choose a test from the dropdown above or select "All Tests" to see
              comprehensive data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TestAnalytics;
