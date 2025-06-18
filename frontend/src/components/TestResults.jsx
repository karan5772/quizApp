import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, Award, Home, BarChart3, Trophy, Target } from 'lucide-react';

function TestResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { result, testTitle } = location.state || {};

  if (!result) {
    navigate('/');
    return null;
  }

  const { score, totalPoints, percentage } = result;
  const isPassed = percentage >= 60;

  const getGradeColor = () => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeBg = () => {
    if (percentage >= 90) return 'bg-green-50 border-green-200';
    if (percentage >= 80) return 'bg-blue-50 border-blue-200';
    if (percentage >= 70) return 'bg-yellow-50 border-yellow-200';
    if (percentage >= 60) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getGrade = () => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'A-';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 65) return 'B-';
    if (percentage >= 60) return 'C';
    return 'F';
  };

  const getPerformanceMessage = () => {
    if (percentage >= 90) return { title: 'Outstanding Performance!', message: 'You demonstrated exceptional knowledge and skills.' };
    if (percentage >= 80) return { title: 'Excellent Work!', message: 'You showed strong understanding of the material.' };
    if (percentage >= 70) return { title: 'Good Performance!', message: 'You have a solid grasp of the concepts.' };
    if (percentage >= 60) return { title: 'Satisfactory Performance', message: 'You passed, but there\'s room for improvement.' };
    return { title: 'Areas for Improvement', message: 'Consider reviewing the material and practicing more.' };
  };

  const performanceData = getPerformanceMessage();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Test Results</h1>
              <p className="text-sm text-gray-600">{testTitle}</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <Home className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Result Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-200">
          <div className="text-center mb-8">
            <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg ${
              isPassed ? 'bg-gradient-to-r from-green-100 to-emerald-100' : 'bg-gradient-to-r from-red-100 to-pink-100'
            }`}>
              {isPassed ? (
                <Trophy className="w-12 h-12 text-green-600" />
              ) : (
                <Target className="w-12 h-12 text-red-600" />
              )}
            </div>
            
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {isPassed ? 'Congratulations!' : 'Keep Trying!'}
            </h2>
            <p className="text-gray-600 text-lg">
              {isPassed 
                ? 'You have successfully passed the test!' 
                : 'You did not pass this time, but don\'t give up!'
              }
            </p>
          </div>

          {/* Score Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
              <div className={`text-4xl font-bold mb-2 ${getGradeColor()}`}>
                {percentage.toFixed(1)}%
              </div>
              <p className="text-gray-600 font-medium">Your Score</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="text-4xl font-bold text-gray-800 mb-2">
                {score}/{totalPoints}
              </div>
              <p className="text-gray-600 font-medium">Points Earned</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
              <div className={`text-4xl font-bold mb-2 ${getGradeColor()}`}>
                {getGrade()}
              </div>
              <p className="text-gray-600 font-medium">Letter Grade</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-gray-700">Progress</span>
              <span className="text-sm font-semibold text-gray-700">{percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
              <div
                className={`h-4 rounded-full transition-all duration-1000 ${
                  isPassed 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                    : 'bg-gradient-to-r from-red-500 to-pink-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Status Banner */}
          <div className={`border-2 rounded-xl p-6 ${getGradeBg()}`}>
            <div className="flex items-center justify-center space-x-3">
              {isPassed ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <span className={`text-xl font-bold ${
                isPassed ? 'text-green-800' : 'text-red-800'
              }`}>
                {isPassed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
          </div>
        </div>

        {/* Test Information */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Test Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Student Name</p>
                <p className="font-semibold text-gray-800">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Student ID</p>
                <p className="font-semibold text-gray-800">{user.studentId}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Test Title</p>
                <p className="font-semibold text-gray-800">{testTitle}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Completion Date</p>
                <p className="font-semibold text-gray-800">
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Insights</h3>
          <div className="space-y-4">
            <div className={`flex items-start space-x-3 p-4 rounded-xl ${
              percentage >= 90 ? 'bg-green-50' :
              percentage >= 70 ? 'bg-blue-50' :
              percentage >= 60 ? 'bg-yellow-50' : 'bg-red-50'
            }`}>
              {percentage >= 90 ? (
                <Trophy className="w-5 h-5 text-green-600 mt-0.5" />
              ) : percentage >= 70 ? (
                <Award className="w-5 h-5 text-blue-600 mt-0.5" />
              ) : percentage >= 60 ? (
                <BarChart3 className="w-5 h-5 text-yellow-600 mt-0.5" />
              ) : (
                <Target className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div>
                <p className={`font-semibold ${
                  percentage >= 90 ? 'text-green-800' :
                  percentage >= 70 ? 'text-blue-800' :
                  percentage >= 60 ? 'text-yellow-800' : 'text-red-800'
                }`}>
                  {performanceData.title}
                </p>
                <p className={`text-sm ${
                  percentage >= 90 ? 'text-green-700' :
                  percentage >= 70 ? 'text-blue-700' :
                  percentage >= 60 ? 'text-yellow-700' : 'text-red-700'
                }`}>
                  {performanceData.message}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestResults;