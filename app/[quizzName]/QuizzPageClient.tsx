"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { chineseQuestions } from "../services/ChineseQuizz";
import { HoChiMinhQuestion } from "../services/HoChiMinhQuizz";

type Question = {
  id: number;
  question: string;
  options: string[];
  answer: string;
};

type AnswerState = {
  [questionId: number]: string;
};

type QuizStatus = "intro" | "doing" | "result";

function QuizzPageClient() {
  const pathName = usePathname();
  const router = useRouter();

  let questions: Question[] = [];
  if (pathName === "/chinese") {
    questions = chineseQuestions as Question[];
  } else if (pathName === "/hcm") {
    questions = HoChiMinhQuestion as Question[];
  }

  const storageKey = `quiz_answers_${pathName}`;
  const statusKey = `quiz_status_${pathName}`;
  const currentKey = `quiz_current_${pathName}`;

  const [status, setStatus] = useState<QuizStatus>(() => {
    if (typeof window === "undefined") return "intro";
    return (localStorage.getItem(statusKey) as QuizStatus) || "intro";
  });

  const [answers, setAnswers] = useState<AnswerState>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return parseInt(localStorage.getItem(currentKey) || "0", 10);
  });

  const [score, setScore] = useState(0);
  const [animating, setAnimating] = useState(false);

  // write-only persist effect
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(answers));
      localStorage.setItem(statusKey, status);
      localStorage.setItem(currentKey, String(currentIndex));
    } catch {}
  }, [answers, status, currentIndex, storageKey, statusKey, currentKey]);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;
  const currentQ = questions[currentIndex];

  // ── helpers ──────────────────────────────────────────────
  function isAnsweredCorrect(q: Question) {
    const sel = answers[q.id];
    return sel !== undefined && sel === q.answer;
  }
  function isAnsweredWrong(q: Question) {
    const sel = answers[q.id];
    return sel !== undefined && sel !== q.answer;
  }

  function startQuiz() {
    setStatus("doing");
    setCurrentIndex(0);
  }

  function selectOption(questionId: number, option: string) {
    // lock once answered
    if (answers[questionId] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  }

  function goToQuestion(index: number) {
    if (index === currentIndex) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setAnimating(false);
    }, 150);
  }

  function submitQuiz() {
    if (!allAnswered) return;
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.answer) correct++;
    });
    setScore(correct);
    setStatus("result");
  }

  function retakeQuiz() {
    setAnswers({});
    setCurrentIndex(0);
    setStatus("doing");
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(currentKey);
      localStorage.setItem(statusKey, "doing");
    } catch {}
  }

  function goHome() {
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(statusKey);
      localStorage.removeItem(currentKey);
    } catch {}
    router.push("/");
  }

  // option styling — shows result immediately after answering
  function getOptionStyle(q: Question, option: string): string {
    const selected = answers[q.id];
    const isPicked = selected === option;
    const isCorrect = option === q.answer;
    const answered = selected !== undefined;

    if (!answered) {
      // not yet answered
      return "bg-white border-2 border-gray-200 hover:border-[#DD4677] hover:bg-pink-50 text-gray-700 cursor-pointer";
    }
    // already answered — show result right away
    if (isCorrect)
      return "bg-green-50 border-2 border-green-500 text-green-700 font-semibold cursor-default";
    if (isPicked)
      return "bg-red-50 border-2 border-red-400 text-red-600 font-semibold cursor-default";
    return "bg-white border-2 border-gray-100 text-gray-300 cursor-default";
  }

  // dot colour in the question map
  function getDotClass(q: Question, i: number): string {
    const isActive = i === currentIndex;
    const answered = answers[q.id] !== undefined;
    const correct = isAnsweredCorrect(q);
    const wrong = isAnsweredWrong(q);

    let bg = "bg-gray-100 text-gray-500";
    if (correct) bg = "bg-green-500 text-white";
    else if (wrong) bg = "bg-red-400 text-white";
    else if (!answered) bg = "bg-gray-100 text-gray-500";

    const ring = isActive
      ? "ring-2 ring-offset-1 ring-[#DD4677] scale-110"
      : "hover:scale-110";
    return `${bg} ${ring}`;
  }

  // ── INTRO ─────────────────────────────────────────────────
  if (status === "intro") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: "#FFE6E8" }}
      >
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center border border-pink-100">
          <div className="text-5xl mb-4">📝</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {pathName === "/chinese" ? "Quiz Tiếng Trung" : "Quiz Hồ Chí Minh"}
          </h1>
          <p className="text-gray-500 mb-2">
            Tổng cộng{" "}
            <span className="font-bold text-[#DD4677]">{questions.length}</span>{" "}
            câu hỏi
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Chọn đáp án — kết quả hiện ngay sau mỗi câu. Nộp bài khi hoàn thành!
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={startQuiz}
              className="w-full py-4  cursor-pointer rounded-2xl font-bold text-white text-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-95"
              style={{ backgroundColor: "#DD4677" }}
            >
              🚀 Bắt đầu làm bài
            </button>
            <button
              onClick={goHome}
              className="w-full cursor-pointer py-3 rounded-2xl font-semibold text-gray-500 border-2 border-gray-200 hover:border-[#DD4677] hover:text-[#DD4677] transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              ← Trở lại trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── RESULT ────────────────────────────────────────────────
  if (status === "result") {
    const percent = Math.round((score / questions.length) * 100);
    const emoji = percent >= 80 ? "🎉" : percent >= 50 ? "😊" : "😅";
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: "#FFE6E8" }}
      >
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center border border-pink-100">
          <div className="text-6xl mb-4">{emoji}</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Kết quả</h2>
          <p className="text-gray-400 mb-6">Bạn đã hoàn thành bài quiz!</p>
          <div
            className="w-32 h-32 rounded-full flex flex-col items-center justify-center mx-auto mb-6"
            style={{ background: "linear-gradient(135deg, #FFE6E8, #ffc0cb)" }}
          >
            <span className="text-4xl font-black" style={{ color: "#DD4677" }}>
              {percent}%
            </span>
            <span className="text-xs text-gray-500">
              {score}/{questions.length}
            </span>
          </div>
          <p className="text-gray-600 mb-8">
            Bạn trả lời đúng{" "}
            <span className="font-bold text-green-600">{score}</span> /{" "}
            <span className="font-bold">{questions.length}</span> câu
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={retakeQuiz}
              className="w-full py-4 cursor-pointer rounded-2xl font-bold text-white text-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-95"
              style={{ backgroundColor: "#DD4677" }}
            >
              🔄 Làm lại
            </button>
            <button
              onClick={goHome}
              className="w-full py-3 cursor-pointer rounded-2xl font-semibold text-gray-500 border-2 border-gray-200 hover:border-[#DD4677] hover:text-[#DD4677] transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              ← Trở về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── QUIZ SCREEN ───────────────────────────────────────────
  const currentAnswered = answers[currentQ?.id] !== undefined;
  const currentCorrect =
    currentAnswered && answers[currentQ?.id] === currentQ?.answer;

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: "#FFE6E8" }}>
      {/* ── Top header bar ── */}
      <div className="sticky top-0 z-10 backdrop-blur-sm bg-[#FFE6E8]/80 border-b border-pink-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <button
            onClick={goHome}
            className="text-sm font-semibold text-gray-500 hover:text-[#DD4677] transition-colors px-3 py-1.5 rounded-xl hover:bg-white cursor-pointer whitespace-nowrap"
          >
            ← Trở lại
          </button>

          {/* progress summary */}
          <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
              {questions.filter((q) => isAnsweredCorrect(q)).length}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
              {questions.filter((q) => isAnsweredWrong(q)).length}
            </span>
            <span className="text-gray-400">
              {answeredCount}/{questions.length}
            </span>
          </div>

          <button
            onClick={submitQuiz}
            disabled={!allAnswered}
            className={`px-4 py-1.5 rounded-xl font-bold text-sm transition-all duration-200 whitespace-nowrap ${
              allAnswered
                ? "text-white hover:scale-[1.03] hover:shadow-md active:scale-95 cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            style={allAnswered ? { backgroundColor: "#DD4677" } : {}}
          >
            {allAnswered
              ? "Nộp bài ✓"
              : `Còn ${questions.length - answeredCount} câu`}
          </button>
        </div>
      </div>

      {/* ── Main body ── */}
      {/*
        Desktop: side-by-side  (flex-row)
        Mobile:  stacked       (flex-col) — question top, map bottom
      */}
      <div className="max-w-6xl mx-auto px-4 pt-4 flex flex-col lg:flex-row gap-4 items-start">
        {/* ════ LEFT / TOP — Question card ════ */}
        <div className="w-full lg:flex-1 min-w-0">
          <div
            className={`bg-white rounded-3xl shadow-lg p-5 sm:p-7 border border-pink-100 transition-opacity duration-150 ${
              animating ? "opacity-0" : "opacity-100"
            }`}
          >
            {/* question header */}
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-base font-extrabold tracking-wide"
                style={{ color: "#DD4677" }}
              >
                Câu {currentIndex + 1}
              </span>
              <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>

            {/* progress bar */}
            <div className="w-full h-1.5 bg-pink-100 rounded-full mb-5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${((currentIndex + 1) / questions.length) * 100}%`,
                  backgroundColor: "#DD4677",
                }}
              />
            </div>

            {/* question text */}
            <p className="text-gray-800 font-semibold text-base sm:text-lg mb-5 leading-relaxed whitespace-pre-line">
              {currentQ?.question}
            </p>

            {/* options */}
            <div className="flex flex-col gap-2.5">
              {currentQ?.options?.map((option, i) => {
                const selected = answers[currentQ.id];
                const isPicked = selected === option;
                const isCorrect = option === currentQ.answer;
                const answered = selected !== undefined;

                return (
                  <button
                    key={i}
                    onClick={() => selectOption(currentQ.id, option)}
                    disabled={answered}
                    className={`w-full text-left px-4 py-3.5 rounded-2xl transition-all duration-200 flex items-center justify-between gap-3 ${
                      !answered ? "hover:scale-[1.01] active:scale-[0.99]" : ""
                    } ${getOptionStyle(currentQ, option)}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-gray-100 text-gray-500">
                        {["A", "B", "C", "D"][i]}
                      </span>
                      <span className="text-sm sm:text-base">{option}</span>
                    </div>
                    {answered && isCorrect && (
                      <span className="text-green-500 text-xl shrink-0">✓</span>
                    )}
                    {answered && isPicked && !isCorrect && (
                      <span className="text-red-400 text-xl shrink-0">✗</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* inline feedback after answering */}
            {currentAnswered && !currentCorrect && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-sm text-green-700 flex items-start gap-2">
                <span className="text-green-500 text-base mt-0.5">💡</span>
                <span>
                  <span className="font-semibold">Đáp án đúng:</span>{" "}
                  {currentQ?.answer}
                </span>
              </div>
            )}
            {currentAnswered && currentCorrect && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
                <span>🎯</span>
                <span className="font-semibold">Chính xác!</span>
              </div>
            )}

            {/* prev / next */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => goToQuestion(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="flex-1 py-3 rounded-2xl font-semibold text-sm border-2 border-gray-200 text-gray-500 hover:border-[#DD4677] hover:text-[#DD4677] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
              >
                ← Trước
              </button>
              <button
                onClick={() => goToQuestion(currentIndex + 1)}
                disabled={currentIndex === questions.length - 1}
                className="flex-1 py-3 rounded-2xl font-bold text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer"
                style={{ backgroundColor: "#DD4677" }}
              >
                Tiếp →
              </button>
            </div>
          </div>
        </div>

        {/* ════ RIGHT / BOTTOM — Question map ════ */}
        {/*
          Desktop: sticky sidebar, width fixed
          Mobile:  full-width below the question card
        */}
        <div className="w-full lg:w-56 lg:shrink-0 lg:sticky lg:top-20">
          <div className="bg-white rounded-3xl shadow-lg p-4 border border-pink-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">
              Danh sách câu
            </p>

            {/* grid of dots — 5 cols on mobile, 5 cols on desktop sidebar */}
            <div className="grid grid-cols-10 lg:grid-cols-5 gap-1.5 h-100 overflow-y-auto overflow-x-hidden">
              {questions.map((q, i) => {
                const answered = answers[q.id] !== undefined;
                const correct = isAnsweredCorrect(q);

                let dotLabel: string | React.ReactNode = String(i + 1);
                if (answered) dotLabel = correct ? "✓" : "✗";

                return (
                  <button
                    key={q.id}
                    onClick={() => goToQuestion(i)}
                    title={`Câu ${i + 1}${answered ? (correct ? " ✓" : " ✗") : ""}`}
                    className={`h-8 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${getDotClass(q, i)}`}
                  >
                    {dotLabel}
                  </button>
                );
              })}
            </div>

            {/* legend */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-3.5 h-3.5 rounded bg-green-500 inline-block" />{" "}
                Đúng
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-3.5 h-3.5 rounded bg-red-400 inline-block" />{" "}
                Sai
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-3.5 h-3.5 rounded bg-gray-100 inline-block" />{" "}
                Chưa làm
              </div>
            </div>

            {/* submit */}
            <button
              onClick={submitQuiz}
              disabled={!allAnswered}
              className={`w-full mt-4 py-2.5 rounded-2xl font-bold text-sm transition-all duration-200 ${
                allAnswered
                  ? "text-white hover:scale-[1.03] hover:shadow-md active:scale-95 cursor-pointer"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
              style={allAnswered ? { backgroundColor: "#DD4677" } : {}}
            >
              {allAnswered
                ? "Nộp bài ✓"
                : `Còn ${questions.length - answeredCount} câu`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuizzPageClient;
