import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import {
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Code,
} from "lucide-react";

function TestTaking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [test, setTest] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    fetchTest();

    // Disable right-click context menu
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener("contextmenu", handleContextMenu);

    // Disable text selection
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
    document.body.style.mozUserSelect = "none";
    document.body.style.msUserSelect = "none";

    // Disable keyboard shortcuts
    const handleKeyDown = (e) => {
      // Disable Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, F12, etc.
      if (
        (e.ctrlKey &&
          (e.key === "a" || e.key === "c" || e.key === "v" || e.key === "x")) ||
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.shiftKey && e.key === "J") ||
        (e.ctrlKey && e.key === "u")
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
      document.body.style.mozUserSelect = "";
      document.body.style.msUserSelect = "";
    };
  }, [id]);

  useEffect(() => {
    if (test && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [test, timeLeft]);

  const fetchTest = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/tests/${id}`
      );
      setTest(response.data);
      setTimeLeft(response.data.duration * 60); // Convert minutes to seconds

      // Initialize answers object
      const initialAnswers = {};
      response.data.questions.forEach((_, index) => {
        initialAnswers[index] = { selectedAnswer: null };
      });
      setAnswers(initialAnswers);
    } catch (error) {
      console.error("Error fetching test:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setAnswers({
      ...answers,
      [questionIndex]: { selectedAnswer: optionIndex },
    });
  };

  const handleSubmit = async () => {
    if (submitting) return;

    setSubmitting(true);
    const timeSpent = Date.now() - startTime;

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/tests/${id}/submit`,
        {
          answers: Object.values(answers),
          timeSpent: Math.floor(timeSpent / 1000), // Convert to seconds
        }
      );

      navigate(`/results/${id}`, {
        state: {
          result: response.data,
          testTitle: test.title,
        },
      });
    } catch (error) {
      console.error("Error submitting test:", error);
      if (
        error.response?.data?.message ===
        "Test has been ended by the administrator"
      ) {
        alert(
          "This test has been ended by the administrator. Your progress will be saved."
        );
        navigate("/");
      } else {
        alert("Error submitting test. Please try again.");
        setSubmitting(false);
      }
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getTimeColor = () => {
    if (timeLeft > 300) return "text-green-600"; // > 5 minutes
    if (timeLeft > 120) return "text-yellow-600"; // > 2 minutes
    return "text-red-600"; // <= 2 minutes
  };

  const getAnsweredCount = () => {
    return Object.values(answers).filter(
      (answer) => answer.selectedAnswer !== null
    ).length;
  };

  const highlightCode = (code, language) => {
    // Simple syntax highlighting for common languages
    const keywords = {
      c: [
        "#include",
        "int",
        "char",
        "float",
        "double",
        "if",
        "else",
        "for",
        "while",
        "return",
        "void",
        "struct",
        "typedef",
        "printf",
        "scanf",
      ],
      javascript: [
        "function",
        "const",
        "let",
        "var",
        "if",
        "else",
        "for",
        "while",
        "return",
        "class",
        "import",
        "export",
      ],
      python: [
        "def",
        "class",
        "if",
        "else",
        "elif",
        "for",
        "while",
        "return",
        "import",
        "from",
        "try",
        "except",
      ],
      java: [
        "public",
        "private",
        "class",
        "interface",
        "if",
        "else",
        "for",
        "while",
        "return",
        "import",
        "package",
      ],
      cpp: [
        "#include",
        "using",
        "namespace",
        "int",
        "char",
        "float",
        "double",
        "if",
        "else",
        "for",
        "while",
        "return",
      ],
    };

    let highlightedCode = code;
    const langKeywords = keywords[language] || keywords.javascript;

    langKeywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, "g");
      highlightedCode = highlightedCode.replace(
        regex,
        `<span class="text-blue-400 font-semibold">${keyword}</span>`
      );
    });

    // Highlight strings
    highlightedCode = highlightedCode.replace(
      /(["'])((?:(?!\1)[^\\]|\\.)*)(\1)/g,
      '<span class="text-green-400">$1$2$3</span>'
    );

    // Highlight comments
    highlightedCode = highlightedCode.replace(
      /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm,
      '<span class="text-gray-400 italic">$1</span>'
    );

    return highlightedCode;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading test...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Test Not Found
          </h2>
          <p className="text-gray-600">
            The test you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const currentQ = test.questions[currentQuestion];

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-1 min-w-0 pr-2">
              <h1 className="text-base md:text-xl font-semibold text-gray-800 select-none truncate">
                {test.title}
              </h1>
              <p className="text-xs md:text-sm text-gray-600 select-none">
                Question {currentQuestion + 1} of {test.questions.length}
              </p>
            </div>
            <div className="flex items-center space-x-3 md:space-x-6 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-xs md:text-sm text-gray-600 select-none">
                  Answered
                </p>
                <p className="font-semibold select-none text-sm md:text-base">
                  {getAnsweredCount()}/{test.questions.length}
                </p>
              </div>
              <div className="text-right sm:hidden">
                <p className="text-xs text-gray-600 select-none">Ans</p>
                <p className="font-semibold select-none text-sm">
                  {getAnsweredCount()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs md:text-sm text-gray-600 select-none hidden sm:block">
                  Time Left
                </p>
                <p className="text-xs text-gray-600 select-none sm:hidden">
                  Time
                </p>
                <p
                  className={`font-bold text-base md:text-lg select-none ${getTimeColor()}`}
                >
                  {formatTime(timeLeft)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-8 mb-6 border border-gray-200">
          {/* Question */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 select-none">
                Question {currentQuestion + 1}
              </h2>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 md:px-3 rounded-full text-xs md:text-sm font-medium select-none shrink-0 ml-2">
                {currentQ.points} {currentQ.points === 1 ? "point" : "points"}
              </span>
            </div>

            <div className="prose max-w-none mb-6">
              <p
                className="text-gray-700 text-base md:text-lg leading-relaxed select-none"
                style={{ userSelect: "none" }}
              >
                {currentQ.question}
              </p>
            </div>
            {currentQ.image && currentQ.image.trim() !== "" && (
              <div className="mb-6">
                <img
                  src={currentQ.image}
                  alt="Question illustration"
                  className="max-w-full md:max-w-80 h-auto rounded-lg border border-gray-200 shadow-sm mx-auto md:mx-0"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            )}

            {/* Code Block */}
            {currentQ.code && (
              <div className="mb-6">
                <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg">
                  <div className="bg-gray-800 px-4 py-2 md:py-3 text-xs md:text-sm text-gray-300 border-b border-gray-700 flex items-center select-none">
                    <Code className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                    {currentQ.language || "javascript"}
                  </div>
                  <div className="p-4 md:p-6 overflow-x-auto">
                    <pre
                      className="text-gray-100 font-mono text-xs md:text-sm leading-relaxed select-none"
                      style={{ userSelect: "none", WebkitUserSelect: "none" }}
                    >
                      <code
                        dangerouslySetInnerHTML={{
                          __html: highlightCode(
                            currentQ.code,
                            currentQ.language || "javascript"
                          ),
                        }}
                        style={{ userSelect: "none", WebkitUserSelect: "none" }}
                      />
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Options */}
          {/* Options */}
          <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
            {currentQ.options.map((option, index) => (
              <label
                key={index}
                className={`block p-3 md:p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-gray-50 select-none ${
                  answers[currentQuestion]?.selectedAnswer === index
                    ? "border-blue-500 bg-blue-50 shadow-sm"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                style={{ userSelect: "none" }}
              >
                <div className="flex items-start">
                  <input
                    type="radio"
                    name={`question-${currentQuestion}`}
                    value={index}
                    checked={answers[currentQuestion]?.selectedAnswer === index}
                    onChange={() => handleAnswerSelect(currentQuestion, index)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-1"
                  />
                  <span
                    className="ml-3 text-sm md:text-base text-gray-800 font-medium select-none"
                    style={{ userSelect: "none" }}
                  >
                    {option}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mb-8 gap-3">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="flex items-center space-x-1 md:space-x-2 px-4 md:px-6 py-2.5 md:py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg select-none text-sm md:text-base"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </button>

          <div className="flex space-x-3 md:space-x-4">
            {currentQuestion === test.questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center space-x-2 px-6 md:px-8 py-2.5 md:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg select-none text-sm md:text-base"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{submitting ? "Submitting..." : "Submit Test"}</span>
              </button>
            ) : (
              <button
                onClick={() =>
                  setCurrentQuestion(
                    Math.min(test.questions.length - 1, currentQuestion + 1)
                  )
                }
                className="flex items-center space-x-1 md:space-x-2 px-5 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg select-none text-sm md:text-base"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Question Navigator */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 select-none">
            Question Navigator
          </h3>
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 mb-4">
            {test.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-full aspect-square md:w-10 md:h-10 rounded-lg text-sm font-medium transition-all select-none flex items-center justify-center ${
                  index === currentQuestion
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : answers[index]?.selectedAnswer !== null
                    ? "bg-green-100 text-green-800 border border-green-200 hover:bg-green-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 select-none">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded"></div>
              <span>Current</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-100 rounded"></div>
              <span>Unanswered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestTaking;
