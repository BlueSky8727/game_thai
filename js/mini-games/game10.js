//js/mini-games/game10.js
window.MiniGameShared.register("game10", (config = {}) => {
  const duration = Number(config.duration) || 12;
  const winScore = Number(config.bonusPerCatch) || 10;

  return {
    id: "game10",
    title: "เดินตีพร้า",
    description: `เดินไปให้ถึงเส้นชัย โดยต้องรอจังหวะให้ถูกภายใน ${duration} วินาที`,
    overlayTitle: "มินิเกม: เดินตีพร้า",
    overlayDescription:
      "เมื่อขึ้นคำว่า เดิน ให้ขยับไปข้างหน้าได้ แต่เมื่อโกโกวาหันมาพร้อมคำว่า หยุด ต้องหยุดทันที ถ้าขยับตอนหยุด เกมจบทันที",
    themeClass: "theme-smith",
    duration,

    finishText(score) {
      if (score >= winScore) {
        return `สำเร็จ! คุณเดินถึงเส้นชัยได้ทัน ได้ ${score} คะแนน`;
      }
      return "พลาด! ขยับผิดจังหวะ เกมจบ";
    },

    finishPopupMessage(score) {
      if (score >= winScore) {
        return "เยี่ยมมาก! คุมจังหวะได้ดีและไปถึงเส้นชัยสำเร็จ";
      }
      return "โกโกวาหันมาเห็นตอนขยับพอดี ลองใหม่แบบคุมจังหวะให้ดีกว่านี้นะ";
    },

    createController(context) {
      const {
        areaEl,
        playerEl,
        utils,
        setScore,
        setResultText,
        finishNow,
        clearAreaInlineStyles
      } = context;
      const { clamp } = utils;

      const keys = {
        left: false,
        right: false
      };

      let running = false;
      let animationId = null;
      let phaseTimer = null;
      let phaseTimeout = null;
      let signal = "go";
      let finished = false;
      let score = 0;
      let blinkInterval = null;
      let playerFigureBuilt = false;

      const state = {
        width: 0,
        height: 0,
        player: {
          x: 36,
          y: 0,
          size: 64,
          speed: 2.15,
          bob: 0,
          direction: "right",
          walkPhase: 0
        },
        goalX: 0
      };

      let skyGlowEl = null;
      let sunEl = null;
      let hillBackEl = null;
      let hillFrontEl = null;
      let trackEl = null;
      let laneStripeEl = null;
      let groundEl = null;
      let finishLineEl = null;
      let finishPoleTopEl = null;
      let finishPoleBottomEl = null;
      let finishFlagEl = null;

      let signalEl = null;
      let warningEl = null;

      let dollWrapEl = null;
      let dollFaceEl = null;
      let dollGunEl = null;
      let dollBaseEl = null;

      let playerFigureEl = null;
      let playerHeadEl = null;
      let playerBodyEl = null;
      let playerArmLeftEl = null;
      let playerArmRightEl = null;
      let playerLegLeftEl = null;
      let playerLegRightEl = null;

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
          "linear-gradient(180deg, #fff7ec 0%, #fde9c7 34%, #f6d491 68%, #d49a4d 100%)";
        areaEl.style.border = "4px solid rgba(188, 127, 49, 0.40)";
        areaEl.style.borderRadius = "34px";
        areaEl.style.boxShadow =
          "inset 0 2px 0 rgba(255,255,255,0.65), 0 8px 24px rgba(112, 73, 21, 0.08)";
      }

      function createScene() {
        skyGlowEl = document.createElement("div");
        skyGlowEl.style.position = "absolute";
        skyGlowEl.style.left = "50%";
        skyGlowEl.style.top = "-80px";
        skyGlowEl.style.transform = "translateX(-50%)";
        skyGlowEl.style.width = "60%";
        skyGlowEl.style.height = "220px";
        skyGlowEl.style.borderRadius = "50%";
        skyGlowEl.style.background =
          "radial-gradient(circle, rgba(255,248,216,0.68) 0%, rgba(255,248,216,0.12) 55%, rgba(255,248,216,0) 78%)";
        skyGlowEl.style.pointerEvents = "none";
        skyGlowEl.style.zIndex = "0";
        areaEl.appendChild(skyGlowEl);

        sunEl = document.createElement("div");
        sunEl.style.position = "absolute";
        sunEl.style.top = "30px";
        sunEl.style.left = "72px";
        sunEl.style.width = "56px";
        sunEl.style.height = "56px";
        sunEl.style.borderRadius = "50%";
        sunEl.style.background = "radial-gradient(circle, #fff7b8 0%, #ffd467 72%, #ffbf45 100%)";
        sunEl.style.boxShadow = "0 0 34px rgba(255, 208, 102, 0.65)";
        sunEl.style.zIndex = "1";
        areaEl.appendChild(sunEl);

        hillBackEl = document.createElement("div");
        hillBackEl.style.position = "absolute";
        hillBackEl.style.left = "-6%";
        hillBackEl.style.right = "-6%";
        hillBackEl.style.bottom = "118px";
        hillBackEl.style.height = "120px";
        hillBackEl.style.borderRadius = "50% 50% 0 0 / 100% 100% 0 0";
        hillBackEl.style.background =
          "linear-gradient(180deg, rgba(209, 184, 109, 0.42) 0%, rgba(194, 148, 78, 0.62) 100%)";
        hillBackEl.style.zIndex = "1";
        areaEl.appendChild(hillBackEl);

        hillFrontEl = document.createElement("div");
        hillFrontEl.style.position = "absolute";
        hillFrontEl.style.left = "-8%";
        hillFrontEl.style.right = "-8%";
        hillFrontEl.style.bottom = "70px";
        hillFrontEl.style.height = "138px";
        hillFrontEl.style.borderRadius = "50% 50% 0 0 / 100% 100% 0 0";
        hillFrontEl.style.background =
          "linear-gradient(180deg, rgba(225, 192, 118, 0.55) 0%, rgba(214, 163, 85, 0.82) 100%)";
        hillFrontEl.style.zIndex = "1";
        areaEl.appendChild(hillFrontEl);

        trackEl = document.createElement("div");
        trackEl.style.position = "absolute";
        trackEl.style.left = "0";
        trackEl.style.right = "0";
        trackEl.style.bottom = "0";
        trackEl.style.height = "116px";
        trackEl.style.background =
          "linear-gradient(180deg, #c9934b 0%, #bc843e 54%, #ad7332 100%)";
        trackEl.style.borderTop = "4px solid rgba(120, 75, 24, 0.20)";
        trackEl.style.zIndex = "2";
        areaEl.appendChild(trackEl);

        laneStripeEl = document.createElement("div");
        laneStripeEl.style.position = "absolute";
        laneStripeEl.style.left = "0";
        laneStripeEl.style.right = "0";
        laneStripeEl.style.bottom = "108px";
        laneStripeEl.style.height = "14px";
        laneStripeEl.style.background =
          "repeating-linear-gradient(90deg, rgba(145,97,39,0.82) 0 22px, rgba(218,182,131,0.92) 22px 42px)";
        laneStripeEl.style.zIndex = "3";
        areaEl.appendChild(laneStripeEl);

        groundEl = document.createElement("div");
        groundEl.style.position = "absolute";
        groundEl.style.left = "0";
        groundEl.style.right = "0";
        groundEl.style.bottom = "116px";
        groundEl.style.height = "182px";
        groundEl.style.background =
          "linear-gradient(180deg, rgba(249, 231, 188, 0.18) 0%, rgba(236, 198, 123, 0.40) 100%)";
        groundEl.style.zIndex = "2";
        areaEl.appendChild(groundEl);

        finishLineEl = document.createElement("div");
        finishLineEl.style.position = "absolute";
        finishLineEl.style.right = "90px";
        finishLineEl.style.bottom = "116px";
        finishLineEl.style.width = "56px";
        finishLineEl.style.height = "160px";
        finishLineEl.style.zIndex = "5";
        finishLineEl.style.pointerEvents = "none";

        finishPoleTopEl = document.createElement("div");
        finishPoleTopEl.style.position = "absolute";
        finishPoleTopEl.style.left = "8px";
        finishPoleTopEl.style.bottom = "0";
        finishPoleTopEl.style.width = "8px";
        finishPoleTopEl.style.height = "160px";
        finishPoleTopEl.style.borderRadius = "999px";
        finishPoleTopEl.style.background =
          "linear-gradient(180deg, #fff6db 0%, #d9c19d 100%)";
        finishPoleTopEl.style.boxShadow = "0 0 0 1px rgba(91, 62, 18, 0.08) inset";

        finishPoleBottomEl = document.createElement("div");
        finishPoleBottomEl.style.position = "absolute";
        finishPoleBottomEl.style.right = "8px";
        finishPoleBottomEl.style.bottom = "0";
        finishPoleBottomEl.style.width = "8px";
        finishPoleBottomEl.style.height = "160px";
        finishPoleBottomEl.style.borderRadius = "999px";
        finishPoleBottomEl.style.background =
          "linear-gradient(180deg, #fff6db 0%, #d9c19d 100%)";
        finishPoleBottomEl.style.boxShadow = "0 0 0 1px rgba(91, 62, 18, 0.08) inset";

        finishFlagEl = document.createElement("div");
        finishFlagEl.style.position = "absolute";
        finishFlagEl.style.left = "4px";
        finishFlagEl.style.top = "18px";
        finishFlagEl.style.width = "48px";
        finishFlagEl.style.height = "84px";
        finishFlagEl.style.borderRadius = "12px";
        finishFlagEl.style.overflow = "hidden";
        finishFlagEl.style.boxShadow = "0 10px 18px rgba(0,0,0,0.12)";
        finishFlagEl.style.background =
          "conic-gradient(from 90deg, #ffffff 0 25%, #111111 25% 50%, #ffffff 50% 75%, #111111 75% 100%)";
        finishFlagEl.style.backgroundSize = "20px 20px";

        finishLineEl.appendChild(finishPoleTopEl);
        finishLineEl.appendChild(finishPoleBottomEl);
        finishLineEl.appendChild(finishFlagEl);
        areaEl.appendChild(finishLineEl);
      }

      function createDoll() {
        dollWrapEl = document.createElement("div");
        dollWrapEl.style.position = "absolute";
        dollWrapEl.style.top = "22px";
        dollWrapEl.style.left = "50%";
        dollWrapEl.style.transform = "translateX(-50%)";
        dollWrapEl.style.display = "flex";
        dollWrapEl.style.flexDirection = "column";
        dollWrapEl.style.alignItems = "center";
        dollWrapEl.style.gap = "0";
        dollWrapEl.style.zIndex = "7";
        dollWrapEl.style.pointerEvents = "none";

        dollFaceEl = document.createElement("div");
        dollFaceEl.textContent = "👧";
        dollFaceEl.style.fontSize = "58px";
        dollFaceEl.style.lineHeight = "1";
        dollFaceEl.style.transition = "transform 0.1s ease";
        dollFaceEl.style.transform = "scaleX(-1)";
        dollFaceEl.style.filter = "drop-shadow(0 4px 6px rgba(0,0,0,0.10))";

        dollBaseEl = document.createElement("div");
        dollBaseEl.style.position = "relative";
        dollBaseEl.style.width = "56px";
        dollBaseEl.style.height = "74px";
        dollBaseEl.style.borderRadius = "10px";
        dollBaseEl.style.marginTop = "-4px";
        dollBaseEl.style.background =
          "linear-gradient(180deg, #fb5a4e 0%, #d5382d 100%)";
        dollBaseEl.style.boxShadow =
          "inset 0 2px 0 rgba(255,255,255,0.35), 0 8px 16px rgba(0,0,0,0.12)";

        dollGunEl = document.createElement("div");
        dollGunEl.textContent = "🔫";
        dollGunEl.style.position = "absolute";
        dollGunEl.style.right = "-26px";
        dollGunEl.style.top = "8px";
        dollGunEl.style.fontSize = "30px";
        dollGunEl.style.transform = "scaleX(-1) rotate(-10deg)";
        dollGunEl.style.transition = "transform 0.1s ease, right 0.1s ease, left 0.1s ease";
        dollGunEl.style.filter = "drop-shadow(0 4px 6px rgba(0,0,0,0.14))";

        dollBaseEl.appendChild(dollGunEl);
        dollWrapEl.appendChild(dollFaceEl);
        dollWrapEl.appendChild(dollBaseEl);
        areaEl.appendChild(dollWrapEl);
      }

      function createSignalUI() {
        signalEl = document.createElement("div");
        signalEl.style.position = "absolute";
        signalEl.style.left = "50%";
        signalEl.style.top = "164px";
        signalEl.style.transform = "translateX(-50%)";
        signalEl.style.padding = "14px 30px";
        signalEl.style.borderRadius = "999px";
        signalEl.style.fontSize = "24px";
        signalEl.style.fontWeight = "900";
        signalEl.style.zIndex = "8";
        signalEl.style.boxShadow = "0 16px 28px rgba(0,0,0,0.12)";
        signalEl.style.userSelect = "none";
        signalEl.style.backdropFilter = "blur(4px)";
        areaEl.appendChild(signalEl);

        warningEl = document.createElement("div");
        warningEl.style.position = "absolute";
        warningEl.style.left = "50%";
        warningEl.style.top = "222px";
        warningEl.style.transform = "translateX(-50%)";
        warningEl.style.padding = "9px 18px";
        warningEl.style.borderRadius = "999px";
        warningEl.style.fontSize = "15px";
        warningEl.style.fontWeight = "800";
        warningEl.style.color = "#7b4a00";
        warningEl.style.background = "rgba(255, 243, 205, 0.96)";
        warningEl.style.boxShadow = "0 10px 18px rgba(0,0,0,0.10)";
        warningEl.style.zIndex = "8";
        warningEl.style.opacity = "0";
        warningEl.style.transition = "opacity 0.12s ease";
        warningEl.style.userSelect = "none";
        areaEl.appendChild(warningEl);
      }

      function updateSignalVisual() {
        if (!signalEl) return;

        if (signal === "go") {
          signalEl.textContent = "เดิน";
          signalEl.style.background = "linear-gradient(135deg, #d9f8cb 0%, #c9f1b8 100%)";
          signalEl.style.color = "#21611b";

          if (dollFaceEl) {
            dollFaceEl.style.transform = "scaleX(-1)";
          }
          if (dollGunEl) {
            dollGunEl.style.left = "";
            dollGunEl.style.right = "-26px";
            dollGunEl.style.transform = "scaleX(-1) rotate(-10deg)";
          }
        } else {
          signalEl.textContent = "หยุด";
          signalEl.style.background = "linear-gradient(135deg, #ffd7d7 0%, #ffc4c4 100%)";
          signalEl.style.color = "#8a1f1f";

          if (dollFaceEl) {
            dollFaceEl.style.transform = "scaleX(1)";
          }
          if (dollGunEl) {
            dollGunEl.style.right = "";
            dollGunEl.style.left = "-26px";
            dollGunEl.style.transform = "scaleX(1) rotate(10deg)";
          }
        }
      }

      function showWarning(text) {
        if (!warningEl) return;

        warningEl.textContent = text;
        warningEl.style.opacity = "1";

        if (blinkInterval) {
          clearInterval(blinkInterval);
          blinkInterval = null;
        }

        let visible = true;
        blinkInterval = setInterval(() => {
          visible = !visible;
          warningEl.style.opacity = visible ? "1" : "0.35";
        }, 100);
      }

      function hideWarning() {
        if (!warningEl) return;
        warningEl.style.opacity = "0";
        if (blinkInterval) {
          clearInterval(blinkInterval);
          blinkInterval = null;
        }
      }

      function ensurePlayerFigure() {
        if (playerFigureBuilt) return;

        playerEl.innerHTML = "";
        playerEl.style.position = "absolute";
        playerEl.style.display = "flex";
        playerEl.style.alignItems = "flex-end";
        playerEl.style.justifyContent = "center";
        playerEl.style.zIndex = "6";
        playerEl.style.pointerEvents = "none";

        playerFigureEl = document.createElement("div");
        playerFigureEl.style.position = "relative";
        playerFigureEl.style.width = "46px";
        playerFigureEl.style.height = "60px";
        playerFigureEl.style.transformOrigin = "50% 100%";
        playerFigureEl.style.filter = "drop-shadow(0 6px 8px rgba(0,0,0,0.12))";

        playerHeadEl = document.createElement("div");
        playerHeadEl.style.position = "absolute";
        playerHeadEl.style.left = "50%";
        playerHeadEl.style.top = "0";
        playerHeadEl.style.width = "15px";
        playerHeadEl.style.height = "15px";
        playerHeadEl.style.borderRadius = "50%";
        playerHeadEl.style.transform = "translateX(-50%)";
        playerHeadEl.style.background = "#f2c79b";
        playerHeadEl.style.boxShadow = "0 1px 0 rgba(0,0,0,0.12) inset";

        const hairEl = document.createElement("div");
        hairEl.style.position = "absolute";
        hairEl.style.left = "50%";
        hairEl.style.top = "0";
        hairEl.style.width = "17px";
        hairEl.style.height = "8px";
        hairEl.style.transform = "translateX(-50%)";
        hairEl.style.borderRadius = "10px 10px 5px 5px";
        hairEl.style.background = "#2c1a13";

        playerBodyEl = document.createElement("div");
        playerBodyEl.style.position = "absolute";
        playerBodyEl.style.left = "50%";
        playerBodyEl.style.top = "14px";
        playerBodyEl.style.width = "18px";
        playerBodyEl.style.height = "22px";
        playerBodyEl.style.transform = "translateX(-50%)";
        playerBodyEl.style.borderRadius = "7px 7px 4px 4px";
        playerBodyEl.style.background = "linear-gradient(180deg, #5f99ff 0%, #2f68dd 100%)";

        playerArmLeftEl = document.createElement("div");
        playerArmLeftEl.style.position = "absolute";
        playerArmLeftEl.style.left = "10px";
        playerArmLeftEl.style.top = "16px";
        playerArmLeftEl.style.width = "4px";
        playerArmLeftEl.style.height = "19px";
        playerArmLeftEl.style.borderRadius = "999px";
        playerArmLeftEl.style.transformOrigin = "50% 2px";
        playerArmLeftEl.style.background = "#efbc8e";

        playerArmRightEl = document.createElement("div");
        playerArmRightEl.style.position = "absolute";
        playerArmRightEl.style.right = "10px";
        playerArmRightEl.style.top = "16px";
        playerArmRightEl.style.width = "4px";
        playerArmRightEl.style.height = "19px";
        playerArmRightEl.style.borderRadius = "999px";
        playerArmRightEl.style.transformOrigin = "50% 2px";
        playerArmRightEl.style.background = "#efbc8e";

        playerLegLeftEl = document.createElement("div");
        playerLegLeftEl.style.position = "absolute";
        playerLegLeftEl.style.left = "16px";
        playerLegLeftEl.style.top = "34px";
        playerLegLeftEl.style.width = "5px";
        playerLegLeftEl.style.height = "23px";
        playerLegLeftEl.style.borderRadius = "999px";
        playerLegLeftEl.style.transformOrigin = "50% 3px";
        playerLegLeftEl.style.background = "#2f333d";

        playerLegRightEl = document.createElement("div");
        playerLegRightEl.style.position = "absolute";
        playerLegRightEl.style.right = "16px";
        playerLegRightEl.style.top = "34px";
        playerLegRightEl.style.width = "5px";
        playerLegRightEl.style.height = "23px";
        playerLegRightEl.style.borderRadius = "999px";
        playerLegRightEl.style.transformOrigin = "50% 3px";
        playerLegRightEl.style.background = "#2f333d";

        const footLeftEl = document.createElement("div");
        footLeftEl.style.position = "absolute";
        footLeftEl.style.left = "-2px";
        footLeftEl.style.bottom = "-1px";
        footLeftEl.style.width = "10px";
        footLeftEl.style.height = "4px";
        footLeftEl.style.borderRadius = "4px";
        footLeftEl.style.background = "#221a12";

        const footRightEl = document.createElement("div");
        footRightEl.style.position = "absolute";
        footRightEl.style.left = "-2px";
        footRightEl.style.bottom = "-1px";
        footRightEl.style.width = "10px";
        footRightEl.style.height = "4px";
        footRightEl.style.borderRadius = "4px";
        footRightEl.style.background = "#221a12";

        playerLegLeftEl.appendChild(footLeftEl);
        playerLegRightEl.appendChild(footRightEl);

        playerFigureEl.appendChild(playerArmLeftEl);
        playerFigureEl.appendChild(playerArmRightEl);
        playerFigureEl.appendChild(playerLegLeftEl);
        playerFigureEl.appendChild(playerLegRightEl);
        playerFigureEl.appendChild(playerBodyEl);
        playerFigureEl.appendChild(playerHeadEl);
        playerFigureEl.appendChild(hairEl);

        playerEl.appendChild(playerFigureEl);
        playerFigureBuilt = true;
      }

      function applyPlayerPose(isWalking) {
        if (!playerFigureEl) return;

        if (!isWalking) {
          playerArmLeftEl.style.transform = "rotate(12deg)";
          playerArmRightEl.style.transform = "rotate(-12deg)";
          playerLegLeftEl.style.transform = "rotate(8deg)";
          playerLegRightEl.style.transform = "rotate(-8deg)";
          playerFigureEl.style.transform = "translateY(0px)";
          return;
        }

        const swing = Math.sin(state.player.walkPhase) * 24;
        const legSwing = Math.sin(state.player.walkPhase) * 18;
        const bodyBounce = Math.abs(Math.sin(state.player.walkPhase)) * -2.6;

        playerArmLeftEl.style.transform = `rotate(${swing}deg)`;
        playerArmRightEl.style.transform = `rotate(${-swing}deg)`;
        playerLegLeftEl.style.transform = `rotate(${-legSwing}deg)`;
        playerLegRightEl.style.transform = `rotate(${legSwing}deg)`;
        playerFigureEl.style.transform = `translateY(${bodyBounce}px)`;
      }

      function setPlayerVisual(isWalking) {
        ensurePlayerFigure();

        playerEl.style.display = "flex";
        playerEl.style.width = `${state.player.size}px`;
        playerEl.style.height = `${state.player.size}px`;
        playerEl.style.left = `${state.player.x}px`;
        playerEl.style.top = `${state.player.y + state.player.bob}px`;
        playerEl.style.alignItems = "flex-end";
        playerEl.style.justifyContent = "center";
        playerEl.style.willChange = "transform, left, top";
        playerEl.style.transition = "transform 0.06s linear";

        if (state.player.direction === "right") {
          playerEl.style.transform = isWalking ? "scaleX(1) rotate(-2deg)" : "scaleX(1)";
        } else {
          playerEl.style.transform = isWalking ? "scaleX(-1) rotate(-2deg)" : "scaleX(-1)";
        }

        applyPlayerPose(isWalking);
      }

      function renderPlayer() {
        const movingNow =
          signal === "go" && !finished && running && (keys.right || keys.left);

        if (movingNow) {
          state.player.bob += 0.45;
          if (state.player.bob > 2.4) {
            state.player.bob = -2.4;
          }
          state.player.walkPhase += 0.42;
        } else {
          state.player.bob *= 0.45;
          if (Math.abs(state.player.bob) < 0.15) {
            state.player.bob = 0;
          }
        }

        setPlayerVisual(movingNow);
      }

      function isTryingToMove() {
        return keys.right || keys.left;
      }

      function failGame() {
        if (finished) return;
        finished = true;
        running = false;
        score = 0;
        setScore(0);
        setResultText("พลาด! โกโกวาหันมาเห็นตอนขยับ เกมจบทันที");
        finishNow();
      }

      function winGame() {
        if (finished) return;
        finished = true;
        running = false;
        score = winScore;
        setScore(score);
        setResultText(`สำเร็จ! คุณเดินถึงเส้นชัยได้ทัน ได้ ${score} คะแนน`);
        finishNow();
      }

      function applyPendingSignal(nextSignal) {
        signal = nextSignal;
        hideWarning();
        updateSignalVisual();

        if (signal === "stop" && isTryingToMove()) {
          failGame();
        }
      }

      function scheduleNextPhase() {
        if (!running || finished) return;

        const nextSignal = signal === "go" ? "stop" : "go";
        const warningText = nextSignal === "stop" ? "โกโกวาจะหันมา..." : "เตรียมเดิน...";

        const baseDelay =
          nextSignal === "stop"
            ? 620 + Math.random() * 180
            : 520 + Math.random() * 140;

        phaseTimer = setTimeout(() => {
          if (!running || finished) return;

          showWarning(warningText);

          phaseTimeout = setTimeout(() => {
            if (!running || finished) return;
            applyPendingSignal(nextSignal);
            scheduleNextPhase();
          }, 400);
        }, baseDelay);
      }

      function updatePlayer() {
        const wantsMove = isTryingToMove();

        if (signal === "stop" && wantsMove) {
          failGame();
          return;
        }

        if (signal === "go") {
          if (keys.right) {
            state.player.x += state.player.speed;
            state.player.direction = "right";
          }
          if (keys.left) {
            state.player.x -= state.player.speed;
            state.player.direction = "left";
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
          state.player.y = state.height - state.player.size - 26;
          state.player.bob = 0;
          state.player.direction = "right";
          state.player.walkPhase = 0;
          state.goalX = state.width - 126;

          applyAreaStyle();
          createScene();
          createDoll();
          createSignalUI();
          signal = "go";
          updateSignalVisual();
          hideWarning();
          setScore(0);
          renderPlayer();
        },

        start() {
          running = true;
          finished = false;
          score = 0;
          signal = "go";
          updateSignalVisual();
          hideWarning();
          scheduleNextPhase();
          loop();
        },

        stop() {
          running = false;

          if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
          }

          if (phaseTimer) {
            clearTimeout(phaseTimer);
            phaseTimer = null;
          }

          if (phaseTimeout) {
            clearTimeout(phaseTimeout);
            phaseTimeout = null;
          }

          if (blinkInterval) {
            clearInterval(blinkInterval);
            blinkInterval = null;
          }

          [
            skyGlowEl,
            sunEl,
            hillBackEl,
            hillFrontEl,
            trackEl,
            laneStripeEl,
            groundEl,
            finishLineEl,
            dollWrapEl,
            signalEl,
            warningEl
          ].forEach((el) => {
            if (el && el.parentNode) {
              el.parentNode.removeChild(el);
            }
          });

          skyGlowEl = null;
          sunEl = null;
          hillBackEl = null;
          hillFrontEl = null;
          trackEl = null;
          laneStripeEl = null;
          groundEl = null;
          finishLineEl = null;
          finishPoleTopEl = null;
          finishPoleBottomEl = null;
          finishFlagEl = null;
          dollWrapEl = null;
          dollFaceEl = null;
          dollGunEl = null;
          dollBaseEl = null;
          signalEl = null;
          warningEl = null;
        },

        onKeyDown(key) {
          if (key === "d" || key === "arrowright") keys.right = true;
          if (key === "a" || key === "arrowleft") keys.left = true;

          if (signal === "stop" && (keys.right || keys.left)) {
            failGame();
          }
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