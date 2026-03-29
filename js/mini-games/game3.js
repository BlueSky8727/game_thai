//js/mini-games/game3.js
window.MiniGameShared.register("game3", (config = {}) => {
  const duration = Number(config.duration) || 10;
  const bonusPerCatch = Number(config.bonusPerCatch) || 1;

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

      const { clamp, randomBetween, isColliding } = utils;

      const state = {
        running: false,
        frameId: null,
        enemies: [],
        score: 0,
        eatCount: 0
      };

      const player = {
        x: 120,
        y: 120,
        size: 56,
        speed: 4.6,
        dirX: 1,
        targetDirX: 1
      };

      const keyState = {
        up: false,
        down: false,
        left: false,
        right: false
      };

      function getAreaSize() {
        return {
          width: areaEl.clientWidth,
          height: areaEl.clientHeight
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
        state.bubbleInterval = setInterval(() => {
          if (!state.running) return;
          createBubble();
        }, 650);
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
        el.textContent = "🐟";
        areaEl.appendChild(el);
        state.playerEl = el;
      }

      function getScaleByEatCount() {
        return 1 + state.eatCount * 0.12;
      }

      function updatePlayerStats() {
        const scale = getScaleByEatCount();
        player.size = clamp(56 * scale, 56, 132);
        player.speed = clamp(4.8 - state.eatCount * 0.08, 3.2, 4.8);
      }

      function renderPlayer() {
        if (!state.playerEl) return;

        state.playerEl.style.left = `${player.x}px`;
        state.playerEl.style.top = `${player.y}px`;
        state.playerEl.style.width = `${player.size}px`;
        state.playerEl.style.height = `${player.size}px`;
        state.playerEl.style.fontSize = `${Math.max(28, player.size * 0.7)}px`;
        state.playerEl.style.transform = `scaleX(${player.dirX >= 0 ? 1 : -1})`;
        state.playerEl.style.filter = `
          drop-shadow(0 8px 10px rgba(0,0,0,0.18))
        `;
      }

      function createEnemy(type = "small") {
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
        const baseSize =
          type === "small"
            ? randomBetween(28, 46)
            : randomBetween(70, 112);

        const enemy = {
          el,
          type,
          size: baseSize,
          x: fromLeft ? -baseSize - randomBetween(10, 120) : area.width + randomBetween(10, 120),
          y: randomBetween(20, Math.max(21, area.height - baseSize - 20)),
          vx:
            type === "small"
              ? (fromLeft ? 1 : -1) * randomBetween(1.1, 2.4)
              : (fromLeft ? 1 : -1) * randomBetween(1.8, 3.1),
          vy: randomBetween(-0.55, 0.55),
          turnTimer: Math.floor(randomBetween(25, 85)),
          isDanger: false
        };

        areaEl.appendChild(el);
        state.enemies.push(enemy);
        renderEnemy(enemy);
      }

      function ensureEnemies() {
        const smallCount = state.enemies.filter((e) => e.type === "small").length;
        const bigCount = state.enemies.filter((e) => e.type === "big").length;

        for (let i = smallCount; i < 7; i += 1) {
          createEnemy("small");
        }

        for (let i = bigCount; i < 2; i += 1) {
          createEnemy("big");
        }
      }

      function renderEnemy(enemy) {
        enemy.el.style.left = `${enemy.x}px`;
        enemy.el.style.top = `${enemy.y}px`;
        enemy.el.style.width = `${enemy.size}px`;
        enemy.el.style.height = `${enemy.size}px`;
        enemy.el.style.fontSize = `${Math.max(20, enemy.size * 0.72)}px`;
        enemy.el.style.transform = `scaleX(${enemy.vx >= 0 ? 1 : -1})`;
        enemy.el.style.textShadow = enemy.type === "big"
          ? "0 0 16px rgba(255, 76, 76, 0.18)"
          : "none";

        if (enemy.type === "small") {
          enemy.el.textContent = "🐠";
          enemy.el.style.filter = "drop-shadow(0 5px 8px rgba(0,0,0,0.14))";
        } else {
          enemy.el.textContent = "🐡";
          enemy.el.style.filter = "drop-shadow(0 8px 12px rgba(0,0,0,0.18))";
        }
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
          player.targetDirX = -1;
        }
        if (keyState.right) {
          player.x += player.speed;
          player.targetDirX = 1;
        }

        player.x = clamp(player.x, 0, area.width - player.size);
        player.y = clamp(player.y, 0, area.height - player.size);
        player.dirX = player.targetDirX;

        renderPlayer();
      }

      function getEnemyBehavior(enemy) {
        if (enemy.size < player.size * 0.9) {
          return "prey";
        }
        if (enemy.size > player.size * 1.08) {
          return "hunter";
        }
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
            if (distance < 220) {
              enemy.vx += (-dx / distance) * 0.11;
              enemy.vy += (-dy / distance) * 0.11;
            }
          } else if (behavior === "hunter") {
            if (distance < 300) {
              enemy.vx += (dx / distance) * 0.15;
              enemy.vy += (dy / distance) * 0.15;
            }
          } else if (enemy.turnTimer <= 0) {
            enemy.vx += randomBetween(-0.3, 0.3);
            enemy.vy += randomBetween(-0.16, 0.16);
            enemy.turnTimer = Math.floor(randomBetween(30, 90));
          }

          const speedLimit =
            enemy.type === "big"
              ? (behavior === "hunter" ? 3.3 : 2.7)
              : 2.8;

          enemy.vx = clamp(enemy.vx, -speedLimit, speedLimit);
          enemy.vy = clamp(enemy.vy, -1.4, 1.4);

          enemy.x += enemy.vx;
          enemy.y += enemy.vy;

          if (enemy.y <= 0 || enemy.y >= area.height - enemy.size) {
            enemy.vy *= -1;
            enemy.y = clamp(enemy.y, 0, area.height - enemy.size);
          }

          if (enemy.x < -enemy.size - 140 || enemy.x > area.width + 140) {
            removeEnemy(enemy);
            createEnemy(enemy.type);
            continue;
          }

          renderEnemy(enemy);
        }

        ensureEnemies();
      }

      function getBox(entity) {
        return {
          x: entity.x,
          y: entity.y,
          size: entity.size
        };
      }

      function eatEnemy(enemy) {
        state.score += bonusPerCatch;
        state.eatCount += 1;
        setScore(state.score);
        updatePlayerStats();

        enemy.el.style.transition = "transform 0.16s ease, opacity 0.16s ease";
        enemy.el.style.transform += " scale(0.1)";
        enemy.el.style.opacity = "0";

        setTimeout(() => {
          removeEnemy(enemy);
          createEnemy(enemy.type === "small" ? "small" : "big");
        }, 140);
      }

      function checkCollisions() {
        const playerBox = getBox(player);

        for (const enemy of [...state.enemies]) {
          if (!isColliding(playerBox, getBox(enemy))) continue;

          const playerCanEat = player.size > enemy.size * 1.05;

          if (playerCanEat) {
            eatEnemy(enemy);
            continue;
          }

          const enemyCanEat = enemy.size > player.size * 1.02;
          if (enemyCanEat) {
            setResultText(
              `โดนปลาที่ใหญ่กว่ากินแล้ว! ปลาของเรากินปลาได้ ${state.score} ตัว รับโบนัส +${state.score} คะแนน`
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
          setScore(0);
          setResultText("");

          player.x = 90;
          player.y = 150;
          player.dirX = 1;
          player.targetDirX = 1;
          player.size = 56;
          player.speed = 4.6;

          resetKeyState();
          removeAllEnemies();

          if (state.playerEl && state.playerEl.parentNode) {
            state.playerEl.parentNode.removeChild(state.playerEl);
          }

          createPlayerElement();
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