//js/mini-games/game6.js
window.MiniGameShared.register("game6", (config = {}) => {
  const duration = Number(config.duration) || 15;
  const bonusPerCatch = Number(config.bonusPerCatch) || 1;

  return {
    id: "game6",
    title: "ตีงู",
    description: `งูจะโผล่ขึ้นมาบนหน้าจอ คลิกตีงูให้ทันภายใน ${duration} วินาที`,
    overlayTitle: "มินิเกม: ตีงู",
    overlayDescription:
      "งูจะโผล่ขึ้นมาบนหน้าจอ ให้รีบคลิกตีงูให้ทัน ถ้าตีโดนจะได้ 1 คะแนน",
    themeClass: "theme-forest",
    duration,

    finishText(score) {
      return `หมดเวลา! คุณตีงูได้ทั้งหมด ${score} ตัว`;
    },

    finishPopupMessage(score) {
      if (score >= 15) return "ไวมาก! จัดการงูได้เด็ดขาดสุด ๆ";
      if (score >= 8) return "ดีมาก! ตีงูได้หลายตัวเลย";
      if (score > 0) return "ดีแล้ว! ถ้าไวขึ้นอีกนิดจะได้คะแนนมากกว่านี้";
      return "ครั้งหน้ารีบคลิกให้ไวขึ้นอีกนิดนะ";
    },

    createController(context) {
      const { areaEl, playerEl, setScore, clearAreaInlineStyles } = context;

      let animationId = null;
      let spawnInterval = null;
      let score = 0;
      let running = false;
      const snakes = [];

      function getAreaSize() {
        return {
          width: areaEl.clientWidth || 680,
          height: areaEl.clientHeight || 390
        };
      }

      function applyAreaStyle() {
        clearAreaInlineStyles();
        areaEl.style.position = "relative";
        areaEl.style.overflow = "hidden";
        areaEl.style.background =
          "linear-gradient(180deg, #effbe8 0%, #d7f3c8 45%, #95d06b 100%)";
        areaEl.style.border = "3px solid rgba(108, 168, 74, 0.28)";
      }

      function removeSnake(snake) {
        const idx = snakes.indexOf(snake);
        if (idx >= 0) {
          snakes.splice(idx, 1);
        }
        if (snake.el && snake.el.parentNode) {
          snake.el.parentNode.removeChild(snake.el);
        }
      }

      function spawnSnake() {
        if (!running) return;

        const area = getAreaSize();
        const el = document.createElement("button");
        el.type = "button";
        el.textContent = "🐍";
        el.style.position = "absolute";
        el.style.left = `${Math.random() * Math.max(10, area.width - 64)}px`;
        el.style.top = `${Math.random() * Math.max(10, area.height - 64)}px`;
        el.style.width = "58px";
        el.style.height = "58px";
        el.style.border = "none";
        el.style.background = "rgba(255,255,255,0.84)";
        el.style.borderRadius = "50%";
        el.style.fontSize = "30px";
        el.style.cursor = "pointer";
        el.style.boxShadow = "0 10px 20px rgba(0,0,0,0.14)";
        el.style.zIndex = "3";
        el.style.userSelect = "none";

        const snake = {
          el,
          bornAt: Date.now(),
          lifeMs: 900 + Math.random() * 700
        };

        el.addEventListener("click", () => {
          if (!running) return;
          score += bonusPerCatch;
          setScore(score);

          el.style.transform = "scale(0.72)";
          el.style.opacity = "0.55";
          setTimeout(() => removeSnake(snake), 100);
        });

        areaEl.appendChild(el);
        snakes.push(snake);
      }

      function updateSnakes() {
        const now = Date.now();
        for (let i = snakes.length - 1; i >= 0; i -= 1) {
          const snake = snakes[i];
          if (now - snake.bornAt >= snake.lifeMs) {
            removeSnake(snake);
          }
        }
      }

      function loop() {
        if (!running) return;
        updateSnakes();
        animationId = requestAnimationFrame(loop);
      }

      return {
        setup() {
          applyAreaStyle();
          playerEl.style.display = "none";
          setScore(0);
        },

        start() {
          running = true;
          spawnSnake();
          spawnInterval = setInterval(spawnSnake, 420);
          loop();
        },

        stop() {
          running = false;

          if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
          }

          if (spawnInterval) {
            clearInterval(spawnInterval);
            spawnInterval = null;
          }

          while (snakes.length > 0) {
            removeSnake(snakes[0]);
          }
        },

        getScore() {
          return score;
        }
      };
    }
  };
});