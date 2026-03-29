//js/mini-games/game8.js
window.MiniGameShared.register("game8", (config = {}) => {
  const duration = Number(config.duration) || 12;
  const bonusPerCatch = Number(config.bonusPerCatch) || 1;

  return {
    id: "game8",
    title: "ปิดคอก",
    description: `คลิกวัวที่กำลังวิ่งออกจากคอกให้ทันภายใน ${duration} วินาที`,
    overlayTitle: "มินิเกม: ปิดคอก",
    overlayDescription:
      "วัวจะวิ่งออกจากคอกตรงกลางจอ ให้รีบคลิกที่วัวให้ทัน แต่ละตัวที่คลิกโดนจะได้ 1 คะแนน",
    themeClass: "theme-field",
    duration,

    finishText(score) {
      return `หมดเวลา! คุณหยุดวัวได้ทั้งหมด ${score} ตัว`;
    },

    finishPopupMessage(score) {
      if (score >= 12) return "ไวมาก! ปิดคอกได้ดีสุด ๆ";
      if (score >= 6) return "ดีมาก! หยุดวัวได้หลายตัวเลย";
      if (score > 0) return "ได้อยู่! ถ้าไวขึ้นอีกนิดจะได้มากกว่านี้";
      return "วัวหนีหมดเลย ลองใหม่นะ";
    },

    createController(context) {
      const { areaEl, playerEl, setScore, clearAreaInlineStyles } = context;

      let score = 0;
      let running = false;
      let animationId = null;
      let spawnInterval = null;
      const cows = [];

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
          "linear-gradient(180deg, #dff4ff 0%, #d7f4c4 48%, #7ecb61 100%)";
        areaEl.style.border = "3px solid rgba(129, 186, 99, 0.30)";
      }

      function createPen() {
        const pen = document.createElement("div");
        pen.textContent = "คอก";
        pen.style.position = "absolute";
        pen.style.left = "50%";
        pen.style.top = "50%";
        pen.style.transform = "translate(-50%, -50%)";
        pen.style.width = "120px";
        pen.style.height = "92px";
        pen.style.border = "4px solid #8b5a2b";
        pen.style.borderRadius = "16px";
        pen.style.background = "rgba(255, 240, 210, 0.55)";
        pen.style.display = "flex";
        pen.style.alignItems = "center";
        pen.style.justifyContent = "center";
        pen.style.fontWeight = "700";
        pen.style.color = "#6d431d";
        pen.style.zIndex = "1";
        areaEl.appendChild(pen);
        return pen;
      }

      function removeCow(cow) {
        const idx = cows.indexOf(cow);
        if (idx >= 0) cows.splice(idx, 1);
        if (cow.el && cow.el.parentNode) {
          cow.el.parentNode.removeChild(cow.el);
        }
      }

      function spawnCow() {
        if (!running) return;

        const area = getAreaSize();
        const centerX = area.width / 2;
        const centerY = area.height / 2;

        const angle = Math.random() * Math.PI * 2;
        const speed = 1.8 + Math.random() * 1.6;

        const el = document.createElement("button");
        el.type = "button";
        el.textContent = "🐄";
        el.style.position = "absolute";
        el.style.left = `${centerX - 24}px`;
        el.style.top = `${centerY - 24}px`;
        el.style.width = "52px";
        el.style.height = "52px";
        el.style.border = "none";
        el.style.borderRadius = "50%";
        el.style.background = "rgba(255,255,255,0.88)";
        el.style.fontSize = "28px";
        el.style.cursor = "pointer";
        el.style.boxShadow = "0 10px 18px rgba(0,0,0,0.16)";
        el.style.userSelect = "none";
        el.style.zIndex = "3";
        el.style.touchAction = "manipulation";

        const cow = {
          el,
          x: centerX - 24,
          y: centerY - 24,
          size: 52,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          caught: false
        };

        function handleCatch(event) {
          if (event) {
            event.preventDefault();
            event.stopPropagation();
          }

          if (!running || cow.caught) return;

          cow.caught = true;
          score += bonusPerCatch;
          setScore(score);
          el.style.transform = "scale(0.75)";
          el.style.opacity = "0.6";
          el.style.pointerEvents = "none";

          setTimeout(() => removeCow(cow), 90);
        }

        el.addEventListener("click", handleCatch);
        el.addEventListener(
          "touchstart",
          (event) => {
            handleCatch(event);
          },
          { passive: false }
        );

        areaEl.appendChild(el);
        cows.push(cow);
      }

      function updateCows() {
        const area = getAreaSize();

        for (let i = cows.length - 1; i >= 0; i -= 1) {
          const cow = cows[i];
          cow.x += cow.vx;
          cow.y += cow.vy;

          cow.el.style.left = `${cow.x}px`;
          cow.el.style.top = `${cow.y}px`;

          const out =
            cow.x < -cow.size ||
            cow.y < -cow.size ||
            cow.x > area.width + cow.size ||
            cow.y > area.height + cow.size;

          if (out) {
            removeCow(cow);
          }
        }
      }

      function loop() {
        if (!running) return;
        updateCows();
        animationId = requestAnimationFrame(loop);
      }

      let penEl = null;

      return {
        setup() {
          applyAreaStyle();
          playerEl.style.display = "none";
          setScore(0);
          penEl = createPen();
        },

        start() {
          running = true;
          spawnCow();
          spawnInterval = setInterval(spawnCow, 520);
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

          while (cows.length > 0) {
            removeCow(cows[0]);
          }

          if (penEl && penEl.parentNode) {
            penEl.parentNode.removeChild(penEl);
          }
          penEl = null;
        },

        getScore() {
          return score;
        }
      };
    }
  };
});