// Driving Test Practice App JS

// --- State ---
let questions = window.questions || [];
console.log("Questions loaded:", questions.length, "questions");
let currentIndex = 0;
let userAnswers = {};
let missedQuestions = [];
let bookmarks = [];
let mode = "sequential";
let category = "all";
let language = localStorage.getItem("dt_language") || "english";
let filteredQuestions = [];
let searchTerm = "";
let questionLimit = parseInt(localStorage.getItem("dt_questionLimit")) || 10;
let quizFinished = false;

// --- Local Storage Keys ---
const LS_ANSWERS = "dt_userAnswers";
const LS_MISSED = "dt_missedQuestions";
const LS_BOOKMARKS = "dt_bookmarks";
const LS_MODE = "dt_mode";
const LS_CATEGORY = "dt_category";
const LS_LANGUAGE = "dt_language";
const LS_QUESTION_LIMIT = "dt_questionLimit";

// --- DOM Elements ---
const questionContainer = document.getElementById("question-container");
const questionNumber = document.getElementById("question-number");
const categoryTag = document.getElementById("category-tag");
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const feedback = document.getElementById("feedback");
const progressFill = document.getElementById("progress-fill");
const questionCounter = document.getElementById("question-counter");
const scoreDisplay = document.getElementById("score-display");
const resultsContainer = document.getElementById("results-container");
const finalScore = document.getElementById("final-score");
const incorrectQuestions = document.getElementById("incorrect-questions");
const langText = document.getElementById("lang-text");
const questionImageContainer = document.getElementById("question-image-container");
const questionImage = document.getElementById("question-image");

const questionCountInput = document.getElementById("question-count-input");
const totalQuestionsCount = document.getElementById("total-questions-count");

console.log("DOM elements found:", {
  questionContainer: !!questionContainer,
  questionNumber: !!questionNumber,
  categoryTag: !!categoryTag,
  questionText: !!questionText,
  optionsContainer: !!optionsContainer,
  questionCountInput: !!questionCountInput,
  totalQuestionsCount: !!totalQuestionsCount,
  resultsContainer: !!resultsContainer,
  finalScore: !!finalScore,
  incorrectQuestions: !!incorrectQuestions,
});

// --- Utility Functions ---
function saveState() {
  localStorage.setItem(LS_ANSWERS, JSON.stringify(userAnswers));
  localStorage.setItem(LS_MISSED, JSON.stringify(missedQuestions));
  localStorage.setItem(LS_BOOKMARKS, JSON.stringify(bookmarks));
  localStorage.setItem(LS_MODE, mode);
  localStorage.setItem(LS_CATEGORY, category);
  localStorage.setItem(LS_LANGUAGE, language);
  localStorage.setItem(LS_QUESTION_LIMIT, questionLimit.toString());
}

function loadState() {
  userAnswers = JSON.parse(localStorage.getItem(LS_ANSWERS)) || {};
  missedQuestions = JSON.parse(localStorage.getItem(LS_MISSED)) || [];
  bookmarks = JSON.parse(localStorage.getItem(LS_BOOKMARKS)) || [];
  mode = localStorage.getItem(LS_MODE) || "sequential";
  category = localStorage.getItem(LS_CATEGORY) || "all";
  language = localStorage.getItem(LS_LANGUAGE) || "english";

  const validCategories = ["all", "Law", "Safety", "Signs"];
  if (!validCategories.includes(category)) {
    category = "all";
  }

  questionLimit = parseInt(localStorage.getItem(LS_QUESTION_LIMIT)) || 10;

  if (questionCountInput && totalQuestionsCount) {
    questionCountInput.value = questionLimit;
    totalQuestionsCount.textContent = `/ ${questions.length}`;
    questionCountInput.max = questions.length;
  }
}

function resetState() {
  userAnswers = {};
  missedQuestions = [];
  bookmarks = [];
  currentIndex = 0;
  quizFinished = false;
  updateFilteredQuestions();
  saveState();
}

function getCurrentQuestions() {
  let q = questions;

  if (category !== "all") {
    q = q.filter((q) => q.category?.toLowerCase() === category.toLowerCase());
  }

  if (searchTerm) {
    q = q.filter((q) =>
      (q[language].question + " " + q[language].options.join(" "))
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }

  if (mode === "missed") {
    q = q.filter((q) => missedQuestions.includes(q.id));
  }

  if (mode === "random") {
    // Filter out answered questions only if quiz not finished
    if (!quizFinished) {
      q = q.filter((q) => userAnswers[q.id] === undefined);
    }
  }

  return q;
}

function updateFilteredQuestions() {
  filteredQuestions = getCurrentQuestions();

  if (mode === "random") {
    filteredQuestions = shuffle([...filteredQuestions]);
  }

  if (questionLimit > 0) {
    filteredQuestions = filteredQuestions.slice(0, questionLimit);
  }

  if (currentIndex >= filteredQuestions.length) currentIndex = 0;

  updateQuestionCountLimit();
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function updateQuestionCountLimit() {
  const maxQuestions = getCurrentQuestions().length || questions.length;
  totalQuestionsCount.textContent = `/ ${maxQuestions}`;
  questionCountInput.max = maxQuestions;

  let val = parseInt(questionCountInput.value, 10);
  if (isNaN(val) || val < 1) val = 1;
  if (val > maxQuestions) val = maxQuestions;

  questionCountInput.value = val;
  questionLimit = val;
  saveState();
}

// --- Event Listeners ---
if (questionCountInput) {
  questionCountInput.addEventListener("input", (e) => {
    let val = parseInt(e.target.value, 10);
    const max = parseInt(questionCountInput.max, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > max) val = max;
    questionCountInput.value = val;
    questionLimit = val;
    updateFilteredQuestions();
    saveState();
    currentIndex = 0;
    quizFinished = false;
    renderQuestion();
  });
}

// --- Rendering Functions ---
function renderQuestion() {
  if (quizFinished) {
    showResults();
    return;
  }

  if (filteredQuestions.length === 0) {
    questionText.textContent = "No questions found.";
    optionsContainer.innerHTML = "";
    questionImageContainer.style.display = "none";
    feedback.textContent = "";
    scoreDisplay.textContent = "";
    progressFill.style.width = "0%";
    questionCounter.textContent = "";
    questionNumber.textContent = "";
    categoryTag.textContent = "";
    return;
  }

  const q = filteredQuestions[currentIndex];

  if (!q) {
    console.error("Question is undefined at index:", currentIndex);
    return;
  }

  questionNumber.textContent = `Question ${currentIndex + 1}`;
  categoryTag.textContent = q.category;
  questionText.textContent = q[language].question;

  if (q[language].image) {
    questionImage.src = q[language].image;
    questionImage.alt = "Question image";
    questionImageContainer.style.display = "";
  } else {
    questionImageContainer.style.display = "none";
  }

  const correctIndex = q[language].correct ?? q.correct;
  optionsContainer.innerHTML = "";

  q[language].options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.onclick = () => selectOption(i);

    if (userAnswers[q.id] !== undefined) {
      btn.disabled = true;
      if (i === correctIndex) btn.classList.add("correct");
      if (i === userAnswers[q.id] && i !== correctIndex) btn.classList.add("incorrect");
    }

    optionsContainer.appendChild(btn);
  });

  feedback.textContent = "";
  if (userAnswers[q.id] !== undefined) {
    if (userAnswers[q.id] === correctIndex) {
      feedback.textContent = "Correct! " + (q[language].explanation || "");
    } else {
      feedback.textContent = "Incorrect. " + (q[language].explanation || "");
    }
  }

  questionCounter.textContent = `Question ${currentIndex + 1} of ${filteredQuestions.length}`;

  updateProgress();
}

function updateProgress() {
  const total = filteredQuestions.length;
  const answered = Object.keys(userAnswers).filter(qId =>
    userAnswers[qId] !== undefined && filteredQuestions.some(q => q.id == qId)
  ).length;

  const correct = filteredQuestions.filter(q => {
    const userAnswer = userAnswers[q.id];
    const correctIndex = q[language].correct ?? q.correct;
    return userAnswer !== undefined && userAnswer === correctIndex;
  }).length;

  const percent = total ? Math.round((correct / total) * 100) : 0;

  scoreDisplay.textContent = `Score: ${correct}/${total} (${percent}%)`;
  progressFill.style.width = `${((currentIndex + 1) / total) * 100}%`;

  console.log('Progress updated:', { total, answered, correct, percent });
}


function selectOption(i) {
  if (quizFinished) return; // no selecting if quiz done

  const q = filteredQuestions[currentIndex];
  const correctIndex = q[language].correct ?? q.correct;

  if (userAnswers[q.id] !== undefined) return; // no changing answer

  userAnswers[q.id] = i;

  if (i !== correctIndex && !missedQuestions.includes(q.id)) {
    missedQuestions.push(q.id);
  } else if (i === correctIndex && missedQuestions.includes(q.id)) {
    missedQuestions = missedQuestions.filter((id) => id !== q.id);
  }

  saveState();

  renderQuestion();

  // Check if quiz finished (answered enough questions)
  if (Object.keys(userAnswers).length >= questionLimit) {
    quizFinished = true;
    showResults();
  }
}

function showResults() {
  // Hide question container and show results container
  questionContainer.style.display = "none";
  resultsContainer.style.display = "block";

  // Calculate score
  const total = filteredQuestions.length;
  const correct = Object.entries(userAnswers).reduce((acc, [qId, ans]) => {
    const question = questions.find((x) => x.id == qId);
    if (!question) return acc;
    const corrIndex = question[language].correct ?? question.correct;
    return ans === corrIndex ? acc + 1 : acc;
  }, 0);

  const percent = total ? Math.round((correct / total) * 100) : 0;

  finalScore.textContent = `Your Score: ${correct} / ${total} (${percent}%)`;

  // List incorrect questions with correct answers and explanations
  incorrectQuestions.innerHTML = "";
  for (const qId of missedQuestions) {
    const q = questions.find((x) => x.id == qId);
    if (!q) continue;

    const correctIndex = q[language].correct ?? q.correct;
    const correctAnswer = q[language].options[correctIndex];

    const div = document.createElement("div");
    div.className = "incorrect-question";

    const questionTextEl = document.createElement("p");
    questionTextEl.innerHTML = `<strong>Question:</strong> ${q[language].question}`;
    div.appendChild(questionTextEl);

    const correctAnswerEl = document.createElement("p");
    correctAnswerEl.innerHTML = `<strong>Correct answer:</strong> ${correctAnswer}`;
    div.appendChild(correctAnswerEl);

    if (q[language].explanation) {
      const explanationEl = document.createElement("p");
      explanationEl.innerHTML = `<strong>Explanation:</strong> ${q[language].explanation}`;
      div.appendChild(explanationEl);
    }

    incorrectQuestions.appendChild(div);
  }
}

function previousQuestion() {
  if (quizFinished) return;
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion();
  }
}

function nextQuestion() {
  if (quizFinished) return;
  if (currentIndex < filteredQuestions.length - 1) {
    currentIndex++;
    renderQuestion();
  }
}

function jumpToQuestion() {
  if (quizFinished) return;
  const input = document.getElementById("jump-input");
  const val = parseInt(input.value, 10);
  if (!isNaN(val) && val >= 1 && val <= filteredQuestions.length) {
    currentIndex = val - 1;
    renderQuestion();
  }
}

function confirmReset() {
  if (confirm("Are you sure you want to reset all progress?")) {
    resetState();
    localStorage.clear();
    location.reload();
  }
}

function setMode(m) {
  mode = m;
  currentIndex = 0;
  quizFinished = false;
  updateFilteredQuestions();
  saveState();
  renderQuestion();

  document.querySelectorAll(".mode-btn").forEach((btn) => btn.classList.remove("active"));
  const btn = Array.from(document.querySelectorAll(".mode-btn")).find((b) =>
    b.textContent.toLowerCase().includes(m)
  );
  if (btn) btn.classList.add("active");
}

function filterByCategory(cat) {
  category = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
  currentIndex = 0;
  quizFinished = false;
  updateFilteredQuestions();
  saveState();
  renderQuestion();

  document.querySelectorAll(".category-btn").forEach((btn) => btn.classList.remove("active"));
  const btn = Array.from(document.querySelectorAll(".category-btn")).find((b) =>
    b.textContent.includes(cat)
  );
  if (btn) btn.classList.add("active");
}

function searchQuestions(val) {
  searchTerm = val;
  currentIndex = 0;
  quizFinished = false;
  updateFilteredQuestions();
  renderQuestion();
}

function toggleLanguage() {
  language = language === "english" ? "french" : "english";
  langText.textContent = language.charAt(0).toUpperCase() + language.slice(1);
  saveState();
  renderQuestion();
}

function restartTest() {
  resetState();
  renderQuestion();
  resultsContainer.style.display = "none";
  questionContainer.style.display = "";
}

// --- Initialization ---
function init() {
  loadState();
  langText.textContent = language.charAt(0).toUpperCase() + language.slice(1);

  if (questionCountInput && totalQuestionsCount) {
    questionCountInput.value = questionLimit;
    totalQuestionsCount.textContent = `/ ${questions.length}`;
    questionCountInput.max = questions.length;
  }

  updateFilteredQuestions();
  renderQuestion();

  window.previousQuestion = previousQuestion;
  window.nextQuestion = nextQuestion;
  window.jumpToQuestion = jumpToQuestion;
  window.setMode = setMode;
  window.filterByCategory = filterByCategory;
  window.searchQuestions = searchQuestions;
  window.toggleLanguage = toggleLanguage;
  window.restartTest = restartTest;
}

document.addEventListener("DOMContentLoaded", init);
