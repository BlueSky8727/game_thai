//js/mini-games/game9.js
window.MiniGameShared.register("game9", (config = {}) => {
  const duration = Number(config.duration) || 12;
  const bonusPerCatch = Number(config.bonusPerCatch) || 1;

  return {
    id: "game9",
    title: "คลิกตามคำสั่ง",
    description: `คลิกให้ตรงตามคำสั่งภายใน ${duration} วินาที`,
    overlayTitle: "มินิเกม: คลิกตามคำสั่ง",
    overlayDescription:
      "เกมจะสั่งว่าให้คลิกนกหรือคลิกต้นไม้ ผู้เล่นต้องคลิกตามคำสั่งให้ถูกต้องถึงจะได้คะแนน",
    themeClass: "theme-command",
    duration,

    finishText(score) {
      return `หมดเวลา! คุณทำตามคำสั่งถูกทั้งหมด ${score} ครั้ง`;
    },

    finishPopupMessage(score) {
      if (score >= 10) return "ยอดเยี่ยม! เชื่อฟังคำสั่งได้แม่นมาก";
      if (score >= 5) return "ดีมาก! กดได้ถูกหลายครั้งเลย";
      if (score > 0) return "โอเคเลย! ยังมีพลาดบ้างนิดหน่อย";
      return "ยังไม่ทันคำสั่ง ลองใหม่อีกครั้งนะ";
    },

    createController(context) {
      const { areaEl, playerEl, setScore, clearAreaInlineStyles } = context;

      let score = 0;
      let running = false;
      let commandTimer = null;
      let currentTarget = "bird";

      let instructionEl = null;
      let leftBox = null;
      let rightBox = null;

      function applyAreaStyle() {
        clearAreaInlineStyles();
        areaEl.style.position = "relative";
        areaEl.style.overflow = "hidden";
        areaEl.style.background =
          "linear-gradient(180deg, #eef6ff 0%, #dbefff 44%, #cfe9c8 100%)";
        areaEl.style.border = "3px solid rgba(115, 155, 224, 0.28)";
      }

      function makeBox(labelEmoji, caption, side) {
        const box = document.createElement("button");
        box.type = "button";
        box.style.position = "absolute";
        box.style.top = "50%";
        box.style.transform = "translateY(-50%)";
        box.style[side] = "42px";
        box.style.width = "190px";
        box.style.height = "170px";
        box.style.border = "3px solid rgba(78, 124, 182, 0.22)";
        box.style.borderRadius = "24px";
        box.style.background = "rgba(255,255,255,0.88)";
        box.style.boxShadow = "0 14px 30px rgba(0,0,0,0.12)";
        box.style.cursor = "pointer";
        box.style.display = "flex";
        box.style.flexDirection = "column";
        box.style.alignItems = "center";
        box.style.justifyContent = "center";
        box.style.gap = "10px";
        box.style.userSelect = "none";
        box.style.zIndex = "3";

        const emoji = document.createElement("div");
        emoji.textContent = labelEmoji;
        emoji.style.fontSize = "56px";
        emoji.style.lineHeight = "1";

        const text = document.createElement("div");
        text.textContent = caption;
        text.style.fontSize = "18px";
        text.style.fontWeight = "700";
        text.style.color = "#20456c";

        box.appendChild(emoji);
        box.appendChild(text);
        areaEl.appendChild(box);
        return box;
      }

      function updateCommand() {
        currentTarget = Math.random() > 0.5 ? "bird" : "tree";
        instructionEl.textContent =
          currentTarget === "bird" ? "คำสั่ง: คลิกนก" : "คำสั่ง: คลิกต้นไม้";

        instructionEl.style.background =
          currentTarget === "bird"
            ? "linear-gradient(135deg, #e6f1ff 0%, #d6ebff 100%)"
            : "linear-gradient(135deg, #effbe8 0%, #def5d0 100%)";
      }

      function highlightResult(target, correct) {
        if (!target) return;
        target.style.transform = "translateY(-50%) scale(0.96)";
        target.style.opacity = correct ? "0.92" : "0.78";

        setTimeout(() => {
          if (!target) return;
          target.style.transform = "translateY(-50%)";
          target.style.opacity = "1";
        }, 120);
      }

      function handleChoose(choice) {
        if (!running) return;
        const correct = choice === currentTarget;

        if (correct) {
          score += bonusPerCatch;
          setScore(score);
        }

        highlightResult(choice === "bird" ? leftBox : rightBox, correct);
        updateCommand();
      }

      return {
        setup() {
          applyAreaStyle();
          playerEl.style.display = "none";
          setScore(0);

          instructionEl = document.createElement("div");
          instructionEl.style.position = "absolute";
          instructionEl.style.left = "50%";
          instructionEl.style.top = "28px";
          instructionEl.style.transform = "translateX(-50%)";
          instructionEl.style.padding = "12px 22px";
          instructionEl.style.borderRadius = "999px";
          instructionEl.style.fontWeight = "800";
          instructionEl.style.fontSize = "20px";
          instructionEl.style.color = "#1a426c";
          instructionEl.style.boxShadow = "0 10px 24px rgba(0,0,0,0.10)";
          instructionEl.style.zIndex = "4";
          areaEl.appendChild(instructionEl);

          leftBox = makeBox("🐦", "นก", "left");
          rightBox = makeBox("🌳", "ต้นไม้", "right");

          leftBox.addEventListener("click", () => handleChoose("bird"));
          rightBox.addEventListener("click", () => handleChoose("tree"));

          updateCommand();
        },

        start() {
          running = true;
          commandTimer = setInterval(updateCommand, 1400);
        },

        stop() {
          running = false;

          if (commandTimer) {
            clearInterval(commandTimer);
            commandTimer = null;
          }

          [instructionEl, leftBox, rightBox].forEach((el) => {
            if (el && el.parentNode) {
              el.parentNode.removeChild(el);
            }
          });

          instructionEl = null;
          leftBox = null;
          rightBox = null;
        },

        getScore() {
          return score;
        }
      };
    }
  };
});