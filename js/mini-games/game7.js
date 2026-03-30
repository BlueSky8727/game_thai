//js/mini-games/game7.js
window.MiniGameShared.register("game7", (config = {}) => {
  const duration = Number(config.duration) || 10;
  const surviveScore = Number(config.bonusPerCatch) || 10;

  return {
    id: "game7",
    title: "จับเสือ",
    description: `วิ่งหนีเสือให้อยู่รอดจนหมดเวลา ${duration} วินาที`,
    overlayTitle: "มินิเกม: จับเสือ",
    overlayDescription:
      "เลือกว่าจะจับเสือด้วยมือเปล่าหรือปืนลูกซอง",

    themeClass: "theme-forest",
    duration,
    deferStartTimer: true,

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
      const {
        areaEl,
        playerEl,
        utils,
        setScore,
        setResultText,
        clearAreaInlineStyles,
        finishNow,
        startMiniTimer
      } = context;
      const { clamp } = utils;

      let animationId = null;
      let finished = false;
      let score = 0;
      let selectionOverlay = null;
      let tigerEl = null;
      let muzzleFlashEl = null;
      let playerAvatarEl = null;
      let playerGunWrapEl = null;
      let playerGunBarrelEl = null;
      let playerGunStockEl = null;
      let shotLineEl = null;

      const keys = {
        up: false,
        down: false,
        left: false,
        right: false
      };

      const state = {
        width: 0,
        height: 0,
        gameStarted: false,
        selectedTool: null,
        mouseX: 0,
        mouseY: 0,
        gunAngle: -20,
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
          speed: 2.35,
          alive: true
        }
      };

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

      function createPart(styles = {}) {
        const el = document.createElement("div");
        el.style.position = "absolute";
        el.style.boxSizing = "border-box";
        Object.assign(el.style, styles);
        return el;
      }

      function clearSelectionOverlay() {
        if (selectionOverlay && selectionOverlay.parentNode) {
          selectionOverlay.parentNode.removeChild(selectionOverlay);
        }
        selectionOverlay = null;
      }

      function startRealGame(value) {
        state.selectedTool = value;
        state.gameStarted = true;
        state.player.speed = 4.8;
        updatePlayerEl();
        clearSelectionOverlay();
        startMiniTimer();
        loop();
      }

      function createSelectionOverlay() {
        selectionOverlay = createPart({
          inset: "0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(13, 25, 10, 0.28)",
          backdropFilter: "blur(2px)",
          zIndex: "20"
        });

        const card = createPart({
          position: "relative",
          width: "min(92%, 560px)",
          padding: "22px 18px 18px",
          borderRadius: "24px",
          background: "rgba(255,255,255,0.96)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "18px"
        });

        const title = createPart({
          position: "relative",
          width: "100%",
          textAlign: "center",
          fontSize: "24px",
          fontWeight: "900",
          color: "#244222",
          lineHeight: "1.3"
        });
        title.textContent = "คุณจงเลือกจะจับเสือด้วยอะไร";

        const options = createPart({
          position: "relative",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px"
        });

        function makeOption(label, subtitle, emoji, value) {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.style.border = "none";
          btn.style.borderRadius = "22px";
          btn.style.padding = "22px 14px";
          btn.style.cursor = "pointer";
          btn.style.background =
            "linear-gradient(180deg, #f2fbef 0%, #d8efcf 100%)";
          btn.style.boxShadow = "0 10px 20px rgba(0,0,0,0.10)";
          btn.style.display = "flex";
          btn.style.flexDirection = "column";
          btn.style.alignItems = "center";
          btn.style.justifyContent = "center";
          btn.style.gap = "8px";
          btn.style.transition = "transform 0.15s ease, box-shadow 0.15s ease";

          btn.onmouseenter = () => {
            btn.style.transform = "translateY(-3px)";
            btn.style.boxShadow = "0 16px 24px rgba(0,0,0,0.14)";
          };
          btn.onmouseleave = () => {
            btn.style.transform = "translateY(0px)";
            btn.style.boxShadow = "0 10px 20px rgba(0,0,0,0.10)";
          };

          const icon = document.createElement("div");
          icon.textContent = emoji;
          icon.style.fontSize = "58px";
          icon.style.lineHeight = "1";

          const text = document.createElement("div");
          text.textContent = label;
          text.style.fontSize = "22px";
          text.style.fontWeight = "900";
          text.style.color = "#20351f";

          const desc = document.createElement("div");
          desc.textContent = subtitle;
          desc.style.fontSize = "14px";
          desc.style.fontWeight = "700";
          desc.style.color = "#4d6a48";
          desc.style.textAlign = "center";

          btn.appendChild(icon);
          btn.appendChild(text);
          btn.appendChild(desc);

          btn.addEventListener("click", () => {
            startRealGame(value);
          });

          return btn;
        }

        options.appendChild(
          makeOption("มือเปล่า", "", "✋", "hand")
        );
        options.appendChild(
          makeOption("ปืน", "", "🔫", "shotgun")
        );

        card.appendChild(title);
        card.appendChild(options);
        selectionOverlay.appendChild(card);
        areaEl.appendChild(selectionOverlay);
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

      function createPlayer() {
        playerEl.style.display = "flex";
        playerEl.style.position = "absolute";
        playerEl.style.alignItems = "center";
        playerEl.style.justifyContent = "center";
        playerEl.style.width = `${state.player.size}px`;
        playerEl.style.height = `${state.player.size}px`;
        playerEl.style.zIndex = "6";
        playerEl.style.userSelect = "none";
        playerEl.innerHTML = "";

        playerAvatarEl = createPart({
          left: "50%",
          top: "50%",
          width: "44px",
          height: "44px",
          transform: "translate(-50%, -50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "40px",
          lineHeight: "1"
        });
        playerAvatarEl.textContent = "🏃";

        playerGunWrapEl = createPart({
          left: "50%",
          top: "50%",
          width: "44px",
          height: "12px",
          transform: "translate(-8px, -2px) rotate(-20deg)",
          transformOrigin: "8px 6px",
          display: "none",
          zIndex: "2"
        });

        playerGunStockEl = createPart({
          left: "0px",
          top: "2px",
          width: "12px",
          height: "8px",
          borderRadius: "4px",
          background: "linear-gradient(180deg, #7a532d 0%, #4f3419 100%)",
          transform: "rotate(12deg)"
        });

        playerGunBarrelEl = createPart({
          left: "10px",
          top: "3px",
          width: "28px",
          height: "6px",
          borderRadius: "999px",
          background: "linear-gradient(180deg, #525252 0%, #1f1f1f 100%)"
        });

        playerGunWrapEl.appendChild(playerGunStockEl);
        playerGunWrapEl.appendChild(playerGunBarrelEl);
        playerEl.appendChild(playerAvatarEl);
        playerEl.appendChild(playerGunWrapEl);
      }

      function createMuzzleFlash() {
        muzzleFlashEl = createPart({
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at center, rgba(255,231,119,0.95) 0%, rgba(255,164,63,0.78) 38%, rgba(255,110,24,0) 72%)",
          pointerEvents: "none",
          zIndex: "12",
          opacity: "0"
        });
        areaEl.appendChild(muzzleFlashEl);
      }

      function createShotLine() {
        shotLineEl = createPart({
          height: "4px",
          borderRadius: "999px",
          background:
            "linear-gradient(90deg, rgba(255,243,156,0.95) 0%, rgba(255,196,69,0.88) 70%, rgba(255,196,69,0) 100%)",
          pointerEvents: "none",
          zIndex: "11",
          opacity: "0",
          transformOrigin: "0 50%"
        });
        areaEl.appendChild(shotLineEl);
      }

      function updatePlayerEl() {
        playerEl.style.left = `${state.player.x}px`;
        playerEl.style.top = `${state.player.y}px`;

        if (state.selectedTool === "shotgun") {
          playerAvatarEl.textContent = "🧍";
          playerGunWrapEl.style.display = "block";
          playerGunWrapEl.style.transform = `translate(-8px, -2px) rotate(${state.gunAngle}deg)`;
        } else {
          playerAvatarEl.textContent = "🏃";
          playerGunWrapEl.style.display = "none";
        }
      }

      function updateTigerEl() {
        if (!tigerEl) return;
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
        state.gameStarted = false;
        score = 0;
        setScore(0);
        setResultText("โดนเสือจับได้ ไม่ได้คะแนนโบนัส");
        finishNow();
      }

      function finishWinByShot() {
        if (finished) return;
        finished = true;
        state.gameStarted = false;
        score = surviveScore;
        setScore(score);
        setResultText(`คุณยิงเสือล้มสำเร็จ ได้ ${score} คะแนน`);
        finishNow();
      }

      function getMoveState() {
        return {
          up: keys.up,
          down: keys.down,
          left: keys.left,
          right: keys.right
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
        if (!state.tiger.alive) return;

        const dx = state.player.x - state.tiger.x;
        const dy = state.player.y - state.tiger.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        state.tiger.x += (dx / dist) * state.tiger.speed;
        state.tiger.y += (dy / dist) * state.tiger.speed;

        state.tiger.x = clamp(state.tiger.x, 0, state.width - state.tiger.size);
        state.tiger.y = clamp(state.tiger.y, 0, state.height - state.tiger.size);

        updateTigerEl();
      }

      function updateAimFromMouse(clientX, clientY) {
        const rect = areaEl.getBoundingClientRect();
        state.mouseX = clientX - rect.left;
        state.mouseY = clientY - rect.top;

        if (state.selectedTool !== "shotgun") return;

        const gunOriginX = state.player.x + state.player.size / 2;
        const gunOriginY = state.player.y + state.player.size / 2;
        const dx = state.mouseX - gunOriginX;
        const dy = state.mouseY - gunOriginY;

        state.gunAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
        updatePlayerEl();
      }

      function showMuzzleFlash(angle, originX, originY) {
        if (!muzzleFlashEl) return;

        const rad = (angle * Math.PI) / 180;
        const fxX = originX + Math.cos(rad) * 30;
        const fxY = originY + Math.sin(rad) * 30;

        muzzleFlashEl.style.left = `${fxX - 20}px`;
        muzzleFlashEl.style.top = `${fxY - 20}px`;
        muzzleFlashEl.style.opacity = "1";
        muzzleFlashEl.animate(
          [
            { transform: "scale(0.5)", opacity: 1 },
            { transform: "scale(1.25)", opacity: 0 }
          ],
          {
            duration: 140,
            easing: "ease-out"
          }
        );

        setTimeout(() => {
          if (muzzleFlashEl) muzzleFlashEl.style.opacity = "0";
        }, 130);
      }

      function showShotLine(originX, originY, targetX, targetY) {
        if (!shotLineEl) return;

        const dx = targetX - originX;
        const dy = targetY - originY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        shotLineEl.style.left = `${originX}px`;
        shotLineEl.style.top = `${originY - 2}px`;
        shotLineEl.style.width = `${dist}px`;
        shotLineEl.style.transform = `rotate(${angle}deg)`;
        shotLineEl.style.opacity = "1";

        shotLineEl.animate(
          [
            { opacity: 1 },
            { opacity: 0 }
          ],
          {
            duration: 120,
            easing: "ease-out"
          }
        );

        setTimeout(() => {
          if (shotLineEl) shotLineEl.style.opacity = "0";
        }, 110);
      }

      function lineHitsTiger(originX, originY, targetX, targetY) {
        const tigerCenterX = state.tiger.x + state.tiger.size / 2;
        const tigerCenterY = state.tiger.y + state.tiger.size / 2;

        const ax = originX;
        const ay = originY;
        const bx = targetX;
        const by = targetY;
        const px = tigerCenterX;
        const py = tigerCenterY;

        const abx = bx - ax;
        const aby = by - ay;
        const abLen2 = abx * abx + aby * aby || 1;

        let t = ((px - ax) * abx + (py - ay) * aby) / abLen2;
        t = Math.max(0, Math.min(1, t));

        const closestX = ax + abx * t;
        const closestY = ay + aby * t;

        const dx = px - closestX;
        const dy = py - closestY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        return dist <= state.tiger.size * 0.34;
      }

      function shootTiger() {
        if (
          finished ||
          !state.gameStarted ||
          state.selectedTool !== "shotgun" ||
          !state.tiger.alive
        ) {
          return;
        }

        const originX = state.player.x + state.player.size / 2;
        const originY = state.player.y + state.player.size / 2;
        const targetX = state.mouseX || originX + 120;
        const targetY = state.mouseY || originY;

        showMuzzleFlash(state.gunAngle, originX, originY);
        showShotLine(originX, originY, targetX, targetY);

        if (lineHitsTiger(originX, originY, targetX, targetY)) {
          state.tiger.alive = false;

          if (tigerEl) {
            tigerEl.animate(
              [
                { transform: "rotate(0deg) scale(1)", opacity: 1 },
                { transform: "rotate(90deg) scale(0.92)", opacity: 0.9 }
              ],
              {
                duration: 220,
                easing: "ease-out",
                fill: "forwards"
              }
            );
          }

          setTimeout(() => {
            finishWinByShot();
          }, 220);
        }
      }

      function handleAreaMouseMove(event) {
        if (!state.gameStarted) return;
        if (state.selectedTool !== "shotgun") return;
        updateAimFromMouse(event.clientX, event.clientY);
      }

      function handleAreaClick(event) {
        if (!state.gameStarted) return;
        if (state.selectedTool !== "shotgun") return;
        updateAimFromMouse(event.clientX, event.clientY);
        shootTiger();
      }

      function loop() {
        if (finished || !state.gameStarted) return;

        updatePlayer();
        updateTiger();

        if (state.tiger.alive && hitTest()) {
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

          state.selectedTool = null;
          state.gameStarted = false;
          state.tiger.alive = true;
          state.player.speed = 4.8;
          state.gunAngle = -20;
          state.mouseX = 0;
          state.mouseY = 0;

          state.player.x = 36;
          state.player.y = state.height - state.player.size - 24;

          state.tiger.x = state.width - state.tiger.size - 40;
          state.tiger.y = 40;

          playerEl.className = "player";
          createPlayer();
          createTiger();
          createMuzzleFlash();
          createShotLine();
          updatePlayerEl();
          updateTigerEl();
          createSelectionOverlay();
          setScore(0);

          areaEl.addEventListener("mousemove", handleAreaMouseMove);
          areaEl.addEventListener("click", handleAreaClick);
        },

        start() {
          finished = false;
        },

        stop() {
          if (!finished && state.gameStarted) {
            score = surviveScore;
            setScore(score);
            setResultText(`หมดเวลา! คุณหนีเสือสำเร็จ ได้ ${score} คะแนน`);
          }

          state.gameStarted = false;

          if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
          }

          clearSelectionOverlay();

          areaEl.removeEventListener("mousemove", handleAreaMouseMove);
          areaEl.removeEventListener("click", handleAreaClick);

          if (tigerEl && tigerEl.parentNode) {
            tigerEl.parentNode.removeChild(tigerEl);
          }
          tigerEl = null;

          if (muzzleFlashEl && muzzleFlashEl.parentNode) {
            muzzleFlashEl.parentNode.removeChild(muzzleFlashEl);
          }
          muzzleFlashEl = null;

          if (shotLineEl && shotLineEl.parentNode) {
            shotLineEl.parentNode.removeChild(shotLineEl);
          }
          shotLineEl = null;
        },

        onKeyDown(key) {
          if (!state.gameStarted) return;

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