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
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function TestAnalytics({ tests }) {
  const [selectedTest, setSelectedTest] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [availableBranches, setAvailableBranches] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [allResults, setAllResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);

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

      const flattenedAttempts = results.flatMap((result) =>
        result.attempts.map((attempt) => ({
          ...attempt,
          testId: result.testId,
          testTitle: result.testTitle,
          testDescription: result.testDescription,
        }))
      );

      const branches = [
        ...new Set(results.flatMap((r) => r.availableBranches)),
      ];
      setAvailableBranches(branches);

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
      await exportAllResults();
    } else if (selectedTest) {
      await exportSingleTest();
    }
  };

  const exportAllResults = async () => {
    try {
      const params = selectedBranch ? `?branch=${selectedBranch}` : "";

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
          name: "<60%",
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

  // For mobile, show limited results initially
  const displayedAttempts = currentData?.attempts
    ? showAllResults
      ? currentData.attempts.sort((a, b) => b.percentage - a.percentage)
      : currentData.attempts
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 5)
    : [];

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 md:w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-20 md:h-24 bg-gray-200 rounded-xl"
              ></div>
            ))}
          </div>
          <div className="h-48 md:h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-5xl">
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-200">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">
              {selectedTest === "all"
                ? "All Tests Analytics"
                : "Test Analytics"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedTest === "all"
                ? "Comprehensive view of all test results"
                : analytics?.questionsPerStudent
                ? `${analytics.questionsPerStudent} random questions per student from a pool of ${analytics.totalQuestions} questions`
                : "Detailed performance insights and statistics"}
            </p>
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-col gap-3">
            {/* Test Selection */}
            <div className="relative w-full">
              <List className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedTest}
                onChange={(e) => {
                  setSelectedTest(e.target.value);
                  setSelectedBranch("");
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-sm"
              >
                <option value="all">📊 All Tests</option>
                <option disabled>──────────</option>
                {tests.map((test) => (
                  <option key={test._id} value={test._id}>
                    {test.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Branch Filter */}
              {availableBranches.length > 0 && (
                <div className="relative flex-1">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-sm"
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
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2.5 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm font-medium flex-1 sm:flex-initial"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {selectedTest === "all" ? "Export All" : "Export Excel"}
                </span>
                <span className="sm:hidden">Export</span>
              </button>
            </div>
          </div>
        </div>

        {currentData &&
          currentData.attempts &&
          currentData.attempts.length > 0 && (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-3 md:p-6 border border-blue-200">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                    <div>
                      <p className="text-xs md:text-sm font-semibold text-blue-600">
                        Total Attempts
                      </p>
                      <p className="text-xl md:text-3xl font-bold text-blue-800">
                        {currentData.totalAttempts}
                      </p>
                    </div>
                    <Users className="w-6 h-6 md:w-8 md:h-8 text-blue-600 hidden md:block" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-3 md:p-6 border border-green-200">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                    <div>
                      <p className="text-xs md:text-sm font-semibold text-green-600">
                        Average Score
                      </p>
                      <p className="text-xl md:text-3xl font-bold text-green-800">
                        {(currentData.averageScore ?? 0).toFixed(1)}%
                      </p>
                    </div>
                    <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-green-600 hidden md:block" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-3 md:p-6 border border-yellow-200">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                    <div>
                      <p className="text-xs md:text-sm font-semibold text-yellow-600">
                        Highest Score
                      </p>
                      <p className="text-xl md:text-3xl font-bold text-yellow-800">
                        {(currentData.highestScore ?? 0).toFixed(1)}%
                      </p>
                    </div>
                    <Award className="w-6 h-6 md:w-8 md:h-8 text-yellow-600 hidden md:block" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-3 md:p-6 border border-purple-200">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                    <div>
                      <p className="text-xs md:text-sm font-semibold text-purple-600">
                        Pass Rate
                      </p>
                      <p className="text-xl md:text-3xl font-bold text-purple-800">
                        {(currentData.passRate ?? 0).toFixed(1)}%
                      </p>
                    </div>
                    <Calendar className="w-6 h-6 md:w-8 md:h-8 text-purple-600 hidden md:block" />
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8">
                <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
                  <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4">
                    Score Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
                  <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4">
                    Pass/Fail Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={passFailData}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
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

              {/* Detailed Results */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                  <h3 className="text-base md:text-lg font-semibold text-gray-800">
                    {selectedTest === "all"
                      ? "All Student Results"
                      : "All Student Scores"}
                    {selectedBranch && (
                      <span className="text-xs md:text-sm font-normal text-gray-600 ml-2">
                        ({selectedBranch})
                      </span>
                    )}
                  </h3>
                  <span className="text-xs md:text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                    {currentData.attempts.length} result
                    {currentData.attempts.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Branch
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Percentage
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
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
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {attempt.studentName}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {attempt.studentId}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                {attempt.branch || "N/A"}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {attempt.score}/{attempt.totalPoints}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {Math.floor(attempt.timeSpent / 60)}:
                              {String(attempt.timeSpent % 60).padStart(2, "0")}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {displayedAttempts.map((attempt, index) => (
                    <div
                      key={`${attempt.testId}-${attempt.studentId}-${index}`}
                      className={`border rounded-xl p-4 ${
                        index < 3
                          ? "bg-yellow-50 border-yellow-200"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">
                            {index === 0 && "🥇"}
                            {index === 1 && "🥈"}
                            {index === 2 && "🥉"}
                            {index > 2 && (
                              <span className="text-sm text-gray-500 bg-gray-100 w-6 h-6 rounded-full flex items-center justify-center">
                                {index + 1}
                              </span>
                            )}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {attempt.studentName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {attempt.studentId}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            attempt.percentage >= 60
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {attempt.percentage >= 60 ? "Pass" : "Fail"}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white rounded-lg p-2 border border-gray-100">
                          <p className="text-xs text-gray-500">Score</p>
                          <p className="font-semibold text-sm">
                            {attempt.score}/{attempt.totalPoints}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-gray-100">
                          <p className="text-xs text-gray-500">Percent</p>
                          <p
                            className={`font-semibold text-sm ${
                              attempt.percentage >= 60
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {attempt.percentage.toFixed(1)}%
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-gray-100">
                          <p className="text-xs text-gray-500">Time</p>
                          <p className="font-semibold text-sm">
                            {Math.floor(attempt.timeSpent / 60)}:
                            {String(attempt.timeSpent % 60).padStart(2, "0")}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {attempt.branch || "N/A"}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Show More/Less Button for Mobile */}
                  {currentData.attempts.length > 5 && (
                    <button
                      onClick={() => setShowAllResults(!showAllResults)}
                      className="w-full py-3 text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      {showAllResults ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Show All ({currentData.attempts.length} results)
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Summary Stats Below Table */}
                <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <div className="text-center bg-gray-50 rounded-xl p-3">
                    <p className="text-xs md:text-sm text-gray-600">Highest</p>
                    <p className="text-lg md:text-2xl font-bold text-green-600">
                      {currentData.highestScore.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center bg-gray-50 rounded-xl p-3">
                    <p className="text-xs md:text-sm text-gray-600">Average</p>
                    <p className="text-lg md:text-2xl font-bold text-blue-600">
                      {currentData.averageScore.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center bg-gray-50 rounded-xl p-3">
                    <p className="text-xs md:text-sm text-gray-600">Lowest</p>
                    <p className="text-lg md:text-2xl font-bold text-red-600">
                      {currentData.lowestScore.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center bg-gray-50 rounded-xl p-3">
                    <p className="text-xs md:text-sm text-gray-600">
                      Pass Rate
                    </p>
                    <p className="text-lg md:text-2xl font-bold text-purple-600">
                      {currentData.passRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

        {currentData &&
          (!currentData.attempts || currentData.attempts.length === 0) && (
            <div className="text-center py-8 md:py-12">
              <FileText className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base md:text-lg font-medium text-gray-800 mb-2">
                No analytics data available
              </h3>
              <p className="text-sm text-gray-600 px-4">
                No students have taken{" "}
                {selectedTest === "all" ? "any tests" : "this test"} yet
                {selectedBranch && ` from ${selectedBranch} branch`}.
              </p>
            </div>
          )}

        {!currentData && (
          <div className="text-center py-8 md:py-12">
            <TrendingUp className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base md:text-lg font-medium text-gray-800 mb-2">
              Select a test to view analytics
            </h3>
            <p className="text-sm text-gray-600 px-4">
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
