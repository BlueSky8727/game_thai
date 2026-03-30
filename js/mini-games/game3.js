//js/mini-games/game3.js
window.MiniGameShared.register("game3", (config = {}) => {
  const duration = Number(config.duration) || 10;
  const bonusPerCatch = Number(config.bonusPerCatch) || 1;

  const MAX_ENEMIES = 18;
  const RESPAWN_DELAY_MS = 520;
  const EAT_COOLDOWN_MS = 180;

  const LEVEL_UP_REQUIREMENTS = {
    2: 2,
    3: 4,
    4: 6
  };

  const FISH_LEVELS = [
    {
      level: 1,
      sizeMin: 24,
      sizeMax: 30,
      speedMin: 1.2,
      speedMax: 1.9,
      emoji: "🐟"
    },
    {
      level: 2,
      sizeMin: 34,
      sizeMax: 42,
      speedMin: 1.05,
      speedMax: 1.7,
      emoji: "🐠"
    },
    {
      level: 3,
      sizeMin: 48,
      sizeMax: 58,
      speedMin: 0.9,
      speedMax: 1.45,
      emoji: "🐡"
    },
    {
      level: 4,
      sizeMin: 66,
      sizeMax: 80,
      speedMin: 0.8,
      speedMax: 1.2,
      emoji: "🦈"
    }
  ];

  function getLevelMeta(level) {
    return FISH_LEVELS.find((item) => item.level === level) || FISH_LEVELS[0];
  }

  return {
    id: "game3",
    title: "ปลาใหญ่กินปลาเล็ก",
    description: `ควบคุมปลาในน้ำ กินปลาที่เล็กกว่าให้ได้มากที่สุดภายใน ${duration} วินาที`,
    overlayTitle: "มินิเกม: ปลาใหญ่กินปลาเล็ก",
    overlayDescription:
      "ใช้ปุ่ม W A S D หรือปุ่มลูกศร ควบคุมปลาเราให้ว่ายน้ำ กินปลาเล็กเพื่อโตขึ้น และระวังปลาที่ใหญ่กว่า",
    playerEmoji: "🐟",
    enemyEmoji: "🐠",
    themeClass: "theme-water",
    duration,
    bonusPerCatch,

    createController(ctx) {
      const {
        areaEl,
        setScore,
        setResultText,
        finishNow,
        clearAreaInlineStyles,
        utils
      } = ctx;

      const { clamp, randomBetween } = utils;

      const state = {
        running: false,
        frameId: null,
        enemies: [],
        score: 0,
        eatCount: 0,
        bubbleInterval: null,
        playerLevel: 1,
        playerEl: null,
        lastEatAt: 0,
        pendingRespawns: new Set()
      };

      const player = {
        x: 120,
        y: 120,
        size: 30,
        speed: 4.6,
        level: 1,
        dirX: 1,
        facingX: 1
      };

      const keyState = {
        up: false,
        down: false,
        left: false,
        right: false
      };

      function getAreaSize() {
        return {
          width: areaEl.clientWidth || 680,
          height: areaEl.clientHeight || 390
        };
      }

      function applyWaterStyles() {
        areaEl.style.position = "relative";
        areaEl.style.overflow = "hidden";
        areaEl.style.background = `
          radial-gradient(circle at 20% 18%, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 20%),
          radial-gradient(circle at 82% 30%, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 18%),
          linear-gradient(180deg, #7ad7ff 0%, #44b8f0 45%, #1289c9 100%)
        `;
        areaEl.style.border = "3px solid rgba(19, 105, 161, 0.75)";
        areaEl.style.boxShadow = "inset 0 0 0 4px rgba(255,255,255,0.12)";
      }

      function createBubble() {
        const bubble = document.createElement("div");
        const size = randomBetween(8, 18);
        const area = getAreaSize();

        bubble.style.position = "absolute";
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${randomBetween(0, Math.max(1, area.width - size))}px`;
        bubble.style.top = `${area.height + randomBetween(0, 80)}px`;
        bubble.style.borderRadius = "50%";
        bubble.style.background = "rgba(255,255,255,0.24)";
        bubble.style.border = "1px solid rgba(255,255,255,0.35)";
        bubble.style.pointerEvents = "none";
        bubble.style.boxShadow = "inset 0 0 10px rgba(255,255,255,0.16)";
        bubble.style.zIndex = "0";
        bubble.style.transition = `transform ${randomBetween(3.8, 6.5)}s linear, opacity ${randomBetween(3.8, 6.5)}s linear`;
        bubble.style.opacity = "0.9";

        areaEl.appendChild(bubble);

        requestAnimationFrame(() => {
          bubble.style.transform = `translate(${randomBetween(-30, 30)}px, -${area.height + 140}px)`;
          bubble.style.opacity = "0";
        });

        setTimeout(() => {
          if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
        }, 7000);
      }

      function startBubbleLoop() {
        stopBubbleLoop();
        state.bubbleInterval = setInterval(() => {
          if (!state.running) return;
          createBubble();
        }, 700);
      }

      function stopBubbleLoop() {
        if (state.bubbleInterval) {
          clearInterval(state.bubbleInterval);
          state.bubbleInterval = null;
        }
      }

      function createPlayerElement() {
        const el = document.createElement("div");
        el.style.position = "absolute";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.userSelect = "none";
        el.style.pointerEvents = "none";
        el.style.zIndex = "5";
        el.style.transition = "transform 0.08s linear";
        el.textContent = getLevelMeta(player.level).emoji;
        areaEl.appendChild(el);
        state.playerEl = el;
      }

      function getPlayerLevelByEatCount() {
        if (state.eatCount >= LEVEL_UP_REQUIREMENTS[4]) return 4;
        if (state.eatCount >= LEVEL_UP_REQUIREMENTS[3]) return 3;
        if (state.eatCount >= LEVEL_UP_REQUIREMENTS[2]) return 2;
        return 1;
      }

      function updatePlayerStats() {
        const nextLevel = getPlayerLevelByEatCount();
        const meta = getLevelMeta(nextLevel);

        player.level = nextLevel;
        state.playerLevel = nextLevel;
        player.size = meta.sizeMax;
        player.speed = clamp(4.9 - (nextLevel - 1) * 0.38, 3.5, 4.9);

        if (state.playerEl) {
          state.playerEl.textContent = meta.emoji;
        }
      }

      function renderPlayer() {
        if (!state.playerEl) return;

        state.playerEl.style.left = `${player.x}px`;
        state.playerEl.style.top = `${player.y}px`;
        state.playerEl.style.width = `${player.size}px`;
        state.playerEl.style.height = `${player.size}px`;
        state.playerEl.style.fontSize = `${Math.max(22, player.size * 0.74)}px`;
        state.playerEl.style.transform = `scaleX(${-player.facingX})`;
        state.playerEl.style.filter = "drop-shadow(0 8px 10px rgba(0,0,0,0.18))";
      }

      function getWeightedEnemyLevel() {
        const roll = Math.random();

        if (state.playerLevel === 1) {
          if (roll < 0.52) return 1;
          if (roll < 0.80) return 2;
          if (roll < 0.95) return 3;
          return 4;
        }

        if (state.playerLevel === 2) {
          if (roll < 0.34) return 1;
          if (roll < 0.66) return 2;
          if (roll < 0.88) return 3;
          return 4;
        }

        if (state.playerLevel === 3) {
          if (roll < 0.22) return 1;
          if (roll < 0.46) return 2;
          if (roll < 0.76) return 3;
          return 4;
        }

        if (roll < 0.16) return 1;
        if (roll < 0.34) return 2;
        if (roll < 0.60) return 3;
        return 4;
      }

      function getEnemyCountsByLevel() {
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
        for (const enemy of state.enemies) {
          counts[enemy.level] += 1;
        }
        return counts;
      }

      function pickBalancedEnemyLevel() {
        const counts = getEnemyCountsByLevel();
        const targetCaps = { 1: 4, 2: 3, 3: 2, 4: 1 };

        const preferred = getWeightedEnemyLevel();
        if (counts[preferred] < targetCaps[preferred]) {
          return preferred;
        }

        const candidates = [1, 2, 3, 4].filter((level) => counts[level] < targetCaps[level]);
        if (candidates.length > 0) {
          return candidates[Math.floor(Math.random() * candidates.length)];
        }

        return preferred;
      }

      function createEnemy(level = null) {
        if (state.enemies.length >= MAX_ENEMIES) return;

        const actualLevel = level || pickBalancedEnemyLevel();
        const meta = getLevelMeta(actualLevel);

        const el = document.createElement("div");
        el.style.position = "absolute";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.userSelect = "none";
        el.style.pointerEvents = "none";
        el.style.transition = "transform 0.08s linear";
        el.style.zIndex = "3";

        const area = getAreaSize();
        const fromLeft = Math.random() > 0.5;
        const size = randomBetween(meta.sizeMin, meta.sizeMax);
        const speedBase = randomBetween(meta.speedMin, meta.speedMax);

        const enemy = {
          el,
          level: actualLevel,
          size,
          x: fromLeft ? -size - randomBetween(10, 120) : area.width + randomBetween(10, 120),
          y: randomBetween(20, Math.max(21, area.height - size - 20)),
          vx: (fromLeft ? 1 : -1) * speedBase,
          vy: randomBetween(-0.42, 0.42),
          turnTimer: Math.floor(randomBetween(30, 95)),
          isRemoving: false
        };

        areaEl.appendChild(el);
        state.enemies.push(enemy);
        renderEnemy(enemy);
      }

      function ensureEnemies() {
        while (state.running && state.enemies.length < MAX_ENEMIES) {
          createEnemy();
        }
      }

      function renderEnemy(enemy) {
        const meta = getLevelMeta(enemy.level);

        enemy.el.style.left = `${enemy.x}px`;
        enemy.el.style.top = `${enemy.y}px`;
        enemy.el.style.width = `${enemy.size}px`;
        enemy.el.style.height = `${enemy.size}px`;
        enemy.el.style.fontSize = `${Math.max(18, enemy.size * 0.72)}px`;
        enemy.el.style.transform = `scaleX(${enemy.vx >= 0 ? -1 : 1})`;
        enemy.el.textContent = meta.emoji;
        enemy.el.style.textShadow = enemy.level >= 4 ? "0 0 16px rgba(255, 76, 76, 0.18)" : "none";
        enemy.el.style.filter = "drop-shadow(0 7px 10px rgba(0,0,0,0.16))";
      }

      function removeEnemy(enemy) {
        const idx = state.enemies.indexOf(enemy);
        if (idx >= 0) {
          state.enemies.splice(idx, 1);
        }
        if (enemy.el && enemy.el.parentNode) {
          enemy.el.parentNode.removeChild(enemy.el);
        }
      }

      function removeAllEnemies() {
        while (state.enemies.length > 0) {
          removeEnemy(state.enemies[0]);
        }
      }

      function queueRespawn() {
        const timerId = setTimeout(() => {
          state.pendingRespawns.delete(timerId);
          if (!state.running) return;
          if (state.enemies.length < MAX_ENEMIES) {
            createEnemy();
          }
        }, RESPAWN_DELAY_MS);

        state.pendingRespawns.add(timerId);
      }

      function clearPendingRespawns() {
        for (const timerId of state.pendingRespawns) {
          clearTimeout(timerId);
        }
        state.pendingRespawns.clear();
      }

      function resetKeyState() {
        keyState.up = false;
        keyState.down = false;
        keyState.left = false;
        keyState.right = false;
      }

      function updatePlayerMovement() {
        const area = getAreaSize();

        if (keyState.up) player.y -= player.speed;
        if (keyState.down) player.y += player.speed;

        if (keyState.left) {
          player.x -= player.speed;
          player.dirX = -1;
        }

        if (keyState.right) {
          player.x += player.speed;
          player.dirX = 1;
        }

        if (keyState.left || keyState.right) {
          player.facingX = player.dirX;
        }

        player.x = clamp(player.x, 0, area.width - player.size);
        player.y = clamp(player.y, 0, area.height - player.size);

        renderPlayer();
      }

      function getEnemyBehavior(enemy) {
        if (enemy.level < player.level) return "prey";
        if (enemy.level > player.level) return "hunter";

        if (enemy.size < player.size * 0.9) return "prey";
        if (enemy.size > player.size * 1.1) return "hunter";
        return "neutral";
      }

      function updateEnemies() {
        const area = getAreaSize();
        const playerCenterX = player.x + player.size / 2;
        const playerCenterY = player.y + player.size / 2;

        for (const enemy of [...state.enemies]) {
          const behavior = getEnemyBehavior(enemy);
          const enemyCenterX = enemy.x + enemy.size / 2;
          const enemyCenterY = enemy.y + enemy.size / 2;

          const dx = playerCenterX - enemyCenterX;
          const dy = playerCenterY - enemyCenterY;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;

          enemy.turnTimer -= 1;

          if (behavior === "prey") {
            if (distance < 200) {
              enemy.vx += (-dx / distance) * 0.08;
              enemy.vy += (-dy / distance) * 0.08;
            }
          } else if (behavior === "hunter") {
            if (distance < 260) {
              enemy.vx += (dx / distance) * 0.10;
              enemy.vy += (dy / distance) * 0.10;
            }
          } else if (enemy.turnTimer <= 0) {
            enemy.vx += randomBetween(-0.20, 0.20);
            enemy.vy += randomBetween(-0.12, 0.12);
            enemy.turnTimer = Math.floor(randomBetween(35, 100));
          }

          const meta = getLevelMeta(enemy.level);
          const speedLimit = meta.speedMax + (behavior === "hunter" ? 0.30 : 0);

          enemy.vx = clamp(enemy.vx, -speedLimit, speedLimit);
          enemy.vy = clamp(enemy.vy, -1.0, 1.0);

          enemy.x += enemy.vx;
          enemy.y += enemy.vy;

          if (enemy.y <= 0 || enemy.y >= area.height - enemy.size) {
            enemy.vy *= -1;
            enemy.y = clamp(enemy.y, 0, area.height - enemy.size);
          }

          if (enemy.x < -enemy.size - 140 || enemy.x > area.width + 140) {
            removeEnemy(enemy);
            queueRespawn();
            continue;
          }

          renderEnemy(enemy);
        }
      }

      function getHitCircle(entity, radiusScale) {
        return {
          x: entity.x + entity.size / 2,
          y: entity.y + entity.size / 2,
          r: entity.size * radiusScale
        };
      }

      function circlesCollide(circleA, circleB) {
        const dx = circleA.x - circleB.x;
        const dy = circleA.y - circleB.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= circleA.r + circleB.r;
      }

      function canPlayerEat(enemy) {
        if (player.level > enemy.level) return true;
        if (player.level < enemy.level) return false;

        return player.size >= enemy.size * 0.94;
      }

      function canEnemyEatPlayer(enemy) {
        if (enemy.level > player.level) return true;
        if (enemy.level < player.level) return false;

        return enemy.size > player.size * 1.06;
      }

      function eatEnemy(enemy) {
        if (enemy.isRemoving) return;

        enemy.isRemoving = true;
        state.score += Math.max(1, enemy.level);
        state.eatCount += 1;
        state.lastEatAt = Date.now();
        setScore(state.score);

        updatePlayerStats();

        enemy.el.style.transition = "transform 0.18s ease, opacity 0.18s ease";
        enemy.el.style.transform += " scale(0.15)";
        enemy.el.style.opacity = "0";

        setTimeout(() => {
          removeEnemy(enemy);
          queueRespawn();
        }, 180);
      }

      function checkCollisions() {
        const now = Date.now();

        if (now - state.lastEatAt < EAT_COOLDOWN_MS) {
          return;
        }

        const playerEatCircle = getHitCircle(player, 0.23);
        const playerDangerCircle = getHitCircle(player, 0.19);

        for (const enemy of [...state.enemies]) {
          if (enemy.isRemoving) continue;

          const enemyEatCircle = getHitCircle(enemy, 0.21);
          const enemyDangerCircle = getHitCircle(enemy, 0.18);

          const canEatNow =
            circlesCollide(playerEatCircle, enemyEatCircle) && canPlayerEat(enemy);

          if (canEatNow) {
            eatEnemy(enemy);
            return;
          }

          const enemyCanReallyEat =
            circlesCollide(playerDangerCircle, enemyDangerCircle) &&
            canEnemyEatPlayer(enemy);

          if (enemyCanReallyEat) {
            setResultText(
              `โดนปลาระดับสูงกว่ากินแล้ว! ปลาของเรากินปลาได้ ${state.score} ตัว รับโบนัส +${state.score} คะแนน`
            );
            finishNow();
            return;
          }
        }
      }

      function loop() {
        if (!state.running) return;

        updatePlayerMovement();
        updateEnemies();
        checkCollisions();

        state.frameId = requestAnimationFrame(loop);
      }

      return {
        setup() {
          applyWaterStyles();
        },

        start() {
          state.running = true;
          state.score = 0;
          state.eatCount = 0;
          state.playerLevel = 1;
          state.lastEatAt = 0;
          setScore(0);
          setResultText("");

          player.x = 90;
          player.y = 150;
          player.level = 1;
          player.dirX = 1;
          player.facingX = 1;
          player.size = getLevelMeta(1).sizeMax;
          player.speed = 4.9;

          resetKeyState();
          clearPendingRespawns();
          removeAllEnemies();

          if (state.playerEl && state.playerEl.parentNode) {
            state.playerEl.parentNode.removeChild(state.playerEl);
          }

          createPlayerElement();
          updatePlayerStats();
          renderPlayer();

          ensureEnemies();
          startBubbleLoop();
          loop();
        },

        stop() {
          state.running = false;

          if (state.frameId) {
            cancelAnimationFrame(state.frameId);
            state.frameId = null;
          }

          stopBubbleLoop();
          clearPendingRespawns();

          if (state.playerEl && state.playerEl.parentNode) {
            state.playerEl.parentNode.removeChild(state.playerEl);
          }
          state.playerEl = null;

          removeAllEnemies();
          clearAreaInlineStyles();
        },

        onKeyDown(key) {
          if (key === "w" || key === "arrowup") keyState.up = true;
          if (key === "s" || key === "arrowdown") keyState.down = true;
          if (key === "a" || key === "arrowleft") keyState.left = true;
          if (key === "d" || key === "arrowright") keyState.right = true;
        },

        onKeyUp(key) {
          if (key === "w" || key === "arrowup") keyState.up = false;
          if (key === "s" || key === "arrowdown") keyState.down = false;
          if (key === "a" || key === "arrowleft") keyState.left = false;
          if (key === "d" || key === "arrowright") keyState.right = false;
        },

        getScore() {
          return state.score;
        }
      };
    },

    finishText(score) {
      return `จบมินิเกม! ปลาของเรากินปลาได้ ${score} ตัว รับโบนัส +${score} คะแนน`;
    }
  };
});