//js/mini-games/game10.js
window.MiniGameShared.register("game10", (config = {}) => {
  const duration = Number(config.duration) || 12;
  const winScore = Number(config.bonusPerCatch) || 10;

  return {
    id: "game10",
    title: "เดินตีพร้า",
    description: `เดินไปตีเหล็กทำพร้าให้สำเร็จ โดยต้องรอจังหวะให้ถูกภายใน ${duration} วินาที`,
    overlayTitle: "มินิเกม: เดินตีพร้า",
    overlayDescription:
      "เมื่อขึ้นคำว่า เดิน ให้ขยับไปข้างหน้าได้ แต่เมื่อขึ้นคำว่า หยุด ต้องหยุดทันที ถ้าขยับตอนหยุด เกมจบทันที",
    themeClass: "theme-smith",
    duration,

    finishText(score) {
      if (score >= winScore) {
        return `สำเร็จ! คุณเดินไปตีพร้าได้ทัน ได้ ${score} คะแนน`;
      }
      return "พลาด! ขยับผิดจังหวะ เกมจบ";
    },

    finishPopupMessage(score) {
      if (score >= winScore) {
        return "ใจเย็นและแม่นจังหวะมาก แบบนี้แหละช้า ๆ ได้พร้าเล่มงาม";
      }
      return "รีบเกินไปหรือขยับผิดจังหวะ ลองใหม่แบบใจเย็นกว่านี้นะ";
    },

    createController(context) {
      const { areaEl, playerEl, utils, setScore, setResultText, finishNow, clearAreaInlineStyles } = context;
      const { clamp } = utils;

      const keys = {
        left: false,
        right: false
      };

      let running = false;
      let animationId = null;
      let signalTimer = null;
      let signal = "go";
      let finished = false;
      let score = 0;

      const state = {
        width: 0,
        height: 0,
        player: {
          x: 36,
          y: 0,
          size: 58,
          speed: 3.6
        },
        goalX: 0
      };

      let signalEl = null;
      let forgeEl = null;
      let groundEl = null;

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
          "linear-gradient(180deg, #fff7e9 0%, #ffe8b6 38%, #c58a43 100%)";
        areaEl.style.border = "3px solid rgba(181, 125, 58, 0.28)";
      }

      function renderPlayer() {
        playerEl.style.display = "flex";
        playerEl.style.width = `${state.player.size}px`;
        playerEl.style.height = `${state.player.size}px`;
        playerEl.style.left = `${state.player.x}px`;
        playerEl.style.top = `${state.player.y}px`;
        playerEl.textContent = "🧑";
      }

      function createDecor() {
        groundEl = document.createElement("div");
        groundEl.style.position = "absolute";
        groundEl.style.left = "0";
        groundEl.style.right = "0";
        groundEl.style.bottom = "0";
        groundEl.style.height = "88px";
        groundEl.style.background = "rgba(112, 68, 29, 0.30)";
        groundEl.style.zIndex = "1";
        areaEl.appendChild(groundEl);

        forgeEl = document.createElement("div");
        forgeEl.textContent = "🔥⚒️";
        forgeEl.style.position = "absolute";
        forgeEl.style.right = "34px";
        forgeEl.style.bottom = "84px";
        forgeEl.style.width = "92px";
        forgeEl.style.height = "92px";
        forgeEl.style.display = "flex";
        forgeEl.style.alignItems = "center";
        forgeEl.style.justifyContent = "center";
        forgeEl.style.fontSize = "42px";
        forgeEl.style.borderRadius = "22px";
        forgeEl.style.background = "rgba(255,255,255,0.75)";
        forgeEl.style.boxShadow = "0 12px 24px rgba(0,0,0,0.14)";
        forgeEl.style.zIndex = "2";
        areaEl.appendChild(forgeEl);

        signalEl = document.createElement("div");
        signalEl.style.position = "absolute";
        signalEl.style.left = "50%";
        signalEl.style.top = "24px";
        signalEl.style.transform = "translateX(-50%)";
        signalEl.style.padding = "12px 24px";
        signalEl.style.borderRadius = "999px";
        signalEl.style.fontSize = "22px";
        signalEl.style.fontWeight = "800";
        signalEl.style.zIndex = "4";
        signalEl.style.boxShadow = "0 10px 24px rgba(0,0,0,0.12)";
        areaEl.appendChild(signalEl);
      }

      function updateSignalVisual() {
        if (signal === "go") {
          signalEl.textContent = "เดิน";
          signalEl.style.background = "linear-gradient(135deg, #d9f8cb 0%, #c9f1b8 100%)";
          signalEl.style.color = "#21611b";
        } else {
          signalEl.textContent = "หยุด";
          signalEl.style.background = "linear-gradient(135deg, #ffd7d7 0%, #ffc4c4 100%)";
          signalEl.style.color = "#8a1f1f";
        }
      }

      function switchSignal() {
        signal = signal === "go" ? "stop" : "go";
        updateSignalVisual();
      }

      function failGame() {
        if (finished) return;
        finished = true;
        running = false;
        score = 0;
        setScore(0);
        setResultText("พลาด! ขยับตอนหยุด เกมจบ");
        finishNow();
      }

      function winGame() {
        if (finished) return;
        finished = true;
        running = false;
        score = winScore;
        setScore(score);
        setResultText(`สำเร็จ! คุณเดินไปตีพร้าได้ทัน ได้ ${score} คะแนน`);
        finishNow();
      }

      function updatePlayer() {
        const wantsMove = keys.right || keys.left;

        if (signal === "stop" && wantsMove) {
          failGame();
          return;
        }

        if (signal === "go") {
          if (keys.right) {
            state.player.x += state.player.speed;
          }
          if (keys.left) {
            state.player.x -= state.player.speed;
          }
        }

        state.player.x = clamp(state.player.x, 0, state.goalX);
        renderPlayer();

        if (state.player.x >= state.goalX) {
          winGame();
        }
      }

      function loop() {
        if (!running || finished) return;
        updatePlayer();
        if (!finished) {
          animationId = requestAnimationFrame(loop);
        }
      }

      return {
        setup() {
          const area = getAreaSize();
          state.width = area.width;
          state.height = area.height;
          state.player.x = 36;
          state.player.y = state.height - state.player.size - 24;
          state.goalX = state.width - 150;

          applyAreaStyle();
          createDecor();
          updateSignalVisual();
          setScore(0);
          renderPlayer();
        },

        start() {
          running = true;
          finished = false;
          signal = "go";
          updateSignalVisual();

          signalTimer = setInterval(() => {
            switchSignal();
          }, 1300 + Math.random() * 500);

          loop();
        },

        stop() {
          running = false;

          if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
          }

          if (signalTimer) {
            clearInterval(signalTimer);
            signalTimer = null;
          }

          [signalEl, forgeEl, groundEl].forEach((el) => {
            if (el && el.parentNode) {
              el.parentNode.removeChild(el);
            }
          });

          signalEl = null;
          forgeEl = null;
          groundEl = null;
        },

        onKeyDown(key) {
          if (key === "d" || key === "arrowright") keys.right = true;
          if (key === "a" || key === "arrowleft") keys.left = true;
        },

        onKeyUp(key) {
          if (key === "d" || key === "arrowright") keys.right = false;
          if (key === "a" || key === "arrowleft") keys.left = false;
        },

        getScore() {
          return score;
        }
      };
    }
  };
});