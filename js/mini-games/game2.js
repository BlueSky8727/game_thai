//js/mini-games/game2.js
window.MiniGameShared.register("game2", (config = {}) => {
  const duration = Number(config.duration) || 10;
  const bonusPerCatch = Number(config.bonusPerCatch) || 1;
  const gridSize = Number(config.gridSize) || 40;
  const tickRate = Number(config.tickRate) || 110;
  const startLength = Number(config.startLength) || 2;

  return {
    id: "game2",
    title: "ไก่เห็นตีนงู งูเห็นนมไก่",
    description: `ควบคุมงูแบบ Snake กินไก่ให้ได้มากที่สุดภายใน ${duration} วินาที`,
    overlayTitle: "มินิเกม: Snake 3310",
    overlayDescription:
      "ใช้ปุ่ม W A S D หรือปุ่มลูกศร บังคับงูให้เลื้อยกินไก่ ทะลุขอบได้ แต่ห้ามชนตัวเอง",
    playerEmoji: "🐍",
    enemyEmoji: "🐔",
    themeClass: "theme-barn",
    duration,
    bonusPerCatch,

    createController(ctx) {
      const {
        areaEl,
        utils,
        setScore,
        finishNow,
        setResultText,
        clearAreaInlineStyles
      } = ctx;
      const { randomBetween } = utils;

      const state = {
        cols: 0,
        rows: 0,
        cellSize: gridSize,
        direction: { x: 1, y: 0 },
        nextDirection: { x: 1, y: 0 },
        segments: [],
        growPending: 0,
        score: 0,
        food: null,
        foodEl: null,
        segmentEls: [],
        tickId: null,
        running: false
      };

      function getAreaSize() {
        return {
          width: areaEl.clientWidth,
          height: areaEl.clientHeight
        };
      }

      function applyBoardStyles() {
        areaEl.style.position = "relative";
        areaEl.style.overflow = "hidden";
        areaEl.style.background =
          "linear-gradient(180deg, #d9efb8 0%, #b8d989 52%, #9ac565 100%)";
        areaEl.style.border = "3px solid #4c6b2f";
        areaEl.style.boxShadow = "inset 0 0 0 4px rgba(255,255,255,0.18)";
        areaEl.style.backgroundSize = `${state.cellSize}px ${state.cellSize}px`;
        areaEl.style.backgroundImage = `
          linear-gradient(rgba(76,107,47,0.14) 1px, transparent 1px),
          linear-gradient(90deg, rgba(76,107,47,0.14) 1px, transparent 1px)
        `;
      }

      function clearFood() {
        if (state.foodEl && state.foodEl.parentNode) {
          state.foodEl.parentNode.removeChild(state.foodEl);
        }
        state.foodEl = null;
        state.food = null;
      }

      function clearSegments() {
        state.segmentEls.forEach((el) => {
          if (el && el.parentNode) {
            el.parentNode.removeChild(el);
          }
        });
        state.segmentEls = [];
      }

      function clearBoard() {
        clearFood();
        clearSegments();
        clearAreaInlineStyles();
      }

      function stopTick() {
        if (state.tickId) {
          clearInterval(state.tickId);
          state.tickId = null;
        }
      }

      function isOccupied(x, y) {
        return state.segments.some((segment) => segment.x === x && segment.y === y);
      }

      function createSegmentEl(index) {
        const el = document.createElement("div");
        const isHead = index === 0;

        el.style.position = "absolute";
        el.style.width = `${state.cellSize - 2}px`;
        el.style.height = `${state.cellSize - 2}px`;
        el.style.borderRadius = isHead ? "10px" : "8px";
        el.style.boxSizing = "border-box";
        el.style.transition = "left 0.08s linear, top 0.08s linear";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.zIndex = isHead ? "3" : "2";
        el.style.boxShadow = "0 3px 8px rgba(0,0,0,0.16)";
        areaEl.appendChild(el);

        state.segmentEls.push(el);
        return el;
      }

      function renderSnake() {
        while (state.segmentEls.length < state.segments.length) {
          createSegmentEl(state.segmentEls.length);
        }

        while (state.segmentEls.length > state.segments.length) {
          const extra = state.segmentEls.pop();
          if (extra && extra.parentNode) {
            extra.parentNode.removeChild(extra);
          }
        }

        state.segments.forEach((segment, index) => {
          const el = state.segmentEls[index];
          const offset = 1;
          const isHead = index === 0;

          el.style.left = `${segment.x * state.cellSize + offset}px`;
          el.style.top = `${segment.y * state.cellSize + offset}px`;
          el.style.background = isHead
            ? "linear-gradient(180deg, #1f7a3f 0%, #14592d 100%)"
            : "linear-gradient(180deg, #33a357 0%, #1f7a3f 100%)";
          el.style.border = isHead
            ? "2px solid rgba(255,255,255,0.35)"
            : "1.5px solid rgba(255,255,255,0.22)";
          el.textContent = isHead ? "🐍" : "";
          el.style.fontSize = isHead
            ? `${Math.max(18, state.cellSize * 0.42)}px`
            : "0px";
        });
      }

      function spawnFood() {
        if (!state.foodEl) {
          const foodEl = document.createElement("div");
          foodEl.style.position = "absolute";
          foodEl.style.display = "flex";
          foodEl.style.alignItems = "center";
          foodEl.style.justifyContent = "center";
          foodEl.style.zIndex = "4";
          foodEl.style.fontSize = `${Math.max(18, state.cellSize * 0.42)}px`;
          foodEl.style.borderRadius = "8px";
          foodEl.style.boxSizing = "border-box";
          foodEl.style.background = "rgba(255,255,255,0.7)";
          foodEl.style.border = "1.5px solid rgba(255,255,255,0.78)";
          foodEl.style.boxShadow = "0 4px 12px rgba(0,0,0,0.16)";
          foodEl.textContent = "🐔";
          areaEl.appendChild(foodEl);
          state.foodEl = foodEl;
        }

        let x = 0;
        let y = 0;
        let guard = 0;

        do {
          x = Math.floor(randomBetween(0, state.cols));
          y = Math.floor(randomBetween(0, state.rows));
          guard += 1;
        } while (isOccupied(x, y) && guard < 400);

        state.food = { x, y };

        const offset = 1;
        state.foodEl.style.width = `${state.cellSize - 2}px`;
        state.foodEl.style.height = `${state.cellSize - 2}px`;
        state.foodEl.style.left = `${x * state.cellSize + offset}px`;
        state.foodEl.style.top = `${y * state.cellSize + offset}px`;
      }

      function initializeSnake() {
        const area = getAreaSize();
        state.cols = Math.max(8, Math.floor(area.width / state.cellSize));
        state.rows = Math.max(8, Math.floor(area.height / state.cellSize));

        const startX = Math.max(2, Math.floor(state.cols / 2));
        const startY = Math.max(2, Math.floor(state.rows / 2));

        state.direction = { x: 1, y: 0 };
        state.nextDirection = { x: 1, y: 0 };
        state.growPending = 0;
        state.score = 0;
        state.segments = [];

        for (let i = 0; i < startLength; i += 1) {
          state.segments.push({
            x: startX - i,
            y: startY
          });
        }

        setScore(0);
        renderSnake();
        spawnFood();
      }

      function handleCrash() {
        if (!state.running) return;
        setResultText(`งูชนตัวเองแล้ว! กินไก่ได้ ${state.score} ตัว รับโบนัส +${state.score} คะแนน`);
        finishNow();
      }

      function wrapPosition(head) {
        let x = head.x;
        let y = head.y;

        if (x < 0) x = state.cols - 1;
        else if (x >= state.cols) x = 0;

        if (y < 0) y = state.rows - 1;
        else if (y >= state.rows) y = 0;

        return { x, y };
      }

      function update() {
        if (!state.running) return;

        state.direction = {
          x: state.nextDirection.x,
          y: state.nextDirection.y
        };

        const head = state.segments[0];
        const movedHead = {
          x: head.x + state.direction.x,
          y: head.y + state.direction.y
        };

        const newHead = wrapPosition(movedHead);

        if (
          state.segments.some(
            (segment) => segment.x === newHead.x && segment.y === newHead.y
          )
        ) {
          handleCrash();
          return;
        }

        state.segments.unshift(newHead);

        const ateFood =
          state.food &&
          newHead.x === state.food.x &&
          newHead.y === state.food.y;

        if (ateFood) {
          state.score += bonusPerCatch;
          state.growPending += 1;
          setScore(state.score);
          spawnFood();
        }

        if (state.growPending > 0) {
          state.growPending -= 1;
        } else {
          state.segments.pop();
        }

        renderSnake();
      }

      function setDirectionFromKey(key) {
        let next = null;

        if (key === "w" || key === "arrowup") next = { x: 0, y: -1 };
        if (key === "s" || key === "arrowdown") next = { x: 0, y: 1 };
        if (key === "a" || key === "arrowleft") next = { x: -1, y: 0 };
        if (key === "d" || key === "arrowright") next = { x: 1, y: 0 };

        if (!next) return;

        const current = state.direction;
        if (current.x + next.x === 0 && current.y + next.y === 0) {
          return;
        }

        state.nextDirection = next;
      }

      return {
        setup() {
          applyBoardStyles();
          clearSegments();
          clearFood();
        },

        start() {
          state.running = true;
          applyBoardStyles();
          initializeSnake();
          stopTick();
          state.tickId = setInterval(update, tickRate);
        },

        stop() {
          state.running = false;
          stopTick();
          clearBoard();
        },

        onKeyDown(key) {
          setDirectionFromKey(key);
        },

        getScore() {
          return state.score;
        }
      };
    },

    finishText(score) {
      return `จบมินิเกม! งูกินไก่ได้ ${score} ตัว รับโบนัส +${score} คะแนน`;
    }
  };
});