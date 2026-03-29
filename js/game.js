//js/game.js
const welcomeScreen = document.getElementById("welcome-screen");
const gameScreen = document.getElementById("game-screen");
const miniGameScreen = document.getElementById("mini-game-screen");
const resultScreen = document.getElementById("result-screen");

const startBtn = document.getElementById("start-btn");
const saveScoreBtn = document.getElementById("save-score-btn");
const playAgainBtn = document.getElementById("play-again-btn");
const clearScoreboardBtn = document.getElementById("clear-scoreboard-btn");
const nextBtn = document.getElementById("next-btn");

const questionImage = document.getElementById("question-image");
const choicesContainer = document.getElementById("choices");
const messageEl = document.getElementById("message");
const scoreEl = document.getElementById("score");
const bonusScoreEl = document.getElementById("bonus-score");
const timerEl = document.getElementById("timer");
const currentQuestionEl = document.getElementById("current-question");
const totalQuestionEl = document.getElementById("total-question");

const playerNameInput = document.getElementById("player-name");
const finalMainScoreText = document.getElementById("final-main-score-text");
const finalBonusScoreText = document.getElementById("final-bonus-score-text");
const finalTotalScoreText = document.getElementById("final-total-score-text");
const finalLevelText = document.getElementById("final-level-text");
const scoreboardList = document.getElementById("scoreboard-list");

const answerPopup = document.getElementById("answer-popup");
const answerPopupBadge = document.getElementById("answer-popup-badge");
const answerPopupTitle = document.getElementById("answer-popup-title");
const answerPopupCorrect = document.getElementById("answer-popup-correct");
const answerPopupMeaning = document.getElementById("answer-popup-meaning");
const answerPopupExplanation = document.getElementById("answer-popup-explanation");
const answerPopupNextBtn = document.getElementById("answer-popup-next-btn");

const SCOREBOARD_KEY = "thai_proverb_scoreboard_v2";

const PROVERB_MEANINGS = {
  "ขี่ช้างจับตั๊กแตน": {
    meaning: "ทำเรื่องเล็ก ๆ แต่ใช้ทรัพยากรหรือวิธีการใหญ่เกินความจำเป็น",
    explanation: "คล้าย ๆ ใช้ของแพงหรือแรงมากไปกับเรื่องนิดเดียว"
  },
  "ไก่เห็นตีนงู งูเห็นนมไก่": {
    meaning: "ต่างฝ่ายต่างรู้ความลับของกันและกัน",
    explanation: "เหมือนรู้ทันกันหมด ไม่มีใครปิดบังใครได้"
  },
  "ปลาใหญ่กินปลาเล็ก": {
    meaning: "คนที่มีอำนาจหรือแข็งแกร่งกว่าจะเอาเปรียบคนที่อ่อนแอกว่า",
    explanation: "ใช้พูดถึงสังคมหรือธุรกิจที่คนเล็กมักเสียเปรียบ"
  },
  "น้ำขึ้นให้รีบตัก": {
    meaning: "เมื่อมีโอกาสดีเข้ามา ให้รีบคว้าไว้",
    explanation: "ถ้าช้าอาจพลาดโอกาสนั้นไป"
  },
  "ตำน้ำพริกละลายแม่น้ำ": {
    meaning: "ใช้เงินหรือทรัพยากรไปโดยเปล่าประโยชน์",
    explanation: "ทำไปแล้วไม่เกิดผลอะไร เหมือนเสียของฟรี ๆ"
  }
};

let currentIndex = 0;
let mainScore = 0;
let bonusScore = 0;
let timeLeft = 10;
let timerInterval = null;
let answered = false;
let scoreSaved = false;
let pendingAfterMiniAction = null;
let playedMiniGameIndexes = new Set();
let pendingAnswerFlowAction = null;

totalQuestionEl.textContent = questions.length;

function shuffleArray(array) {
  const copied = [...array];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

function getTotalScore() {
  return mainScore + bonusScore;
}

function getMaxPossibleBonusScore() {
  return questions.reduce((sum, question) => {
    if (!question.miniGame) return sum;
    return sum + ((Number(question.miniGame.duration) || 10) * (Number(question.miniGame.bonusPerCatch) || 1));
  }, 0);
}

function getLevelFromTotalScore(totalScore, maxMainScore) {
  const maxTotalScoreForNow = maxMainScore + getMaxPossibleBonusScore();
  const ratio = maxTotalScoreForNow > 0 ? totalScore / maxTotalScoreForNow : 0;

  if (ratio >= 0.8) return "ระดับเทพสุภาษิต";
  if (ratio >= 0.6) return "ระดับเก่งมาก";
  if (ratio >= 0.45) return "ระดับดี";
  if (ratio >= 0.25) return "ระดับพอใช้";
  return "ระดับต้องฝึกอีก";
}

function updateScoreUI() {
  scoreEl.textContent = mainScore;
  bonusScoreEl.textContent = bonusScore;
}

function showScreen(screenToShow) {
  [welcomeScreen, gameScreen, miniGameScreen, resultScreen].forEach((screen) => {
    screen.classList.remove("active", "fade-in");
  });

  screenToShow.classList.add("active", "fade-in");

  setTimeout(() => {
    screenToShow.classList.remove("fade-in");
  }, 500);
}

function clearQuestionTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function startQuestionTimer() {
  clearQuestionTimer();
  timeLeft = 10;
  timerEl.textContent = timeLeft;

  timerInterval = setInterval(() => {
    timeLeft -= 1;
    timerEl.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearQuestionTimer();
      handleTimeOut();
    }
  }, 1000);
}

function disableAllChoices() {
  const buttons = document.querySelectorAll(".choice-btn");
  buttons.forEach((btn) => {
    btn.disabled = true;
  });
}

function showCorrectAnswer() {
  const currentQuestion = questions[currentIndex];
  const buttons = document.querySelectorAll(".choice-btn");

  buttons.forEach((btn) => {
    if (btn.textContent === currentQuestion.correct) {
      btn.classList.add("correct");
    }
  });
}

function getProverbDetail(question) {
  const fromQuestion = {
    meaning: question.meaning || "",
    explanation: question.explanation || ""
  };

  const fallback = PROVERB_MEANINGS[question.correct] || {};

  return {
    meaning: fromQuestion.meaning || fallback.meaning || "-",
    explanation: fromQuestion.explanation || fallback.explanation || "-"
  };
}

function hideAnswerPopup() {
  answerPopup.classList.add("hidden");
  answerPopup.setAttribute("aria-hidden", "true");
}

function showAnswerPopup(type, question) {
  const proverbDetail = getProverbDetail(question);

  if (type === "correct") {
    answerPopupBadge.textContent = "ตอบถูก";
    answerPopupBadge.className = "answer-popup-badge correct";
    answerPopupTitle.textContent = "✅ ถูกต้อง!";
  } else if (type === "wrong") {
    answerPopupBadge.textContent = "ตอบผิด";
    answerPopupBadge.className = "answer-popup-badge wrong";
    answerPopupTitle.textContent = "❌ ตอบผิด";
  } else {
    answerPopupBadge.textContent = "หมดเวลา";
    answerPopupBadge.className = "answer-popup-badge timeout";
    answerPopupTitle.textContent = "⏰ หมดเวลา";
  }

  answerPopupCorrect.textContent = question.correct;
  answerPopupMeaning.textContent = proverbDetail.meaning;
  answerPopupExplanation.textContent = proverbDetail.explanation;

  answerPopup.classList.remove("hidden");
  answerPopup.setAttribute("aria-hidden", "false");
}

function continueAfterAnswerPopup() {
  hideAnswerPopup();

  if (pendingAnswerFlowAction === "miniGame") {
    pendingAnswerFlowAction = null;
    startMiniGameForCurrentQuestion();
    return;
  }

  if (pendingAnswerFlowAction === "nextQuestion") {
    pendingAnswerFlowAction = null;
    goToNextQuestion();
    return;
  }

  pendingAnswerFlowAction = null;
}

function renderQuestion() {
  answered = false;
  nextBtn.style.display = "none";
  messageEl.innerHTML = "";
  messageEl.className = "message";
  hideAnswerPopup();

  const question = questions[currentIndex];
  currentQuestionEl.textContent = currentIndex + 1;
  questionImage.src = question.image;
  questionImage.alt = question.correct;
  choicesContainer.innerHTML = "";

  const shuffledChoices = shuffleArray(question.choices);

  shuffledChoices.forEach((choice) => {
    const button = document.createElement("button");
    button.className = "choice-btn";
    button.textContent = choice;
    button.addEventListener("click", () => checkAnswer(choice, button));
    choicesContainer.appendChild(button);
  });

  startQuestionTimer();
}

function shouldPlayMiniGameForCurrentQuestion() {
  const currentQuestion = questions[currentIndex];

  return Boolean(
    currentQuestion &&
    currentQuestion.miniGame &&
    !playedMiniGameIndexes.has(currentIndex)
  );
}

function handleAfterAnswerFlow(answerType, currentQuestion) {
  if (shouldPlayMiniGameForCurrentQuestion()) {
    pendingAfterMiniAction = "nextQuestion";
    pendingAnswerFlowAction = "miniGame";
    playedMiniGameIndexes.add(currentIndex);
    showAnswerPopup(answerType, currentQuestion);
    return;
  }

  pendingAnswerFlowAction = "nextQuestion";
  showAnswerPopup(answerType, currentQuestion);
}

function checkAnswer(selectedChoice, selectedButton) {
  if (answered) return;

  answered = true;
  clearQuestionTimer();
  disableAllChoices();

  const currentQuestion = questions[currentIndex];

  if (selectedChoice === currentQuestion.correct) {
    mainScore += 1;
    updateScoreUI();
    selectedButton.classList.add("correct");
    handleAfterAnswerFlow("correct", currentQuestion);
  } else {
    selectedButton.classList.add("wrong");
    showCorrectAnswer();
    handleAfterAnswerFlow("wrong", currentQuestion);
  }
}

function handleTimeOut() {
  if (answered) return;

  answered = true;
  disableAllChoices();
  showCorrectAnswer();

  const currentQuestion = questions[currentIndex];
  handleAfterAnswerFlow("timeout", currentQuestion);
}

function startMiniGameForCurrentQuestion() {
  const currentQuestion = questions[currentIndex];

  if (!currentQuestion || !currentQuestion.miniGame) {
    goToNextQuestion();
    return;
  }

  showScreen(miniGameScreen);

  window.MiniGames.setupMiniGame(currentQuestion.miniGame, (earnedBonus) => {
    bonusScore += earnedBonus;
    updateScoreUI();
  });
}

function continueAfterMiniGame() {
  window.MiniGames.cleanup();

  if (pendingAfterMiniAction === "nextQuestion") {
    pendingAfterMiniAction = null;
    goToNextQuestion();
    return;
  }

  pendingAfterMiniAction = null;
  showFinalResult();
}

function goToNextQuestion() {
  currentIndex += 1;

  if (currentIndex < questions.length) {
    showScreen(gameScreen);
    renderQuestion();
  } else {
    showFinalResult();
  }
}

function formatDateTime(timestamp) {
  try {
    return new Date(timestamp).toLocaleString("th-TH", {
      dateStyle: "short",
      timeStyle: "short"
    });
  } catch (error) {
    return "-";
  }
}

function showFinalResult() {
  clearQuestionTimer();
  hideAnswerPopup();

  const totalScore = getTotalScore();
  finalMainScoreText.textContent = `คะแนนหลัก: ${mainScore} / ${questions.length}`;
  finalBonusScoreText.textContent = `คะแนนโบนัส: ${bonusScore}`;
  finalTotalScoreText.textContent = `คะแนนรวม: ${totalScore}`;
  finalLevelText.textContent = `ระดับ: ${getLevelFromTotalScore(totalScore, questions.length)}`;

  playerNameInput.value = "";
  scoreSaved = false;

  renderScoreboard();
  showScreen(resultScreen);
}

function resetGameState() {
  clearQuestionTimer();
  window.MiniGames.cleanup();
  hideAnswerPopup();

  currentIndex = 0;
  mainScore = 0;
  bonusScore = 0;
  timeLeft = 10;
  answered = false;
  scoreSaved = false;
  pendingAfterMiniAction = null;
  pendingAnswerFlowAction = null;
  playedMiniGameIndexes = new Set();

  timerEl.textContent = timeLeft;
  currentQuestionEl.textContent = "1";
  updateScoreUI();
}

function startGame() {
  resetGameState();
  showScreen(gameScreen);
  renderQuestion();
}

function restartGame() {
  startGame();
}

function loadScoreboard() {
  try {
    const raw = localStorage.getItem(SCOREBOARD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveScoreboard(data) {
  localStorage.setItem(SCOREBOARD_KEY, JSON.stringify(data));
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderScoreboard() {
  const data = loadScoreboard();

  if (data.length === 0) {
    scoreboardList.innerHTML = `
      <div class="empty-scoreboard">ยังไม่มีข้อมูลคะแนนใน Score Board</div>
    `;
    return;
  }

  scoreboardList.innerHTML = data.map((item, index) => {
    return `
      <div class="score-item">
        <div class="score-rank">#${index + 1}</div>
        <div class="score-name">${escapeHtml(item.name)}</div>
        <div class="score-main">หลัก ${item.mainScore}/${item.totalQuestions}</div>
        <div class="score-bonus">โบนัส ${item.bonusScore}</div>
        <div class="score-total">รวม ${item.totalScore}</div>
        <div class="score-level">${escapeHtml(item.level)}</div>
      </div>
    `;
  }).join("");
}

function saveCurrentScore() {
  if (scoreSaved) {
    alert("บันทึกคะแนนรอบนี้ไปแล้ว");
    return;
  }

  const playerName = playerNameInput.value.trim();
  if (!playerName) {
    alert("กรุณาใส่ชื่อก่อนบันทึกคะแนน");
    playerNameInput.focus();
    return;
  }

  const totalScore = getTotalScore();
  const level = getLevelFromTotalScore(totalScore, questions.length);

  const newEntry = {
    name: playerName,
    mainScore,
    bonusScore,
    totalScore,
    totalQuestions: questions.length,
    level,
    createdAt: Date.now()
  };

  const data = loadScoreboard();
  data.push(newEntry);

  data.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.mainScore !== a.mainScore) return b.mainScore - a.mainScore;
    return a.createdAt - b.createdAt;
  });

  saveScoreboard(data.slice(0, 10));
  scoreSaved = true;
  renderScoreboard();
  alert("บันทึกคะแนนเรียบร้อยแล้ว");
}

function clearScoreboard() {
  const confirmed = confirm("ต้องการล้างข้อมูล Score Board ทั้งหมดใช่ไหม?");
  if (!confirmed) return;

  localStorage.removeItem(SCOREBOARD_KEY);
  renderScoreboard();
}

startBtn.addEventListener("click", startGame);
nextBtn.addEventListener("click", goToNextQuestion);
saveScoreBtn.addEventListener("click", saveCurrentScore);
playAgainBtn.addEventListener("click", restartGame);
clearScoreboardBtn.addEventListener("click", clearScoreboard);
answerPopupNextBtn.addEventListener("click", continueAfterAnswerPopup);
window.MiniGames.getContinueButton().addEventListener("click", continueAfterMiniGame);

playerNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    saveCurrentScore();
  }
});

renderScoreboard();
showScreen(welcomeScreen);
hideAnswerPopup();