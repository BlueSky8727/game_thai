//js/mini-games/game7.js
window.MiniGameShared.register("game7", (config = {}) => {
  const duration = Number(config.duration) || 10;
  const surviveScore = Number(config.bonusPerCatch) || 10;

  return {
    id: "game7",
    title: "หนีเสือ",
    description: `วิ่งหนีเสือให้อยู่รอดจนหมดเวลา ${duration} วินาที`,
    overlayTitle: "มินิเกม: หนีเสือ",
    overlayDescription:
      "ใช้ปุ่ม W A S D หรือปุ่มลูกศร บังคับผู้เล่นวิ่งหนีเสือให้รอด ถ้ารอดจนหมดเวลาจะได้ 10 คะแนน",
    themeClass: "theme-forest",
    duration,

    finishText(score) {
      if (score >= surviveScore) {
        return `หมดเวลา! คุณหนีเสือสำเร็จ ได้ ${score} คะแนน`;
      }
      return "โดนเสือจับได้ ไม่ได้คะแนนโบนัส";
    },

    finishPopupMessage(score) {
      if (score >= surviveScore) {
        return "ยอดเยี่ยม! หนีรอดจนหมดเวลาได้สำเร็จ";
      }
      return "พลาดโดนเสือจับ ลองใหม่อีกครั้งนะ";
    },

    createController(context) {
      const { areaEl, playerEl, utils, setScore, setResultText, clearAreaInlineStyles } = context;
      const { clamp } = utils;

      let animationId = null;
      let finished = false;
      let score = 0;
      let input = null;

      const state = {
        width: 0,
        height: 0,
        player: {
          x: 0,
          y: 0,
          size: 54,
          speed: 4.8
        },
        tiger: {
          x: 0,
          y: 0,
          size: 60,
          speed: 2.35
        }
      };

      const keys = {
        up: false,
        down: false,
        left: false,
        right: false
      };

      let tigerEl = null;

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
          "linear-gradient(180deg, #eef9ef 0%, #cfeebe 45%, #7fc45f 100%)";
        areaEl.style.border = "3px solid rgba(89, 146, 63, 0.24)";
      }

      function createTiger() {
        tigerEl = document.createElement("div");
        tigerEl.textContent = "🐅";
        tigerEl.style.position = "absolute";
        tigerEl.style.width = `${state.tiger.size}px`;
        tigerEl.style.height = `${state.tiger.size}px`;
        tigerEl.style.display = "flex";
        tigerEl.style.alignItems = "center";
        tigerEl.style.justifyContent = "center";
        tigerEl.style.fontSize = "42px";
        tigerEl.style.pointerEvents = "none";
        tigerEl.style.userSelect = "none";
        tigerEl.style.zIndex = "4";
        tigerEl.style.filter = "drop-shadow(0 10px 14px rgba(0,0,0,0.18))";
        areaEl.appendChild(tigerEl);
      }

      function updatePlayerEl() {
        playerEl.style.display = "flex";
        playerEl.style.width = `${state.player.size}px`;
        playerEl.style.height = `${state.player.size}px`;
        playerEl.style.left = `${state.player.x}px`;
        playerEl.style.top = `${state.player.y}px`;
        playerEl.textContent = "🏃";
      }

      function updateTigerEl() {
        tigerEl.style.left = `${state.tiger.x}px`;
        tigerEl.style.top = `${state.tiger.y}px`;
      }

      function hitTest() {
        return (
          state.player.x < state.tiger.x + state.tiger.size &&
          state.player.x + state.player.size > state.tiger.x &&
          state.player.y < state.tiger.y + state.tiger.size &&
          state.player.y + state.player.size > state.tiger.y
        );
      }

      function finishLose() {
        if (finished) return;
        finished = true;
        score = 0;
        setScore(0);
        setResultText("โดนเสือจับได้ ไม่ได้คะแนนโบนัส");
      }

      function getMoveState() {
        return {
          up: keys.up || (input && input.state.up),
          down: keys.down || (input && input.state.down),
          left: keys.left || (input && input.state.left),
          right: keys.right || (input && input.state.right)
        };
      }

      function updatePlayer() {
        const move = getMoveState();

        if (move.up) state.player.y -= state.player.speed;
        if (move.down) state.player.y += state.player.speed;
        if (move.left) state.player.x -= state.player.speed;
        if (move.right) state.player.x += state.player.speed;

        state.player.x = clamp(state.player.x, 0, state.width - state.player.size);
        state.player.y = clamp(state.player.y, 0, state.height - state.player.size);

        updatePlayerEl();
      }

      function updateTiger() {
        const dx = state.player.x - state.tiger.x;
        const dy = state.player.y - state.tiger.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        state.tiger.x += (dx / dist) * state.tiger.speed;
        state.tiger.y += (dy / dist) * state.tiger.speed;

        state.tiger.x = clamp(state.tiger.x, 0, state.width - state.tiger.size);
        state.tiger.y = clamp(state.tiger.y, 0, state.height - state.tiger.size);

        updateTigerEl();
      }

      function loop() {
        if (finished) return;

        updatePlayer();
        updateTiger();

        if (hitTest()) {
          finishLose();
          return;
        }

        animationId = requestAnimationFrame(loop);
      }

      return {
        setup() {
          const area = getAreaSize();
          state.width = area.width;
          state.height = area.height;

          applyAreaStyle();

          input = window.MiniGameShared.createInputManager();
          input.attach(areaEl, { showVirtualControls: true });

          state.player.x = 36;
          state.player.y = state.height - state.player.size - 24;

          state.tiger.x = state.width - state.tiger.size - 40;
          state.tiger.y = 40;

          playerEl.className = "player";
          createTiger();
          updatePlayerEl();
          updateTigerEl();
          setScore(0);
        },

        start() {
          finished = false;
          loop();
        },

        stop() {
          if (!finished) {
            score = surviveScore;
            setScore(score);
            setResultText(`หมดเวลา! คุณหนีเสือสำเร็จ ได้ ${score} คะแนน`);
          }

          if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
          }

          if (input) {
            input.detach();
            input = null;
          }

          if (tigerEl && tigerEl.parentNode) {
            tigerEl.parentNode.removeChild(tigerEl);
          }
          tigerEl = null;
        },

        onKeyDown(key) {
          if (key === "w" || key === "arrowup") keys.up = true;
          if (key === "s" || key === "arrowdown") keys.down = true;
          if (key === "a" || key === "arrowleft") keys.left = true;
          if (key === "d" || key === "arrowright") keys.right = true;
        },

        onKeyUp(key) {
          if (key === "w" || key === "arrowup") keys.up = false;
          if (key === "s" || key === "arrowdown") keys.down = false;
          if (key === "a" || key === "arrowleft") keys.left = false;
          if (key === "d" || key === "arrowright") keys.right = false;
        },

        getScore() {
          return score;
        }
      };
    }
  };
});