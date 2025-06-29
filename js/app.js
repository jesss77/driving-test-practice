// Driving Test Practice App JS
// Loads questions from questions.js and manages all app logic

// --- State ---
let questions = window.questions || [];
console.log('Questions loaded:', questions.length, 'questions');
let currentIndex = 0;
let userAnswers = [];
let missedQuestions = [];
let bookmarks = [];
let mode = 'sequential';
let category = 'all';
let language = localStorage.getItem('dt_language') || 'english';
let filteredQuestions = [];
let searchTerm = '';

// --- Local Storage Keys ---
const LS_ANSWERS = 'dt_userAnswers';
const LS_MISSED = 'dt_missedQuestions';
const LS_BOOKMARKS = 'dt_bookmarks';
const LS_MODE = 'dt_mode';
const LS_CATEGORY = 'dt_category';
const LS_LANGUAGE = 'dt_language';

// --- DOM Elements ---
const questionContainer = document.getElementById('question-container');
const questionNumber = document.getElementById('question-number');
const categoryTag = document.getElementById('category-tag');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const feedback = document.getElementById('feedback');
const progressFill = document.getElementById('progress-fill');
const questionCounter = document.getElementById('question-counter');
const scoreDisplay = document.getElementById('score-display');
const resultsContainer = document.getElementById('results-container');
const finalScore = document.getElementById('final-score');
const incorrectQuestions = document.getElementById('incorrect-questions');
const langText = document.getElementById('lang-text');
const questionImageContainer = document.getElementById('question-image-container');
const questionImage = document.getElementById('question-image');

console.log('DOM elements found:', {
    questionContainer: !!questionContainer,
    questionNumber: !!questionNumber,
    categoryTag: !!categoryTag,
    questionText: !!questionText,
    optionsContainer: !!optionsContainer
});

// --- Utility Functions ---
function saveState() {
    console.log('Saving state:', { userAnswers, missedQuestions, bookmarks, mode, category, language });
    localStorage.setItem(LS_ANSWERS, JSON.stringify(userAnswers));
    localStorage.setItem(LS_MISSED, JSON.stringify(missedQuestions));
    localStorage.setItem(LS_BOOKMARKS, JSON.stringify(bookmarks));
    localStorage.setItem(LS_MODE, mode);
    localStorage.setItem(LS_CATEGORY, category);
    localStorage.setItem(LS_LANGUAGE, language);
}

function loadState() {
    console.log('Loading state from localStorage');
    userAnswers = JSON.parse(localStorage.getItem(LS_ANSWERS)) || [];
    missedQuestions = JSON.parse(localStorage.getItem(LS_MISSED)) || [];
    bookmarks = JSON.parse(localStorage.getItem(LS_BOOKMARKS)) || [];
    mode = localStorage.getItem(LS_MODE) || 'sequential';
    category = localStorage.getItem(LS_CATEGORY) || 'all';
    language = localStorage.getItem(LS_LANGUAGE) || 'english';
    
    // Fix: Reset category to 'all' if it's not a valid category
    const validCategories = ['all', 'Law', 'Safety', 'Signs'];
    if (!validCategories.includes(category)) {
        category = 'all';
    }
    
    console.log('State loaded:', { userAnswers, missedQuestions, bookmarks, mode, category, language });
}

function resetState() {
    console.log('Resetting state');
    userAnswers = [];
    missedQuestions = [];
    bookmarks = [];
    currentIndex = 0;
    saveState();
}
function getCurrentQuestions() {
    console.log('Getting current questions with filters:', { category, searchTerm, mode, language });
    let q = questions;
    console.log('Initial questions count:', q.length);

    // Normalize category and filter (except for 'all')
    if (category !== 'all') {
        q = q.filter(q => q.category?.toLowerCase() === category.toLowerCase());
        console.log('After category filter:', q.length, 'Category:', category);
    }

    // Filter by search term (case-insensitive)
    if (searchTerm) {
        q = q.filter(q =>
            (q[language].question + ' ' + q[language].options.join(' '))
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        );
        console.log('After search filter:', q.length);
    }

    // Filter by missed questions if mode is 'missed'
    if (mode === 'missed') {
        q = q.filter(q => missedQuestions.includes(q.id));
        console.log('After missed filter:', q.length);
    }

    console.log('Final filtered questions count:', q.length);
    return q;
}


function updateFilteredQuestions() {
    console.log('Updating filtered questions');
    filteredQuestions = getCurrentQuestions();
    if (mode === 'random') {
        filteredQuestions = shuffle([...filteredQuestions]);
        console.log('Shuffled questions');
    }
    if (currentIndex >= filteredQuestions.length) currentIndex = 0;
    console.log('Filtered questions updated:', filteredQuestions.length, 'questions, currentIndex:', currentIndex);
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// --- Rendering Functions ---
function renderQuestion() {
    console.log('Rendering question, currentIndex:', currentIndex);
    updateFilteredQuestions();
    
    if (filteredQuestions.length === 0) {
        console.log('No questions found to display');
        questionText.textContent = 'No questions found.';
        optionsContainer.innerHTML = '';
        questionImageContainer.style.display = 'none';
        return;
    }
    
    const q = filteredQuestions[currentIndex];
    console.log('Current question:', q);
    
    if (!q) {
        console.error('Question is undefined at index:', currentIndex);
        return;
    }
    
    questionNumber.textContent = `Question ${currentIndex + 1}`;
    categoryTag.textContent = q.category;
    questionText.textContent = q[language].question;
    
    console.log('Question text set:', q[language].question);
    
    // Image support
    if (q[language].image) {
        questionImage.src = q[language].image;
        questionImage.alt = 'Question image';
        questionImageContainer.style.display = '';
    } else {
        questionImageContainer.style.display = 'none';
    }
    
    // Options
    console.log('Rendering options:', q[language].options);
    optionsContainer.innerHTML = '';
    q[language].options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt;
        btn.onclick = () => selectOption(i);
        if (userAnswers[q.id] !== undefined) {
            btn.disabled = true;
            if (i === q[language].correct) btn.classList.add('correct');
            if (i === userAnswers[q.id] && i !== q[language].correct) btn.classList.add('incorrect');
        }
        optionsContainer.appendChild(btn);
    });
    
    // Feedback
    feedback.textContent = '';
    if (userAnswers[q.id] !== undefined) {
        if (userAnswers[q.id] === q[language].correct) {
            feedback.textContent = 'Correct! ' + (q[language].explanation || '');
        } else {
            feedback.textContent = 'Incorrect. ' + (q[language].explanation || '');
        }
    }
    
    // Progress
    questionCounter.textContent = `Question ${currentIndex + 1} of ${filteredQuestions.length}`;
    updateProgress();
    console.log('Question rendering completed');
}

function updateProgress() {
    const total = filteredQuestions.length;
    const answered = userAnswers.filter(a => a !== undefined).length;
    const correct = filteredQuestions.filter(q => userAnswers[q.id] === q[language].correct).length;
    const percent = total ? Math.round((correct / total) * 100) : 0;
    scoreDisplay.textContent = `Score: ${correct}/${total} (${percent}%)`;
    progressFill.style.width = `${(currentIndex + 1) / total * 100}%`;
    console.log('Progress updated:', { total, answered, correct, percent });
}

function selectOption(i) {
    console.log('Option selected:', i);
    const q = filteredQuestions[currentIndex];
    userAnswers[q.id] = i;
    if (i !== q[language].correct && !missedQuestions.includes(q.id)) missedQuestions.push(q.id);
    else if (i === q[language].correct && missedQuestions.includes(q.id)) missedQuestions = missedQuestions.filter(id => id !== q.id);
    saveState();
    renderQuestion();
}

function previousQuestion() {
    if (currentIndex > 0) {
        currentIndex--;
        renderQuestion();
    }
}

function nextQuestion() {
    if (currentIndex < filteredQuestions.length - 1) {
        currentIndex++;
        renderQuestion();
    }
}

function jumpToQuestion() {
    const input = document.getElementById('jump-input');
    const val = parseInt(input.value, 10);
    if (!isNaN(val) && val >= 1 && val <= filteredQuestions.length) {
        currentIndex = val - 1;
        renderQuestion();
    }
}

function confirmReset() {
    if (confirm('Are you sure you want to reset all progress?')) {
        resetState();          
        localStorage.clear();   
        location.reload();      
    }
}

function setMode(m) {
    mode = m;
    currentIndex = 0;
    saveState();
    renderQuestion();

    // Update UI active class
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    const btn = Array.from(document.querySelectorAll('.mode-btn')).find(b => b.textContent.toLowerCase().includes(m));
    if (btn) btn.classList.add('active');
}


function filterByCategory(cat) {
    category = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
    currentIndex = 0;
    saveState();
    renderQuestion();

    // Update button styling
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    const btn = Array.from(document.querySelectorAll('.category-btn')).find(b => b.textContent.includes(cat));
    if (btn) btn.classList.add('active');
}

function searchQuestions(val) {
    searchTerm = val;
    currentIndex = 0;
    renderQuestion();
}

function toggleLanguage() {
    language = (language === 'english') ? 'french' : 'english';
    langText.textContent = language.charAt(0).toUpperCase() + language.slice(1);
    saveState();
    renderQuestion();
}

function restartTest() {
    resetState();
    renderQuestion();
    resultsContainer.style.display = 'none';
    questionContainer.style.display = '';
}

// --- Initialization ---
function init() {
    console.log('Initializing app...');
    console.log('Questions available:', window.questions ? window.questions.length : 'No questions found');
    console.log('Questions object:', window.questions);
    
    loadState();
    langText.textContent = language.charAt(0).toUpperCase() + language.slice(1);
    
    console.log('About to render first question...');
    renderQuestion();
    
    // Attach event listeners
    window.previousQuestion = previousQuestion;
    window.nextQuestion = nextQuestion;
    window.jumpToQuestion = jumpToQuestion;
    window.setMode = setMode;
    window.filterByCategory = filterByCategory;
    window.searchQuestions = searchQuestions;
    window.toggleLanguage = toggleLanguage;
    window.restartTest = restartTest;
    
    console.log('App initialization completed');
}

console.log('App.js loaded, waiting for DOM...');
document.addEventListener('DOMContentLoaded', init); 