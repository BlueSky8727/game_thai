//js/miniGames.js
window.MiniGames = (() => {
  const miniGameTitle = document.getElementById("mini-game-title");
  const miniGameDesc = document.getElementById("mini-game-desc");
  const miniTimeEl = document.getElementById("mini-time");
  const miniScoreEl = document.getElementById("mini-score");
  const miniResultText = document.getElementById("mini-result-text");
  const miniStartBtn = document.getElementById("mini-start-btn");
  const miniContinueBtn = document.getElementById("mini-continue-btn");
  const miniGameOverlay = document.getElementById("mini-game-overlay");
  const miniGameArea = document.getElementById("mini-game-area");
  const playerEl = document.getElementById("player");
  const miniOverlayTitle = document.getElementById("mini-overlay-title");
  const miniOverlayDesc = document.getElementById("mini-overlay-desc");

  const { clamp, randomBetween, isColliding } = window.MiniGameShared;

  let bonusScore = 0;
  let timeLeft = 10;
  let timer = null;
  let gameLoopId = null;
  let gameLoopType = null;
  let gameActive = false;
  let currentDefinition = null;
  let onFinishCallback = null;
  let catchLocked = false;
  let finishLocked = false;
  let currentController = null;
  let resultPopupEl = null;

  const keys = {};
  const enemies = [];

  const player = {
    x: 40,
    y: 40,
    size: 54,
    speed: 4.2
  };

  function normalizeControlKey(rawKey) {
    if (!rawKey) return "";
    const key = String(rawKey).toLowerCase();

    const keyMap = {
      w: "w",
      a: "a",
      s: "s",
      d: "d",
      arrowup: "arrowup",
      arrowdown: "arrowdown",
      arrowleft: "arrowleft",
      arrowright: "arrowright",

      // รองรับตอนคีย์บอร์ดเป็นภาษาไทย
      "ไ": "w",
      "ฟ": "a",
      "ห": "s",
      "ก": "d"
    };

    return keyMap[key] || "";
  }

  function isEditableTarget(target) {
    if (!target) return false;

    const tagName = (target.tagName || "").toLowerCase();

    if (
      tagName === "input" ||
      tagName === "textarea" ||
      tagName === "select" ||
      target.isContentEditable
    ) {
      return true;
    }

    if (typeof target.closest === "function") {
      const editableParent = target.closest(
        'input, textarea, select, [contenteditable="true"], [contenteditable=""], [contenteditable="plaintext-only"]'
      );
      return Boolean(editableParent);
    }

    return false;
  }

  function shouldHandleGameKey(event, normalizedKey) {
    if (!normalizedKey) return false;

    if (!gameActive) return false;

    if (miniGameOverlay.classList.contains("active")) return false;

    if (isEditableTarget(event.target)) return false;

    return true;
  }

  function clearMiniTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function clearGameLoop() {
    if (!gameLoopId) return;

    if (gameLoopType === "raf") {
      cancelAnimationFrame(gameLoopId);
    } else if (gameLoopType === "interval") {
      clearInterval(gameLoopId);
    }

    gameLoopId = null;
    gameLoopType = null;
  }

  function getAreaSize() {
    return {
      width: miniGameArea.clientWidth,
      height: miniGameArea.clientHeight
    };
  }

  function resetPlayerClasses() {
    playerEl.className = "player";
    playerEl.style.transform = "";
    playerEl.style.width = "";
    playerEl.style.height = "";
  }

  function applyThemeClass(themeClass) {
    miniGameArea.className = "mini-game-area";
    if (themeClass) {
      const classes = String(themeClass)
        .split(/\s+/)
        .map((item) => item.trim())
        .filter(Boolean);

      classes.forEach((className) => miniGameArea.classList.add(className));
    }
  }

  function clearAreaInlineStyles() {
    miniGameArea.style.background = "";
    miniGameArea.style.backgroundSize = "";
    miniGameArea.style.backgroundImage = "";
    miniGameArea.style.border = "";
    miniGameArea.style.boxShadow = "";
    miniGameArea.style.position = "";
    miniGameArea.style.overflow = "";
  }

  function setPlayerContent() {
    resetPlayerClasses();

    if (currentDefinition?.playerClassName) {
      const classes = String(currentDefinition.playerClassName)
        .split(/\s+/)
        .map((item) => item.trim())
        .filter(Boolean);

      classes.forEach((className) => playerEl.classList.add(className));
    }

    if (currentDefinition?.playerHtml) {
      playerEl.innerHTML = currentDefinition.playerHtml;
    } else {
      playerEl.textContent = currentDefinition?.playerEmoji || "🧍";
    }

    if (typeof currentDefinition?.onPlayerCreated === "function") {
      currentDefinition.onPlayerCreated(playerEl, player, miniGameArea);
    }
  }

  function updatePlayerElement() {
    playerEl.style.left = `${player.x}px`;
    playerEl.style.top = `${player.y}px`;
    playerEl.style.width = `${player.size}px`;
    playerEl.style.height = `${player.size}px`;

    if (typeof currentDefinition?.onPlayerMove === "function") {
      currentDefinition.onPlayerMove(playerEl, player, keys);
    }
  }

  function renderEnemy(enemy) {
    if (!enemy?.el) return;

    enemy.el.style.left = `${enemy.x}px`;
    enemy.el.style.top = `${enemy.y}px`;
    enemy.el.style.width = `${enemy.size}px`;
    enemy.el.style.height = `${enemy.size}px`;

    if (typeof currentDefinition?.onEnemyRender === "function") {
      currentDefinition.onEnemyRender(enemy.el, enemy, player);
    }
  }

  function createEnemy() {
    if (!currentDefinition || !gameActive) return;

    const area = getAreaSize();
    const size = Number(currentDefinition.enemySize) || 44;
    const item = document.createElement("div");
    item.className = currentDefinition.enemyClassName || "enemy";

    if (currentDefinition.enemyHtml) {
      item.innerHTML = currentDefinition.enemyHtml;
    } else {
      item.textContent = currentDefinition.enemyEmoji || "🦗";
    }

    miniGameArea.appendChild(item);

    const enemy = {
      el: item,
      x: randomBetween(80, Math.max(81, area.width - size - 20)),
      y: randomBetween(80, Math.max(81, area.height - size - 20)),
      size,
      vx: randomBetween(-1.4, 1.4),
      vy: randomBetween(-1.4, 1.4),
      isBeingCaught: false
    };

    if (Math.abs(enemy.vx) < 0.6) enemy.vx = enemy.vx < 0 ? -0.8 : 0.8;
    if (Math.abs(enemy.vy) < 0.6) enemy.vy = enemy.vy < 0 ? -0.8 : 0.8;

    if (typeof currentDefinition?.onEnemyCreated === "function") {
      currentDefinition.onEnemyCreated(item, enemy, miniGameArea);
    }

    enemies.push(enemy);
    renderEnemy(enemy);
  }

  function removeEnemy(enemy) {
    const index = enemies.indexOf(enemy);
    if (index >= 0) {
      enemies.splice(index, 1);
    }

    if (enemy?.el && enemy.el.parentNode) {
      enemy.el.parentNode.removeChild(enemy.el);
    }
  }

  function removeAllEnemies() {
    while (enemies.length > 0) {
      removeEnemy(enemies[0]);
    }
  }

  function getTargetEnemyCount() {
    return Number(currentDefinition?.enemyCount) || 6;
  }

  function spawnInitialEnemies() {
    removeAllEnemies();
    const count = getTargetEnemyCount();
    for (let i = 0; i < count; i += 1) {
      createEnemy();
    }
  }

  function respawnEnemy() {
    if (!gameActive) return;

    const targetCount = getTargetEnemyCount();
    if (enemies.length >= targetCount) return;

    createEnemy();
  }

  function updatePlayer() {
    const area = getAreaSize();
    const moveUp = keys["w"] || keys["arrowup"];
    const moveDown = keys["s"] || keys["arrowdown"];
    const moveLeft = keys["a"] || keys["arrowleft"];
    const moveRight = keys["d"] || keys["arrowright"];

    if (moveUp) player.y -= player.speed;
    if (moveDown) player.y += player.speed;
    if (moveLeft) player.x -= player.speed;
    if (moveRight) player.x += player.speed;

    player.x = clamp(player.x, 0, area.width - player.size);
    player.y = clamp(player.y, 0, area.height - player.size);

    updatePlayerElement();
  }

  function updateEnemies() {
    const area = getAreaSize();
    const runDistance = Number(currentDefinition?.enemyRunDistance) || 180;
    const speedLimit = Number(currentDefinition?.enemySpeedLimit) || 2.4;

    for (const enemy of enemies) {
      if (enemy.isBeingCaught) {
        continue;
      }

      if (typeof currentDefinition?.customUpdateEnemy === "function") {
        currentDefinition.customUpdateEnemy(enemy, player, area, {
          clamp,
          randomBetween,
          runDistance,
          speedLimit
        });

        renderEnemy(enemy);
        continue;
      }

      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;

      if (distance < runDistance) {
        enemy.vx += (dx / distance) * 0.18;
        enemy.vy += (dy / distance) * 0.18;
      } else {
        enemy.vx += randomBetween(-0.04, 0.04);
        enemy.vy += randomBetween(-0.04, 0.04);
      }

      enemy.vx = clamp(enemy.vx, -speedLimit, speedLimit);
      enemy.vy = clamp(enemy.vy, -speedLimit, speedLimit);

      enemy.x += enemy.vx;
      enemy.y += enemy.vy;

      if (enemy.x <= 0 || enemy.x >= area.width - enemy.size) {
        enemy.vx *= -1;
        enemy.x = clamp(enemy.x, 0, area.width - enemy.size);
      }

      if (enemy.y <= 0 || enemy.y >= area.height - enemy.size) {
        enemy.vy *= -1;
        enemy.y = clamp(enemy.y, 0, area.height - enemy.size);
      }

      renderEnemy(enemy);
    }
  }

  function getPlayerCatchBox() {
    if (typeof currentDefinition?.getPlayerCatchBox === "function") {
      return currentDefinition.getPlayerCatchBox(player, playerEl);
    }

    return {
      x: player.x,
      y: player.y,
      size: player.size
    };
  }

  function triggerCatchAnimation() {
    const className = currentDefinition?.catchAnimationClass || "is-catching";
    if (!className) return;

    playerEl.classList.remove(className);
    void playerEl.offsetWidth;
    playerEl.classList.add(className);

    setTimeout(() => {
      playerEl.classList.remove(className);
    }, Number(currentDefinition?.catchAnimationDuration) || 180);
  }

  function animateEnemyCaught(enemy) {
    return new Promise((resolve) => {
      if (!enemy?.el) {
        resolve();
        return;
      }

      const caughtClass = currentDefinition?.enemyCaughtClass || "is-caught";
      enemy.el.classList.add(caughtClass);

      const duration = Number(currentDefinition?.enemyCaughtDuration) || 120;

      setTimeout(() => {
        removeEnemy(enemy);
        resolve();
      }, duration);
    });
  }

  async function checkCatch() {
    if (!gameActive || catchLocked) return;

    const playerBox = getPlayerCatchBox();
    const caughtEnemies = [];

    for (const enemy of enemies) {
      if (enemy.isBeingCaught) continue;

      if (isColliding(playerBox, enemy)) {
        enemy.isBeingCaught = true;
        caughtEnemies.push(enemy);
      }
    }

    if (caughtEnemies.length === 0) return;

    catchLocked = true;
    triggerCatchAnimation();

    const bonusPerCatch = Number(currentDefinition?.bonusPerCatch) || 1;

    try {
      for (const enemy of caughtEnemies) {
        if (typeof currentDefinition?.onBeforeEnemyCaught === "function") {
          currentDefinition.onBeforeEnemyCaught(enemy.el, enemy, playerEl, player);
        }

        await animateEnemyCaught(enemy);

        bonusScore += bonusPerCatch;
        miniScoreEl.textContent = bonusScore;

        if (typeof currentDefinition?.onEnemyCaught === "function") {
          currentDefinition.onEnemyCaught(enemy, bonusScore, miniGameArea);
        }

        respawnEnemy();
      }
    } finally {
      catchLocked = false;
    }
  }

  function gameLoop() {
    if (!gameActive) return;

    updatePlayer();
    updateEnemies();
    checkCatch();

    gameLoopType = "raf";
    gameLoopId = requestAnimationFrame(gameLoop);
  }

  function stopController() {
    if (currentController && typeof currentController.stop === "function") {
      currentController.stop();
    }
    currentController = null;
  }

  function removeResultPopup() {
    if (resultPopupEl && resultPopupEl.parentNode) {
      resultPopupEl.parentNode.removeChild(resultPopupEl);
    }
    resultPopupEl = null;
  }

  function getDefaultResultMessage(score) {
    if (score >= 10) {
      return "เก่งมาก! ตอบได้ไวและเล่นได้ดีสุด ๆ";
    }
    if (score >= 5) {
      return "ดีมาก! เก็บคะแนนได้เยอะเลย";
    }
    if (score > 0) {
      return "ดีแล้ว! ลองอีกนิดได้คะแนนเพิ่มแน่นอน";
    }
    return "ไม่เป็นไร ลองใหม่อีกรอบได้นะ";
  }

  function getFinishSummary(scoreAtFinish, customResultText) {
    if (customResultText) {
      return customResultText;
    }

    if (typeof currentDefinition?.finishText === "function") {
      return currentDefinition.finishText(scoreAtFinish);
    }

    if (typeof currentDefinition?.finishText === "string" && currentDefinition.finishText.trim()) {
      return currentDefinition.finishText;
    }

    return `จบมินิเกม! ได้โบนัส +${scoreAtFinish} คะแนน`;
  }

  function getPopupMessage(scoreAtFinish) {
    if (typeof currentDefinition?.finishPopupMessage === "function") {
      return currentDefinition.finishPopupMessage(scoreAtFinish);
    }

    if (
      typeof currentDefinition?.finishPopupMessage === "string" &&
      currentDefinition.finishPopupMessage.trim()
    ) {
      return currentDefinition.finishPopupMessage;
    }

    return getDefaultResultMessage(scoreAtFinish);
  }

  function showResultPopup(scoreAtFinish, summaryText) {
    removeResultPopup();

    miniGameArea.style.position = miniGameArea.style.position || "relative";

    const backdrop = document.createElement("div");
    backdrop.className = "mini-result-popup-backdrop";
    backdrop.style.position = "absolute";
    backdrop.style.inset = "0";
    backdrop.style.display = "flex";
    backdrop.style.alignItems = "center";
    backdrop.style.justifyContent = "center";
    backdrop.style.background = "rgba(8, 22, 44, 0.38)";
    backdrop.style.backdropFilter = "blur(4px)";
    backdrop.style.zIndex = "999";

    const card = document.createElement("div");
    card.className = "mini-result-popup-card";
    card.style.width = "min(90%, 360px)";
    card.style.borderRadius = "22px";
    card.style.padding = "22px 20px 18px";
    card.style.background = "linear-gradient(180deg, #ffffff 0%, #f5fbff 100%)";
    card.style.boxShadow = "0 24px 60px rgba(13, 44, 84, 0.24)";
    card.style.border = "1px solid rgba(132, 187, 255, 0.35)";
    card.style.textAlign = "center";
    card.style.fontFamily = "inherit";

    const badge = document.createElement("div");
    badge.textContent = "จบมินิเกม";
    badge.style.display = "inline-flex";
    badge.style.alignItems = "center";
    badge.style.justifyContent = "center";
    badge.style.padding = "6px 14px";
    badge.style.borderRadius = "999px";
    badge.style.background = "#e7f3ff";
    badge.style.color = "#175a99";
    badge.style.fontSize = "13px";
    badge.style.fontWeight = "700";
    badge.style.marginBottom = "12px";

    const title = document.createElement("div");
    title.textContent = currentDefinition?.title || "มินิเกม";
    title.style.fontSize = "30px";
    title.style.lineHeight = "1";
    title.style.marginBottom = "12px";

    const scoreLabel = document.createElement("div");
    scoreLabel.textContent = "คะแนนที่ได้";
    scoreLabel.style.fontSize = "14px";
    scoreLabel.style.color = "#5c6f82";
    scoreLabel.style.marginBottom = "6px";

    const scoreValue = document.createElement("div");
    scoreValue.textContent = `${scoreAtFinish}`;
    scoreValue.style.fontSize = "44px";
    scoreValue.style.fontWeight = "800";
    scoreValue.style.color = "#0f5fa8";
    scoreValue.style.lineHeight = "1";
    scoreValue.style.marginBottom = "12px";

    const summary = document.createElement("div");
    summary.textContent = summaryText;
    summary.style.fontSize = "15px";
    summary.style.fontWeight = "700";
    summary.style.color = "#16324f";
    summary.style.marginBottom = "10px";
    summary.style.lineHeight = "1.5";

    const message = document.createElement("div");
    message.textContent = getPopupMessage(scoreAtFinish);
    message.style.fontSize = "14px";
    message.style.color = "#53687d";
    message.style.lineHeight = "1.6";
    message.style.marginBottom = "18px";

    const actionBtn = document.createElement("button");
    actionBtn.type = "button";
    actionBtn.textContent = "ไปต่อ";
    actionBtn.style.border = "none";
    actionBtn.style.cursor = "pointer";
    actionBtn.style.borderRadius = "14px";
    actionBtn.style.padding = "12px 18px";
    actionBtn.style.minWidth = "130px";
    actionBtn.style.background = "linear-gradient(135deg, #4fa8ff 0%, #2b7be4 100%)";
    actionBtn.style.color = "#ffffff";
    actionBtn.style.fontWeight = "700";
    actionBtn.style.fontSize = "15px";
    actionBtn.style.boxShadow = "0 12px 24px rgba(43, 123, 228, 0.28)";

    actionBtn.addEventListener("click", () => {
      removeResultPopup();
      miniContinueBtn.click();
    });

    card.appendChild(badge);
    card.appendChild(title);
    card.appendChild(scoreLabel);
    card.appendChild(scoreValue);
    card.appendChild(summary);
    card.appendChild(message);
    card.appendChild(actionBtn);

    backdrop.appendChild(card);
    miniGameArea.appendChild(backdrop);

    resultPopupEl = backdrop;
  }

  function stopGame() {
    gameActive = false;
    catchLocked = false;
    clearMiniTimer();
    clearGameLoop();
    removeAllEnemies();
    stopController();
    playerEl.style.display = "none";
    resetPlayerClasses();

    if (typeof currentDefinition?.onStop === "function") {
      currentDefinition.onStop(miniGameArea, playerEl);
    }
  }

  function finishGame() {
    if (finishLocked) return;
    finishLocked = true;

    const scoreAtFinish =
      currentController && typeof currentController.getScore === "function"
        ? currentController.getScore()
        : bonusScore;

    const customResultText = miniResultText.textContent;

    stopGame();

    const finishText = getFinishSummary(scoreAtFinish, customResultText);

    miniResultText.textContent = finishText;
    miniContinueBtn.style.display = "inline-block";

    showResultPopup(scoreAtFinish, finishText);

    if (typeof onFinishCallback === "function") {
      onFinishCallback(scoreAtFinish);
    }
  }

  function startCustomController() {
    const controllerContext = {
      areaEl: miniGameArea,
      playerEl,
      utils: {
        clamp,
        randomBetween,
        isColliding
      },
      setScore(value) {
        bonusScore = Number(value) || 0;
        miniScoreEl.textContent = bonusScore;
      },
      setResultText(text) {
        miniResultText.textContent = text || "";
      },
      finishNow() {
        finishGame();
      },
      clearAreaInlineStyles
    };

    currentController = currentDefinition.createController(controllerContext);

    if (currentController && typeof currentController.setup === "function") {
      currentController.setup();
    }

    if (currentController && typeof currentController.start === "function") {
      currentController.start();
    }
  }

  function startGame() {
    if (!currentDefinition) return;

    removeResultPopup();

    bonusScore = 0;
    timeLeft = Number(currentDefinition.duration) || 10;
    gameActive = true;
    catchLocked = false;
    finishLocked = false;

    miniScoreEl.textContent = bonusScore;
    miniTimeEl.textContent = timeLeft;
    miniResultText.textContent = "";
    miniContinueBtn.style.display = "none";
    miniGameOverlay.classList.remove("active");

    if (typeof currentDefinition?.createController === "function") {
      playerEl.style.display = "none";
      startCustomController();
    } else {
      const area = getAreaSize();
      player.size = Number(currentDefinition.playerSize) || 54;
      player.speed = Number(currentDefinition.playerSpeed) || 4.2;
      player.x = clamp(40, 0, area.width - player.size);
      player.y = clamp(40, 0, area.height - player.size);

      setPlayerContent();
      playerEl.style.display = "flex";
      updatePlayerElement();

      if (typeof currentDefinition?.onStart === "function") {
        currentDefinition.onStart(miniGameArea, playerEl, player);
      }

      spawnInitialEnemies();

      clearGameLoop();
      gameLoop();
    }

    clearMiniTimer();
    timer = setInterval(() => {
      timeLeft -= 1;
      miniTimeEl.textContent = timeLeft;

      if (timeLeft <= 0) {
        finishGame();
      }
    }, 1000);
  }

  function setup(config, callback) {
    const id = config?.id;
    const factory = window.MiniGameRegistry[id];

    if (typeof factory !== "function") {
      throw new Error(`ไม่พบมินิเกม id: ${id}`);
    }

    currentDefinition = factory(config);
    onFinishCallback = callback;

    if (typeof currentDefinition?.ensureAssets === "function") {
      currentDefinition.ensureAssets();
    }

    removeResultPopup();
    applyThemeClass(currentDefinition.themeClass);

    bonusScore = 0;
    timeLeft = Number(currentDefinition.duration) || 10;
    catchLocked = false;
    finishLocked = false;

    miniGameTitle.textContent = currentDefinition.title || "มินิเกม";
    miniGameDesc.textContent = currentDefinition.description || "";
    miniOverlayTitle.textContent =
      currentDefinition.overlayTitle || currentDefinition.title || "มินิเกม";
    miniOverlayDesc.textContent = currentDefinition.overlayDescription || "";

    miniTimeEl.textContent = timeLeft;
    miniScoreEl.textContent = bonusScore;
    miniResultText.textContent = "";
    miniContinueBtn.style.display = "none";
    playerEl.style.display = "none";
    miniGameOverlay.classList.add("active");
  }

  function handleKeyDown(event) {
    const normalizedKey = normalizeControlKey(event.key);

    if (!shouldHandleGameKey(event, normalizedKey)) {
      return;
    }

    keys[normalizedKey] = true;

    if (currentController && typeof currentController.onKeyDown === "function") {
      currentController.onKeyDown(normalizedKey);
    }

    event.preventDefault();
  }

  function handleKeyUp(event) {
    const normalizedKey = normalizeControlKey(event.key);

    if (!shouldHandleGameKey(event, normalizedKey)) {
      return;
    }

    keys[normalizedKey] = false;

    if (currentController && typeof currentController.onKeyUp === "function") {
      currentController.onKeyUp(normalizedKey);
    }

    event.preventDefault();
  }

  miniStartBtn.addEventListener("click", startGame);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  return {
    setupMiniGame(config, callback) {
      stopGame();
      setup(config, callback);
    },

    getContinueButton() {
      return miniContinueBtn;
    },

    cleanup() {
      stopGame();
      removeResultPopup();
      miniResultText.textContent = "";
      miniContinueBtn.style.display = "none";
      miniGameOverlay.classList.add("active");
      applyThemeClass("");
      clearAreaInlineStyles();

      Object.keys(keys).forEach((key) => {
        keys[key] = false;
      });
    }
  };
})();