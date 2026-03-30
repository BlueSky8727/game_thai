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
      if (score >= 16) return "สุดยอดมาก! ทั้งไวทั้งแม่น อ่านคำสั่งได้คมสุด ๆ";
      if (score >= 10) return "ยอดเยี่ยม! โฟกัสดีมาก กดแทบไม่พลาดเลย";
      if (score >= 6) return "ดีมาก! เริ่มจับจังหวะเกมได้แล้ว";
      if (score > 0) return "โอเคเลย! ยังพลาดบ้าง แต่ไปได้ดี";
      return "ยังไม่ทันคำสั่ง ลองใหม่อีกครั้งนะ";
    },

    createController(context) {
      const { areaEl, playerEl, setScore, clearAreaInlineStyles } = context;

      let score = 0;
      let running = false;
      let commandTimer = null;
      let roundTimeout = null;
      let currentTarget = "bird";
      let currentLayout = "bird-left";
      let currentInterval = 1300;
      let streak = 0;

      let instructionEl = null;
      let subInstructionEl = null;
      let feedbackEl = null;
      let leftBox = null;
      let rightBox = null;
      let cloudLeftEl = null;
      let cloudRightEl = null;
      let hillEl = null;
      let statsEl = null;
      let streakEl = null;

      const deceptiveBirdTexts = ["คลิกนก", "คลิกเจ้านก", "คลิกนกตัวนี้"];
      const deceptiveTreeTexts = ["คลิกต้นไม้", "คลิกต้นไผ่", "คลิกพุ่มไม้"];

      function applyAreaStyle() {
        clearAreaInlineStyles();
        areaEl.style.position = "relative";
        areaEl.style.overflow = "hidden";
        areaEl.style.background =
          "linear-gradient(180deg, #edf6ff 0%, #dceeff 42%, #d8f0d4 70%, #c6e7b8 100%)";
        areaEl.style.border = "3px solid rgba(140, 181, 228, 0.34)";
        areaEl.style.borderRadius = "28px";
        areaEl.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.7)";
      }

      function createScene() {
        cloudLeftEl = document.createElement("div");
        cloudLeftEl.style.position = "absolute";
        cloudLeftEl.style.left = "70px";
        cloudLeftEl.style.top = "44px";
        cloudLeftEl.style.width = "90px";
        cloudLeftEl.style.height = "34px";
        cloudLeftEl.style.borderRadius = "999px";
        cloudLeftEl.style.background = "rgba(255,255,255,0.72)";
        cloudLeftEl.style.filter = "blur(1px)";
        cloudLeftEl.style.boxShadow = "28px -8px 0 8px rgba(255,255,255,0.72), 54px 2px 0 0 rgba(255,255,255,0.65)";
        cloudLeftEl.style.zIndex = "1";
        areaEl.appendChild(cloudLeftEl);

        cloudRightEl = document.createElement("div");
        cloudRightEl.style.position = "absolute";
        cloudRightEl.style.right = "96px";
        cloudRightEl.style.top = "78px";
        cloudRightEl.style.width = "84px";
        cloudRightEl.style.height = "30px";
        cloudRightEl.style.borderRadius = "999px";
        cloudRightEl.style.background = "rgba(255,255,255,0.68)";
        cloudRightEl.style.filter = "blur(1px)";
        cloudRightEl.style.boxShadow = "22px -6px 0 6px rgba(255,255,255,0.68), 46px 2px 0 0 rgba(255,255,255,0.58)";
        cloudRightEl.style.zIndex = "1";
        areaEl.appendChild(cloudRightEl);

        hillEl = document.createElement("div");
        hillEl.style.position = "absolute";
        hillEl.style.left = "-4%";
        hillEl.style.right = "-4%";
        hillEl.style.bottom = "-34px";
        hillEl.style.height = "170px";
        hillEl.style.borderRadius = "50% 50% 0 0 / 100% 100% 0 0";
        hillEl.style.background =
          "linear-gradient(180deg, rgba(166,214,147,0.28) 0%, rgba(135,191,111,0.54) 100%)";
        hillEl.style.zIndex = "1";
        areaEl.appendChild(hillEl);
      }

      function createBadge(text) {
        const badge = document.createElement("div");
        badge.textContent = text;
        badge.style.padding = "10px 16px";
        badge.style.borderRadius = "999px";
        badge.style.fontWeight = "800";
        badge.style.fontSize = "15px";
        badge.style.color = "#1d4a70";
        badge.style.background = "rgba(255,255,255,0.82)";
        badge.style.boxShadow = "0 10px 24px rgba(0,0,0,0.08)";
        badge.style.backdropFilter = "blur(6px)";
        return badge;
      }

      function makeBox(type, side) {
        const box = document.createElement("button");
        box.type = "button";
        box.dataset.type = type;
        box.style.position = "absolute";
        box.style.top = "50%";
        box.style.transform = "translateY(-50%)";
        box.style[side] = "48px";
        box.style.width = "220px";
        box.style.height = "210px";
        box.style.border = "3px solid rgba(123, 164, 212, 0.18)";
        box.style.borderRadius = "30px";
        box.style.background =
          "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(245,250,255,0.96) 100%)";
        box.style.boxShadow =
          "0 18px 36px rgba(57, 95, 145, 0.14), inset 0 1px 0 rgba(255,255,255,0.92)";
        box.style.cursor = "pointer";
        box.style.display = "flex";
        box.style.flexDirection = "column";
        box.style.alignItems = "center";
        box.style.justifyContent = "center";
        box.style.gap = "12px";
        box.style.userSelect = "none";
        box.style.zIndex = "3";
        box.style.transition =
          "transform 0.14s ease, box-shadow 0.14s ease, border-color 0.14s ease, background 0.14s ease";

        box.addEventListener("mouseenter", () => {
          if (!running) return;
          box.style.transform = "translateY(-50%) scale(1.03)";
          box.style.boxShadow =
            "0 24px 42px rgba(57, 95, 145, 0.18), inset 0 1px 0 rgba(255,255,255,0.92)";
          box.style.borderColor = "rgba(90, 145, 219, 0.30)";
        });

        box.addEventListener("mouseleave", () => {
          box.style.transform = "translateY(-50%) scale(1)";
          box.style.boxShadow =
            "0 18px 36px rgba(57, 95, 145, 0.14), inset 0 1px 0 rgba(255,255,255,0.92)";
          box.style.borderColor = "rgba(123, 164, 212, 0.18)";
        });

        const emoji = document.createElement("div");
        emoji.style.fontSize = "72px";
        emoji.style.lineHeight = "1";
        emoji.textContent = type === "bird" ? "🐦" : "🌳";

        const text = document.createElement("div");
        text.style.fontSize = "18px";
        text.style.fontWeight = "800";
        text.style.color = "#20456c";
        text.textContent = type === "bird" ? "นก" : "ต้นไม้";

        const hint = document.createElement("div");
        hint.style.fontSize = "13px";
        hint.style.fontWeight = "700";
        hint.style.color = "rgba(32,69,108,0.64)";
        hint.textContent = type === "bird" ? "แตะให้ตรงคำสั่ง" : "อ่านคำสั่งดี ๆ";

        box.appendChild(emoji);
        box.appendChild(text);
        box.appendChild(hint);

        box._emojiEl = emoji;
        box._textEl = text;
        box._hintEl = hint;

        areaEl.appendChild(box);
        return box;
      }

      function updateStats() {
        if (statsEl) {
          statsEl.textContent = `คะแนน ${score}`;
        }
        if (streakEl) {
          streakEl.textContent = `คอมโบ ${streak}`;
        }
      }

      function randomFrom(list) {
        return list[Math.floor(Math.random() * list.length)];
      }

      function setInstructionText() {
        let mainText = "";
        const trickyMode = Math.random() < 0.35;

        if (currentTarget === "bird") {
          mainText = trickyMode ? randomFrom(deceptiveBirdTexts) : "คำสั่ง: คลิกนก";
          instructionEl.style.background =
            "linear-gradient(135deg, #e8f3ff 0%, #d9ecff 100%)";
          subInstructionEl.textContent = "ดูคำสั่งให้ชัด แล้วกดให้ตรง";
        } else {
          mainText = trickyMode ? randomFrom(deceptiveTreeTexts) : "คำสั่ง: คลิกต้นไม้";
          instructionEl.style.background =
            "linear-gradient(135deg, #effbe8 0%, #def5d0 100%)";
          subInstructionEl.textContent = "อย่ากดตามความเคยชิน อ่านก่อนทุกครั้ง";
        }

        instructionEl.textContent = mainText;
      }

      function applyLayout() {
        if (!leftBox || !rightBox) return;

        const birdIsLeft = currentLayout === "bird-left";

        leftBox.dataset.type = birdIsLeft ? "bird" : "tree";
        rightBox.dataset.type = birdIsLeft ? "tree" : "bird";

        leftBox._emojiEl.textContent = birdIsLeft ? "🐦" : "🌳";
        leftBox._textEl.textContent = birdIsLeft ? "นก" : "ต้นไม้";
        leftBox._hintEl.textContent = birdIsLeft ? "แตะให้ตรงคำสั่ง" : "อ่านคำสั่งดี ๆ";

        rightBox._emojiEl.textContent = birdIsLeft ? "🌳" : "🐦";
        rightBox._textEl.textContent = birdIsLeft ? "ต้นไม้" : "นก";
        rightBox._hintEl.textContent = birdIsLeft ? "อ่านคำสั่งดี ๆ" : "แตะให้ตรงคำสั่ง";
      }

      function showFeedback(text, isCorrect) {
        if (!feedbackEl) return;

        feedbackEl.textContent = text;
        feedbackEl.style.opacity = "1";
        feedbackEl.style.transform = "translateX(-50%) translateY(0) scale(1)";
        feedbackEl.style.background = isCorrect
          ? "linear-gradient(135deg, #dff9d7 0%, #c8efbd 100%)"
          : "linear-gradient(135deg, #ffe2e2 0%, #ffcaca 100%)";
        feedbackEl.style.color = isCorrect ? "#245b1f" : "#8a2020";

        clearTimeout(feedbackEl._hideTimer);
        feedbackEl._hideTimer = setTimeout(() => {
          if (!feedbackEl) return;
          feedbackEl.style.opacity = "0";
          feedbackEl.style.transform = "translateX(-50%) translateY(-10px) scale(0.96)";
        }, 520);
      }

      function pulseBox(target, isCorrect) {
        if (!target) return;

        target.style.transform = "translateY(-50%) scale(0.94)";
        target.style.background = isCorrect
          ? "linear-gradient(180deg, rgba(239,255,237,0.98) 0%, rgba(217,249,210,0.98) 100%)"
          : "linear-gradient(180deg, rgba(255,244,244,0.98) 0%, rgba(255,221,221,0.98) 100%)";
        target.style.borderColor = isCorrect
          ? "rgba(85, 182, 78, 0.38)"
          : "rgba(220, 92, 92, 0.40)";

        setTimeout(() => {
          if (!target) return;
          target.style.transform = "translateY(-50%) scale(1)";
          target.style.background =
            "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(245,250,255,0.96) 100%)";
          target.style.borderColor = "rgba(123, 164, 212, 0.18)";
        }, 140);
      }

      function updateDifficulty() {
        const next = Math.max(720, 1300 - score * 35);
        currentInterval = next;

        if (commandTimer) {
          clearInterval(commandTimer);
          commandTimer = setInterval(nextRound, currentInterval);
        }
      }

      function nextRound() {
        if (!running) return;
        currentTarget = Math.random() > 0.5 ? "bird" : "tree";
        currentLayout = Math.random() > 0.5 ? "bird-left" : "tree-left";
        applyLayout();
        setInstructionText();
      }

      function resolveChoice(clickedType, clickedBox) {
        if (!running) return;

        const correct = clickedType === currentTarget;

        if (correct) {
          streak += 1;
          score += bonusPerCatch + (streak >= 3 ? 1 : 0);
          setScore(score);
          updateStats();
          pulseBox(clickedBox, true);

          if (streak >= 3) {
            showFeedback(`ถูกต้อง! คอมโบ x${streak}`, true);
          } else {
            showFeedback("ถูกต้อง!", true);
          }

          updateDifficulty();
        } else {
          streak = 0;
          updateStats();
          pulseBox(clickedBox, false);
          showFeedback("ผิดคำสั่ง!", false);
        }

        nextRound();
      }

      return {
        setup() {
          applyAreaStyle();
          playerEl.style.display = "none";
          setScore(0);
          score = 0;
          streak = 0;
          currentInterval = 1300;

          createScene();

          instructionEl = document.createElement("div");
          instructionEl.style.position = "absolute";
          instructionEl.style.left = "50%";
          instructionEl.style.top = "26px";
          instructionEl.style.transform = "translateX(-50%)";
          instructionEl.style.padding = "14px 26px";
          instructionEl.style.borderRadius = "999px";
          instructionEl.style.fontWeight = "900";
          instructionEl.style.fontSize = "22px";
          instructionEl.style.color = "#1a426c";
          instructionEl.style.boxShadow = "0 14px 28px rgba(0,0,0,0.10)";
          instructionEl.style.zIndex = "5";
          instructionEl.style.minWidth = "280px";
          instructionEl.style.textAlign = "center";
          areaEl.appendChild(instructionEl);

          subInstructionEl = document.createElement("div");
          subInstructionEl.style.position = "absolute";
          subInstructionEl.style.left = "50%";
          subInstructionEl.style.top = "88px";
          subInstructionEl.style.transform = "translateX(-50%)";
          subInstructionEl.style.padding = "8px 16px";
          subInstructionEl.style.borderRadius = "999px";
          subInstructionEl.style.fontWeight = "700";
          subInstructionEl.style.fontSize = "14px";
          subInstructionEl.style.color = "rgba(26,66,108,0.78)";
          subInstructionEl.style.background = "rgba(255,255,255,0.72)";
          subInstructionEl.style.boxShadow = "0 10px 20px rgba(0,0,0,0.06)";
          subInstructionEl.style.zIndex = "5";
          areaEl.appendChild(subInstructionEl);

          feedbackEl = document.createElement("div");
          feedbackEl.style.position = "absolute";
          feedbackEl.style.left = "50%";
          feedbackEl.style.top = "128px";
          feedbackEl.style.transform = "translateX(-50%) translateY(-10px) scale(0.96)";
          feedbackEl.style.padding = "10px 18px";
          feedbackEl.style.borderRadius = "999px";
          feedbackEl.style.fontWeight = "900";
          feedbackEl.style.fontSize = "15px";
          feedbackEl.style.boxShadow = "0 12px 22px rgba(0,0,0,0.08)";
          feedbackEl.style.zIndex = "5";
          feedbackEl.style.opacity = "0";
          feedbackEl.style.transition = "all 0.16s ease";
          areaEl.appendChild(feedbackEl);

          statsEl = createBadge("คะแนน 0");
          statsEl.style.position = "absolute";
          statsEl.style.left = "28px";
          statsEl.style.top = "24px";
          statsEl.style.zIndex = "5";
          areaEl.appendChild(statsEl);

          streakEl = createBadge("คอมโบ 0");
          streakEl.style.position = "absolute";
          streakEl.style.right = "28px";
          streakEl.style.top = "24px";
          streakEl.style.zIndex = "5";
          areaEl.appendChild(streakEl);

          leftBox = makeBox("bird", "left");
          rightBox = makeBox("tree", "right");

          leftBox.addEventListener("click", () => {
            resolveChoice(leftBox.dataset.type, leftBox);
          });

          rightBox.addEventListener("click", () => {
            resolveChoice(rightBox.dataset.type, rightBox);
          });

          updateStats();
          nextRound();
        },

        start() {
          running = true;
          commandTimer = setInterval(nextRound, currentInterval);
        },

        stop() {
          running = false;

          if (commandTimer) {
            clearInterval(commandTimer);
            commandTimer = null;
          }

          if (roundTimeout) {
            clearTimeout(roundTimeout);
            roundTimeout = null;
          }

          if (feedbackEl && feedbackEl._hideTimer) {
            clearTimeout(feedbackEl._hideTimer);
          }

          [
            instructionEl,
            subInstructionEl,
            feedbackEl,
            leftBox,
            rightBox,
            cloudLeftEl,
            cloudRightEl,
            hillEl,
            statsEl,
            streakEl
          ].forEach((el) => {
            if (el && el.parentNode) {
              el.parentNode.removeChild(el);
            }
          });

          instructionEl = null;
          subInstructionEl = null;
          feedbackEl = null;
          leftBox = null;
          rightBox = null;
          cloudLeftEl = null;
          cloudRightEl = null;
          hillEl = null;
          statsEl = null;
          streakEl = null;
        },

        getScore() {
          return score;
        }
      };
    }
  };
});