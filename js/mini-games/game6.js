//js/mini-games/game6.js
window.MiniGameShared.register("game6", (config = {}) => {
  const duration = Number(config.duration) || 15;
  const bonusPerCatch = Number(config.bonusPerCatch) || 1;

  return {
    id: "game6",
    title: "ตีงู",
    description: `งูจะโผล่ขึ้นมาจาก 9 หลุม คลิกตีงูให้ทันภายใน ${duration} วินาที`,
    overlayTitle: "มินิเกม: ตีงู",
    overlayDescription:
      "งูจะโผล่ขึ้นมาจากหลุมทั้ง 9 หลุม ให้รีบกดตีงูให้ทัน กดโดนครั้งเดียวก็นับคะแนนทันที",
    themeClass: "theme-forest",
    duration,

    finishText(score) {
      return `หมดเวลา! คุณตีงูได้ทั้งหมด ${score} ตัว`;
    },

    finishPopupMessage(score) {
      if (score >= 18) return "ไวมาก! ตีงูแทบไม่พลาดเลย";
      if (score >= 10) return "ดีมาก! จัดการงูได้หลายตัวเลย";
      if (score > 0) return "ดีแล้ว! ถ้าไวขึ้นอีกนิดจะได้คะแนนมากกว่านี้";
      return "ครั้งหน้ารีบกดให้ไวขึ้นอีกนิดนะ";
    },

    createController(context) {
      const { areaEl, playerEl, setScore, clearAreaInlineStyles } = context;

      let animationId = null;
      let spawnInterval = null;
      let score = 0;
      let running = false;

      const holes = [];
      const activeSnakes = [];

      function applyAreaStyle() {
        clearAreaInlineStyles();
        areaEl.style.position = "relative";
        areaEl.style.overflow = "hidden";
        areaEl.style.background =
          "linear-gradient(180deg, #eefbe5 0%, #d9f4c9 42%, #a3d977 100%)";
        areaEl.style.border = "3px solid rgba(108, 168, 74, 0.28)";
        areaEl.style.display = "grid";
        areaEl.style.gridTemplateColumns = "repeat(3, 1fr)";
        areaEl.style.gridTemplateRows = "repeat(3, 1fr)";
        areaEl.style.gap = "14px";
        areaEl.style.padding = "14px";
        areaEl.style.boxSizing = "border-box";
      }

      function createPart(styles = {}) {
        const el = document.createElement("div");
        el.style.position = "absolute";
        el.style.boxSizing = "border-box";
        Object.assign(el.style, styles);
        return el;
      }

      function clearHoles() {
        while (holes.length > 0) {
          const hole = holes.pop();
          if (hole?.el && hole.el.parentNode) {
            hole.el.parentNode.removeChild(hole.el);
          }
        }
      }

      function removeSnake(snake) {
        const idx = activeSnakes.indexOf(snake);
        if (idx >= 0) {
          activeSnakes.splice(idx, 1);
        }

        if (snake?.timeoutId) {
          clearTimeout(snake.timeoutId);
          snake.timeoutId = null;
        }

        if (snake?.cleanupTimer) {
          clearTimeout(snake.cleanupTimer);
          snake.cleanupTimer = null;
        }

        if (snake?.hole) {
          snake.hole.busy = false;
          snake.hole.currentSnake = null;
        }

        if (snake?.el && snake.el.parentNode) {
          snake.el.parentNode.removeChild(snake.el);
        }
      }

      function createHole(index) {
        const holeEl = document.createElement("div");
        holeEl.style.position = "relative";
        holeEl.style.width = "100%";
        holeEl.style.height = "100%";
        holeEl.style.minHeight = "0";
        holeEl.style.borderRadius = "28px";
        holeEl.style.background =
          "linear-gradient(180deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.08) 100%)";
        holeEl.style.boxShadow =
          "inset 0 1px 0 rgba(255,255,255,0.34), inset 0 -18px 36px rgba(78,122,35,0.12)";
        holeEl.style.overflow = "hidden";
        holeEl.style.display = "flex";
        holeEl.style.alignItems = "center";
        holeEl.style.justifyContent = "center";

        const ground = createPart({
          left: "0",
          right: "0",
          bottom: "0",
          height: "46%",
          background:
            "linear-gradient(180deg, rgba(144,201,93,0.12) 0%, rgba(120,183,72,0.18) 18%, rgba(97,160,63,0.30) 100%)",
          zIndex: "0"
        });

        const grass1 = createPart({
          left: "8%",
          bottom: "28%",
          width: "22%",
          height: "18%",
          borderBottom: "3px solid rgba(88,142,47,0.45)",
          borderRadius: "0 0 50px 50px",
          transform: "rotate(-8deg)",
          zIndex: "0"
        });

        const grass2 = createPart({
          right: "10%",
          bottom: "25%",
          width: "24%",
          height: "18%",
          borderBottom: "3px solid rgba(88,142,47,0.45)",
          borderRadius: "0 0 50px 50px",
          transform: "rotate(8deg)",
          zIndex: "0"
        });

        const holeShadow = createPart({
          left: "50%",
          bottom: "13%",
          width: "66%",
          height: "24%",
          transform: "translateX(-50%)",
          borderRadius: "999px",
          background:
            "radial-gradient(circle at center, #1e120b 0%, #2c1a11 42%, #4b2f1b 70%, rgba(75,47,27,0.18) 100%)",
          boxShadow:
            "inset 0 10px 16px rgba(0,0,0,0.34), 0 6px 10px rgba(61,40,22,0.16)",
          pointerEvents: "none",
          zIndex: "1"
        });

        const holeRim = createPart({
          left: "50%",
          bottom: "12.2%",
          width: "72%",
          height: "27%",
          transform: "translateX(-50%)",
          borderRadius: "999px",
          border: "5px solid rgba(117, 79, 42, 0.40)",
          boxShadow: "inset 0 2px 6px rgba(255,255,255,0.12)",
          pointerEvents: "none",
          zIndex: "0"
        });

        const dirtTop = createPart({
          left: "50%",
          bottom: "18%",
          width: "56%",
          height: "9%",
          transform: "translateX(-50%)",
          borderRadius: "999px",
          background: "rgba(165, 119, 69, 0.24)",
          zIndex: "1"
        });

        holeEl.appendChild(ground);
        holeEl.appendChild(grass1);
        holeEl.appendChild(grass2);
        holeEl.appendChild(holeRim);
        holeEl.appendChild(holeShadow);
        holeEl.appendChild(dirtTop);
        areaEl.appendChild(holeEl);

        const hole = {
          index,
          el: holeEl,
          busy: false,
          currentSnake: null
        };

        holes.push(hole);
      }

      function createAllHoles() {
        clearHoles();
        for (let i = 0; i < 9; i += 1) {
          createHole(i);
        }
      }

      function chooseFreeHole() {
        const freeHoles = holes.filter((hole) => !hole.busy);
        if (freeHoles.length === 0) return null;
        return freeHoles[Math.floor(Math.random() * freeHoles.length)];
      }

      function createSnakeVisual(container) {
        const wrap = createPart({
          left: "50%",
          bottom: "0",
          width: "70%",
          height: "94%",
          transform: "translateX(-50%)",
          zIndex: "2"
        });

        const bodyBack = createPart({
          left: "50%",
          bottom: "2%",
          width: "28%",
          height: "52%",
          transform: "translateX(-50%)",
          borderRadius: "999px 999px 18px 18px",
          background: "linear-gradient(180deg, #5ea63b 0%, #2f6e22 100%)",
          boxShadow: "inset 0 3px 8px rgba(255,255,255,0.10)"
        });

        const bodyMid = createPart({
          left: "50%",
          bottom: "22%",
          width: "21%",
          height: "30%",
          transform: "translateX(-50%)",
          borderRadius: "999px",
          background: "linear-gradient(180deg, #72bf4f 0%, #3e822c 100%)"
        });

        const hoodLeft = createPart({
          left: "27%",
          top: "28%",
          width: "20%",
          height: "25%",
          borderRadius: "60% 50% 40% 65%",
          background: "linear-gradient(180deg, #78c455 0%, #4b9135 100%)",
          transform: "rotate(20deg)"
        });

        const hoodRight = createPart({
          right: "27%",
          top: "28%",
          width: "20%",
          height: "25%",
          borderRadius: "50% 60% 65% 40%",
          background: "linear-gradient(180deg, #78c455 0%, #4b9135 100%)",
          transform: "rotate(-20deg)"
        });

        const head = createPart({
          left: "50%",
          top: "12%",
          width: "42%",
          height: "34%",
          transform: "translateX(-50%)",
          borderRadius: "50% 50% 44% 44%",
          background: "linear-gradient(180deg, #8ad163 0%, #4c9534 100%)",
          boxShadow:
            "inset 0 4px 6px rgba(255,255,255,0.18), 0 4px 10px rgba(0,0,0,0.12)"
        });

        const faceHighlight = createPart({
          left: "50%",
          top: "14%",
          width: "40%",
          height: "12%",
          transform: "translateX(-50%)",
          borderRadius: "999px",
          background: "rgba(232,255,188,0.36)"
        });

        const eyeLeft = createPart({
          left: "24%",
          top: "28%",
          width: "8%",
          height: "10%",
          borderRadius: "50%",
          background: "#132811"
        });

        const eyeRight = createPart({
          right: "24%",
          top: "28%",
          width: "8%",
          height: "10%",
          borderRadius: "50%",
          background: "#132811"
        });

        const eyeGlowLeft = createPart({
          left: "26%",
          top: "30%",
          width: "3%",
          height: "4%",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.85)"
        });

        const eyeGlowRight = createPart({
          right: "26%",
          top: "30%",
          width: "3%",
          height: "4%",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.85)"
        });

        const noseLeft = createPart({
          left: "42%",
          top: "47%",
          width: "4%",
          height: "5%",
          borderRadius: "50%",
          background: "rgba(34,52,24,0.55)"
        });

        const noseRight = createPart({
          right: "42%",
          top: "47%",
          width: "4%",
          height: "5%",
          borderRadius: "50%",
          background: "rgba(34,52,24,0.55)"
        });

        const mouth = createPart({
          left: "50%",
          top: "54%",
          width: "16%",
          height: "6%",
          transform: "translateX(-50%)",
          borderBottom: "2px solid rgba(40, 56, 28, 0.56)",
          borderRadius: "0 0 10px 10px"
        });

        const tongue = createPart({
          left: "50%",
          top: "59%",
          width: "12%",
          height: "18%",
          transform: "translateX(-50%)",
          background: "#ff5a78",
          clipPath:
            "polygon(40% 0, 60% 0, 60% 62%, 100% 100%, 68% 100%, 50% 76%, 32% 100%, 0 100%, 40% 62%)"
        });

        const belly = createPart({
          left: "50%",
          bottom: "8%",
          width: "11%",
          height: "56%",
          transform: "translateX(-50%)",
          borderRadius: "999px",
          background: "linear-gradient(180deg, rgba(215,245,149,0.95) 0%, rgba(174,219,103,0.88) 100%)"
        });

        const stripe1 = createPart({
          left: "50%",
          top: "34%",
          width: "10%",
          height: "5%",
          transform: "translateX(-50%) rotate(2deg)",
          borderRadius: "999px",
          background: "rgba(68,111,38,0.28)"
        });

        const stripe2 = createPart({
          left: "50%",
          top: "45%",
          width: "12%",
          height: "5%",
          transform: "translateX(-50%) rotate(-2deg)",
          borderRadius: "999px",
          background: "rgba(68,111,38,0.28)"
        });

        const stripe3 = createPart({
          left: "50%",
          top: "56%",
          width: "10%",
          height: "5%",
          transform: "translateX(-50%) rotate(2deg)",
          borderRadius: "999px",
          background: "rgba(68,111,38,0.28)"
        });

        head.appendChild(faceHighlight);
        head.appendChild(eyeLeft);
        head.appendChild(eyeRight);
        head.appendChild(eyeGlowLeft);
        head.appendChild(eyeGlowRight);
        head.appendChild(noseLeft);
        head.appendChild(noseRight);
        head.appendChild(mouth);
        head.appendChild(tongue);

        wrap.appendChild(bodyBack);
        wrap.appendChild(bodyMid);
        wrap.appendChild(hoodLeft);
        wrap.appendChild(hoodRight);
        wrap.appendChild(head);
        wrap.appendChild(belly);
        wrap.appendChild(stripe1);
        wrap.appendChild(stripe2);
        wrap.appendChild(stripe3);

        container.appendChild(wrap);

        return { wrap, head, tongue };
      }

      function spawnSnake() {
        if (!running) return;

        const hole = chooseFreeHole();
        if (!hole) return;

        hole.busy = true;

        const snakeEl = document.createElement("button");
        snakeEl.type = "button";
        snakeEl.setAttribute("aria-label", "snake");
        snakeEl.style.position = "absolute";
        snakeEl.style.left = "50%";
        snakeEl.style.bottom = "15%";
        snakeEl.style.transform = "translate(-50%, 92%) scale(0.92)";
        snakeEl.style.width = "62%";
        snakeEl.style.height = "88%";
        snakeEl.style.minWidth = "130px";
        snakeEl.style.maxWidth = "190px";
        snakeEl.style.border = "none";
        snakeEl.style.background = "transparent";
        snakeEl.style.cursor = "pointer";
        snakeEl.style.padding = "0";
        snakeEl.style.margin = "0";
        snakeEl.style.zIndex = "3";
        snakeEl.style.userSelect = "none";
        snakeEl.style.touchAction = "manipulation";
        snakeEl.style.transition =
          "transform 170ms ease, opacity 170ms ease, filter 170ms ease";
        snakeEl.style.filter = "drop-shadow(0 10px 18px rgba(0,0,0,0.18))";

        const hitCircle = createPart({
          left: "50%",
          top: "8%",
          width: "82%",
          height: "78%",
          transform: "translateX(-50%)",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.02)"
        });

        snakeEl.appendChild(hitCircle);
        const snakeVisual = createSnakeVisual(snakeEl);

        const snake = {
          el: snakeEl,
          hole,
          bornAt: Date.now(),
          lifeMs: 820 + Math.random() * 520,
          hit: false,
          locked: false,
          timeoutId: null,
          cleanupTimer: null,
          visible: false,
          visual: snakeVisual
        };

        hole.currentSnake = snake;
        hole.el.appendChild(snakeEl);
        activeSnakes.push(snake);

        requestAnimationFrame(() => {
          if (!snake.el || snake.hit) return;
          snake.visible = true;
          snake.el.style.transform = "translate(-50%, -6%) scale(1)";
        });

        const hitSnake = (event) => {
          if (event) {
            event.preventDefault();
            event.stopPropagation();
          }

          if (!running || snake.hit || snake.locked) return;
          snake.locked = true;
          snake.hit = true;

          score += bonusPerCatch;
          setScore(score);

          snake.el.style.pointerEvents = "none";
          snake.el.style.filter = "drop-shadow(0 4px 8px rgba(255,90,20,0.28))";
          snake.el.style.transform = "translate(-50%, -8%) scale(0.88)";

          if (snake.visual?.head) {
            snake.visual.head.style.background =
              "linear-gradient(180deg, #ffb34f 0%, #ff6e2d 100%)";
          }
          if (snake.visual?.tongue) {
            snake.visual.tongue.style.background = "#ff224e";
          }

          const boom = createPart({
            left: "50%",
            top: "10%",
            width: "34%",
            height: "20%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "clamp(22px, 2vw, 28px)",
            fontWeight: "900",
            color: "#ff5b1f",
            textShadow: "0 2px 6px rgba(0,0,0,0.18)",
            zIndex: "5"
          });
          boom.textContent = "💥";
          snake.el.appendChild(boom);

          snake.cleanupTimer = setTimeout(() => {
            removeSnake(snake);
          }, 120);
        };

        snakeEl.addEventListener("pointerdown", hitSnake);
        snakeEl.addEventListener("click", (event) => {
          event.preventDefault();
        });

        snake.timeoutId = setTimeout(() => {
          if (!running || snake.hit) {
            removeSnake(snake);
            return;
          }

          snake.el.style.pointerEvents = "none";
          snake.el.style.transform = "translate(-50%, 92%) scale(0.92)";
          snake.el.style.opacity = "0.42";

          snake.cleanupTimer = setTimeout(() => {
            removeSnake(snake);
          }, 170);
        }, snake.lifeMs);
      }

      function updateSnakes() {
        const now = Date.now();
        for (let i = activeSnakes.length - 1; i >= 0; i -= 1) {
          const snake = activeSnakes[i];
          if (!snake.hit && now - snake.bornAt >= snake.lifeMs + 260) {
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
          createAllHoles();
          playerEl.style.display = "none";
          score = 0;
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

          while (activeSnakes.length > 0) {
            removeSnake(activeSnakes[0]);
          }

          clearHoles();
        },

        getScore() {
          return score;
        }
      };
    }
  };
});