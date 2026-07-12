// ===================================================================
// LSS - Survey screen logic (public/survey.html)
//
// The answer buttons are NOT hardcoded to 3 (good/normal/bad) - they
// are built dynamically from whatever rating scale is currently
// configured in Settings (any number of levels, any labels/colors).
//
// Requests fullscreen on load (best-effort - browsers only allow this
// reliably right after a user gesture, so this may silently fail in
// some browsers; for guaranteed kiosk fullscreen, launch the browser
// itself in kiosk mode, e.g. `chrome --kiosk http://localhost:3000`).
// Hides the cursor and disables text selection via survey.css.
// ===================================================================

const ADVANCE_DELAY_MS = 400;
let RESULT_DISPLAY_SECONDS = 5;

const questionScreen = document.getElementById('questionScreen');
const resultScreen = document.getElementById('resultScreen');
const questionCard = document.getElementById('questionCard');
const questionText = document.getElementById('questionText');
const progressLabel = document.getElementById('progressLabel');
const progressFill = document.getElementById('progressFill');
const answerButtonsContainer = document.getElementById('answerButtons');
const resultEmoji = document.getElementById('resultEmoji');

let questions = [];
let levels = [];
let currentIndex = 0;
let answers = [];
let startedAt = Date.now();

function requestKioskFullscreen() {
  const el = document.documentElement;
  const request = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
  if (request) {
    request.call(el).catch(() => {
      // Silently ignore - see the file header note above.
    });
  }
}

function renderAnswerButtons() {
  answerButtonsContainer.innerHTML = '';
  levels.forEach((level) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'answer-btn';
    btn.style.setProperty('--level-color', level.color);
    btn.dataset.value = level.value;
    btn.innerHTML = `
      <span class="answer-emoji">${level.emoji}</span>
      <span class="answer-label">${level.label}</span>
    `;
    btn.addEventListener('click', () => onAnswer(btn, level.value));
    answerButtonsContainer.appendChild(btn);
  });
}

async function loadSettingsQuestionsAndLevels() {
  try {
    const settingsRes = await fetch('/api/settings/public');
    const settingsJson = await settingsRes.json();
    if (settingsJson.success) {
      RESULT_DISPLAY_SECONDS = settingsJson.data.resultDisplaySeconds || 5;
    }
  } catch (err) {
    console.error('LSS: failed to load public settings', err);
  }

  try {
    const [questionsRes, levelsRes] = await Promise.all([
      fetch('/api/survey/questions'),
      fetch('/api/rating-levels/public'),
    ]);
    questions = (await questionsRes.json()).data || [];
    levels = (await levelsRes.json()).data || [];
  } catch (err) {
    console.error('LSS: failed to load questions/rating scale', err);
    questions = [];
    levels = [];
  }

  if (questions.length === 0 || levels.length === 0) {
    questionText.textContent = 'لا توجد أسئلة أو مقياس تقييم متاح حالياً';
    answerButtonsContainer.classList.add('d-none');
    return;
  }

  renderAnswerButtons();
  renderQuestion();
}

function renderQuestion() {
  const q = questions[currentIndex];
  questionText.textContent = q.text;
  progressLabel.textContent = `السؤال ${currentIndex + 1} من ${questions.length}`;
  progressFill.style.width = `${(currentIndex / questions.length) * 100}%`;
}

function onAnswer(btn, value) {
  btn.classList.add('tapped');

  const question = questions[currentIndex];
  answers.push({ questionId: question.id, rating: value });

  questionCard.classList.add('transitioning');

  setTimeout(() => {
    document.querySelectorAll('.answer-btn').forEach((b) => b.classList.remove('tapped'));
    currentIndex += 1;
    if (currentIndex < questions.length) {
      renderQuestion();
      questionCard.classList.remove('transitioning');
    } else {
      progressFill.style.width = '100%';
      finishSurvey();
    }
  }, ADVANCE_DELAY_MS);
}

async function finishSurvey() {
  const durationMs = Date.now() - startedAt;
  let emoji = '😐';

  try {
    const res = await fetch('/api/survey/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, durationMs }),
    });
    const json = await res.json();
    if (json.success) {
      emoji = json.data.level.emoji;
    }
  } catch (err) {
    console.error('LSS: failed to submit survey', err);
  }

  showResult(emoji);
}

function showResult(emoji) {
  resultEmoji.textContent = emoji;
  questionScreen.classList.add('d-none');
  resultScreen.classList.remove('d-none');
  resultScreen.style.display = 'flex';

  setTimeout(() => {
    window.location.href = 'index.html';
  }, RESULT_DISPLAY_SECONDS * 1000);
}

requestKioskFullscreen();
loadSettingsQuestionsAndLevels();
