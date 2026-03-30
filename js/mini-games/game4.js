//js/mini-games/game4.js
window.MiniGameShared.register("game4", (config = {}) => {
  const duration = Number(config.duration) || 20;
  const bonusPerCatch = Number(config.bonusPerCatch) || 1;
  const fallSpeed = Number(config.enemySpeedLimit) || 3.0;
  const waterCount = Number(config.enemyCount) || 9;

  function ensureAssets() {
    const styleId = "mini-game4-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .theme-sky {
        position: relative;
        overflow: hidden;
        background:
          radial-gradient(circle at 16% 10%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 12%, transparent 28%),
          radial-gradient(circle at 82% 12%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 10%, transparent 24%),
          linear-gradient(180deg, #7f95a6 0%, #90a8bb 18%, #86a9b3 38%, #7fa886 70%, #5c8f4d 100%);
      }

      .theme-sky::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        background:
          linear-gradient(to top, rgba(16, 40, 18, 0.22), transparent 32%),
          linear-gradient(to bottom, rgba(40, 54, 66, 0.16), transparent 18%),
          repeating-linear-gradient(
            102deg,
            rgba(255,255,255,0) 0px,
            rgba(255,255,255,0) 16px,
            rgba(255,255,255,0.022) 17px,
            rgba(255,255,255,0) 18px
          );
        opacity: 0.95;
      }

      .theme-sky::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        background:
          radial-gradient(circle at 50% -10%, rgba(255,255,255,0.08), transparent 34%);
        opacity: 0.55;
      }

      .theme-sky .rain-back-hill {
        position: absolute;
        left: -8%;
        right: -8%;
        bottom: 22%;
        height: 18%;
        z-index: 0;
        pointer-events: none;
        border-radius: 50% 50% 0 0 / 100% 100% 0 0;
        background: linear-gradient(180deg, rgba(96, 128, 88, 0.46) 0%, rgba(70, 101, 60, 0.72) 100%);
        opacity: 0.74;
      }

      .theme-sky .rain-front-grass {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 22%;
        z-index: 1;
        pointer-events: none;
        background:
          linear-gradient(180deg, rgba(66, 128, 54, 0.10) 0%, rgba(42, 92, 34, 0.24) 100%),
          repeating-linear-gradient(
            100deg,
            rgba(0,0,0,0) 0px,
            rgba(0,0,0,0) 10px,
            rgba(120, 176, 92, 0.12) 11px,
            rgba(0,0,0,0) 12px
          );
      }

      .theme-sky .rain-ground-shadow {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 32%;
        pointer-events: none;
        z-index: 1;
        background:
          linear-gradient(to top, rgba(15, 37, 14, 0.24), transparent 70%);
      }

      .theme-sky .rain-ambient-streaks {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 1;
        background:
          repeating-linear-gradient(
            110deg,
            rgba(255,255,255,0) 0px,
            rgba(255,255,255,0) 54px,
            rgba(255,255,255,0.08) 55px,
            rgba(255,255,255,0) 66px
          );
        animation: game4AmbientRain 4.3s linear infinite;
        opacity: 0.44;
      }

      .theme-sky .rain-mist {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 16%;
        height: 26%;
        pointer-events: none;
        z-index: 1;
        background:
          linear-gradient(180deg, rgba(220, 232, 238, 0.00) 0%, rgba(220, 232, 238, 0.14) 100%);
        filter: blur(2px);
        opacity: 0.75;
      }

      .game4-cloud {
        position: absolute;
        pointer-events: none;
        user-select: none;
        z-index: 2;
        opacity: 0.98;
        filter: drop-shadow(0 8px 16px rgba(47, 61, 74, 0.16));
        animation: game4CloudFloat 4.6s ease-in-out infinite;
      }

      .game4-player-wrap {
        position: absolute;
        pointer-events: none;
        user-select: none;
        z-index: 5;
        transform-origin: center bottom;
      }

      .game4-player-shadow {
        position: absolute;
        left: 50%;
        bottom: 6px;
        width: 58px;
        height: 12px;
        transform: translateX(-50%);
        border-radius: 999px;
        background: rgba(0,0,0,0.20);
        filter: blur(2px);
      }

      .game4-player-character {
        position: absolute;
        left: 50%;
        bottom: 10px;
        width: 96px;
        height: 118px;
        transform: translateX(-50%);
        transform-origin: center bottom;
        filter: drop-shadow(0 10px 14px rgba(0,0,0,0.18));
      }

      .game4-drop {
        position: absolute;
        pointer-events: none;
        user-select: none;
        z-index: 3;
        transform-origin: center;
        filter: drop-shadow(0 4px 8px rgba(0, 96, 220, 0.24));
      }

      .game4-drop .drop-core {
        animation: game4DropShine 0.9s ease-in-out infinite;
      }

      @keyframes game4CloudFloat {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(5px);
        }
      }

      @keyframes game4AmbientRain {
        from {
          background-position: -180px 0;
        }
        to {
          background-position: 180px 0;
        }
      }

      @keyframes game4DropShine {
        0%, 100% {
          transform: scale(1) rotate(0deg);
          opacity: 0.95;
        }
        50% {
          transform: scale(1.05) rotate(-4deg);
          opacity: 1;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .theme-sky .rain-ambient-streaks,
        .game4-cloud,
        .game4-drop .drop-core {
          animation: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  return {
    id: "game4",
    title: "รองน้ำฝน",
    description: `ขยับซ้ายและขวาเพื่อเอาถังไปรับน้ำฝนให้ได้มากที่สุดภายใน ${duration} วินาที`,
    overlayTitle: "มินิเกม: รองน้ำฝน",
    overlayDescription:
      "ใช้ปุ่ม A D หรือ ← → ขยับเด็กถือถังที่ชูไว้เหนือหัวไปทางซ้ายและขวา เพื่อรองน้ำที่ตกลงมาจากก้อนเมฆให้ได้มากที่สุด",

    themeClass: "theme-sky",
    duration,
    bonusPerCatch,

    finishText(score) {
      return `หมดเวลา! คุณรองน้ำได้ทั้งหมด ${score} หยด`;
    },

    createController(context) {
      const { areaEl, playerEl, utils, setScore, clearAreaInlineStyles } = context;
      const { clamp, randomBetween } = utils;

      let score = 0;
      let animationId = null;
      let walkPhase = 0;
      let facing = 1;

      const pressed = {
        left: false,
        right: false
      };

      const state = {
        width: 0,
        height: 0,
        player: {
          x: 0,
          y: 0,
          width: 110,
          height: 136,
          speed: 5.2
        },
        bucketBox: {
          x: 0,
          y: 0,
          width: 44,
          height: 20
        },
        drops: [],
        clouds: [],
        decor: []
      };

      let playerWrap = null;
      let playerCharacter = null;
      let playerShadow = null;

      const playerParts = {
        head: null,
        body: null,
        armLeft: null,
        armRight: null,
        legLeft: null,
        legRight: null,
        bucket: null,
        bucketWater: null
      };

      function getAreaSize() {
        return {
          width: areaEl.clientWidth || 680,
          height: areaEl.clientHeight || 390
        };
      }

      function createPart(baseStyles = {}) {
        const el = document.createElement("div");
        el.style.position = "absolute";
        el.style.boxSizing = "border-box";
        Object.assign(el.style, baseStyles);
        return el;
      }

      function addDecor(className) {
        const el = document.createElement("div");
        el.className = className;
        areaEl.appendChild(el);
        state.decor.push(el);
        return el;
      }

      function applyAreaStyle() {
        clearAreaInlineStyles();
        ensureAssets();

        areaEl.style.position = "relative";
        areaEl.style.overflow = "hidden";
        areaEl.style.background =
          "linear-gradient(180deg, #8ea4b4 0%, #95adbe 20%, #87a9b4 42%, #7fa886 74%, #5c8f4d 100%)";
        areaEl.style.border = "3px solid rgba(110, 156, 186, 0.62)";
        areaEl.style.boxShadow = "inset 0 10px 28px rgba(255,255,255,0.10)";

        addDecor("rain-back-hill");
        addDecor("rain-front-grass");
        addDecor("rain-ground-shadow");
        addDecor("rain-ambient-streaks");
        addDecor("rain-mist");
      }

      function createCloud({ x, y, scale = 1 }) {
        const cloud = document.createElement("div");
        cloud.className = "game4-cloud";
        cloud.style.left = `${x}px`;
        cloud.style.top = `${y}px`;
        cloud.style.width = `${110 * scale}px`;
        cloud.style.height = `${44 * scale}px`;
        cloud.style.animationDelay = `${randomBetween(0, 1.8).toFixed(2)}s`;

        const puff1 = createPart({
          left: `${8 * scale}px`,
          top: `${14 * scale}px`,
          width: `${34 * scale}px`,
          height: `${24 * scale}px`,
          borderRadius: "999px",
          background: "linear-gradient(180deg, #eaf0f4 0%, #d6e0e8 100%)"
        });

        const puff2 = createPart({
          left: `${26 * scale}px`,
          top: `${2 * scale}px`,
          width: `${44 * scale}px`,
          height: `${30 * scale}px`,
          borderRadius: "999px",
          background: "linear-gradient(180deg, #eef3f7 0%, #d8e1e7 100%)"
        });

        const puff3 = createPart({
          left: `${54 * scale}px`,
          top: `${10 * scale}px`,
          width: `${36 * scale}px`,
          height: `${25 * scale}px`,
          borderRadius: "999px",
          background: "linear-gradient(180deg, #e5edf3 0%, #cfd9e2 100%)"
        });

        const base = createPart({
          left: `${18 * scale}px`,
          top: `${20 * scale}px`,
          width: `${62 * scale}px`,
          height: `${18 * scale}px`,
          borderRadius: "999px",
          background: "linear-gradient(180deg, #e6edf2 0%, #d0dae3 100%)"
        });

        cloud.appendChild(puff1);
        cloud.appendChild(puff2);
        cloud.appendChild(puff3);
        cloud.appendChild(base);
        areaEl.appendChild(cloud);

        return {
          el: cloud,
          x,
          y,
          scale,
          width: 110 * scale,
          height: 44 * scale
        };
      }

      function createClouds() {
        const presets = [
          { x: 18, y: 18, scale: 0.92 },
          { x: 118, y: 8, scale: 1.02 },
          { x: 228, y: 20, scale: 0.88 },
          { x: 340, y: 10, scale: 1.06 },
          { x: 462, y: 16, scale: 0.94 },
          { x: 572, y: 14, scale: 0.86 }
        ];

        state.clouds = presets
          .filter((item) => item.x < state.width - 10)
          .map((item) => createCloud(item));
      }

      function getRandomCloud() {
        if (!state.clouds.length) return null;
        return state.clouds[Math.floor(Math.random() * state.clouds.length)];
      }

      function createPlayer() {
        playerEl.style.display = "none";

        playerWrap = document.createElement("div");
        playerWrap.className = "game4-player-wrap";
        playerWrap.style.width = `${state.player.width}px`;
        playerWrap.style.height = `${state.player.height}px`;

        playerShadow = document.createElement("div");
        playerShadow.className = "game4-player-shadow";

        playerCharacter = document.createElement("div");
        playerCharacter.className = "game4-player-character";

        const bodyWrap = createPart({
          left: "50%",
          bottom: "0",
          width: "96px",
          height: "118px",
          transform: "translateX(-50%)",
          transformOrigin: "center bottom"
        });

        const head = createPart({
          left: "34px",
          top: "24px",
          width: "30px",
          height: "30px",
          borderRadius: "50%",
          background: "linear-gradient(180deg, #ffd7b0 0%, #f6c391 100%)",
          border: "2px solid rgba(0,0,0,0.08)",
          zIndex: "3"
        });

        const hair = createPart({
          left: "1px",
          top: "-1px",
          width: "27px",
          height: "13px",
          borderRadius: "14px 14px 10px 10px",
          background: "#2f2a28"
        });
        head.appendChild(hair);

        const eyeLeft = createPart({
          left: "7px",
          top: "11px",
          width: "3px",
          height: "3px",
          borderRadius: "50%",
          background: "#2c211b"
        });

        const eyeRight = createPart({
          left: "18px",
          top: "11px",
          width: "3px",
          height: "3px",
          borderRadius: "50%",
          background: "#2c211b"
        });

        const smile = createPart({
          left: "9px",
          top: "18px",
          width: "10px",
          height: "5px",
          borderBottom: "2px solid #a55d49",
          borderRadius: "0 0 8px 8px"
        });

        head.appendChild(eyeLeft);
        head.appendChild(eyeRight);
        head.appendChild(smile);

        const body = createPart({
          left: "29px",
          top: "52px",
          width: "40px",
          height: "34px",
          borderRadius: "12px 12px 10px 10px",
          background: "linear-gradient(180deg, #ffd44d 0%, #f0aa1f 100%)",
          border: "2px solid rgba(0,0,0,0.08)",
          zIndex: "2"
        });

        const collar = createPart({
          left: "12px",
          top: "2px",
          width: "14px",
          height: "8px",
          borderRadius: "0 0 8px 8px",
          background: "rgba(255,255,255,0.78)"
        });
        body.appendChild(collar);

        const armLeft = createPart({
          left: "24px",
          top: "18px",
          width: "9px",
          height: "44px",
          borderRadius: "999px",
          background: "linear-gradient(180deg, #ffd7b0 0%, #f3bf8d 100%)",
          transformOrigin: "bottom center",
          zIndex: "1"
        });

        const armRight = createPart({
          left: "64px",
          top: "18px",
          width: "9px",
          height: "44px",
          borderRadius: "999px",
          background: "linear-gradient(180deg, #ffd7b0 0%, #f3bf8d 100%)",
          transformOrigin: "bottom center",
          zIndex: "1"
        });

        const legLeft = createPart({
          left: "37px",
          top: "84px",
          width: "10px",
          height: "32px",
          borderRadius: "999px",
          background: "linear-gradient(180deg, #355fae 0%, #2a4b88 100%)",
          transformOrigin: "top center",
          zIndex: "0"
        });

        const legRight = createPart({
          left: "51px",
          top: "84px",
          width: "10px",
          height: "32px",
          borderRadius: "999px",
          background: "linear-gradient(180deg, #355fae 0%, #2a4b88 100%)",
          transformOrigin: "top center",
          zIndex: "0"
        });

        const footLeft = createPart({
          left: "-3px",
          bottom: "-2px",
          width: "15px",
          height: "8px",
          borderRadius: "8px",
          background: "#4f3b2f"
        });

        const footRight = createPart({
          left: "-2px",
          bottom: "-2px",
          width: "15px",
          height: "8px",
          borderRadius: "8px",
          background: "#4f3b2f"
        });

        legLeft.appendChild(footLeft);
        legRight.appendChild(footRight);

        const bucket = createPart({
          left: "35px",
          top: "0px",
          width: "26px",
          height: "26px",
          borderRadius: "0 0 9px 9px",
          background: "linear-gradient(180deg, #6e8294 0%, #4b5c6a 100%)",
          border: "2px solid rgba(255,255,255,0.24)",
          transformOrigin: "bottom center",
          zIndex: "5",
          boxShadow: "0 3px 8px rgba(0,0,0,0.14)"
        });

        const bucketRim = createPart({
          left: "-2px",
          top: "-3px",
          width: "26px",
          height: "6px",
          borderRadius: "999px",
          background: "#95a8b5",
          border: "1px solid rgba(0,0,0,0.08)"
        });

        const bucketHandle = createPart({
          left: "5px",
          top: "-11px",
          width: "13px",
          height: "12px",
          border: "2px solid #c0ccd4",
          borderBottom: "none",
          borderRadius: "12px 12px 0 0",
          background: "transparent"
        });

        const bucketWater = createPart({
          left: "3px",
          top: "4px",
          width: "16px",
          height: "9px",
          borderRadius: "0 0 6px 6px",
          background: "linear-gradient(180deg, #8be2ff 0%, #3caeff 100%)",
          opacity: "0.92",
          boxShadow: "0 0 8px rgba(75, 191, 255, 0.24)"
        });

        bucket.appendChild(bucketRim);
        bucket.appendChild(bucketHandle);
        bucket.appendChild(bucketWater);

        bodyWrap.appendChild(armLeft);
        bodyWrap.appendChild(armRight);
        bodyWrap.appendChild(legLeft);
        bodyWrap.appendChild(legRight);
        bodyWrap.appendChild(body);
        bodyWrap.appendChild(head);
        bodyWrap.appendChild(bucket);

        playerCharacter.appendChild(bodyWrap);
        playerWrap.appendChild(playerShadow);
        playerWrap.appendChild(playerCharacter);
        areaEl.appendChild(playerWrap);

        playerParts.head = head;
        playerParts.body = body;
        playerParts.armLeft = armLeft;
        playerParts.armRight = armRight;
        playerParts.legLeft = legLeft;
        playerParts.legRight = legRight;
        playerParts.bucket = bucket;
        playerParts.bucketWater = bucketWater;
      }

      function updatePlayerVisual(isMoving) {
        if (!playerCharacter || !playerShadow) return;

        if (isMoving) {
          walkPhase += 0.33;
        } else {
          walkPhase += 0.08;
        }

        const swing = isMoving ? Math.sin(walkPhase) * 18 : Math.sin(walkPhase) * 4;
        const swingReverse = -swing;
        const bob = isMoving ? Math.sin(walkPhase * 2) * 3 : Math.sin(walkPhase * 1.6) * 1.5;
        const bucketSwing = isMoving ? Math.sin(walkPhase + 0.35) * 4 : Math.sin(walkPhase) * 1.5;

        playerCharacter.style.transform =
          `translateX(-50%) translateY(${bob}px) scaleX(${facing})`;

        playerShadow.style.transform =
          `translateX(-50%) scale(${isMoving ? 0.92 : 1}, ${isMoving ? 0.92 : 1})`;

        if (playerParts.armLeft) {
          playerParts.armLeft.style.transform = `rotate(${(-28 + swing * 0.35)}deg)`;
        }

        if (playerParts.armRight) {
          playerParts.armRight.style.transform = `rotate(${(28 + swingReverse * 0.35)}deg)`;
        }

        if (playerParts.legLeft) {
          playerParts.legLeft.style.transform = `rotate(${swingReverse}deg)`;
        }

        if (playerParts.legRight) {
          playerParts.legRight.style.transform = `rotate(${swing}deg)`;
        }

        if (playerParts.bucket) {
          playerParts.bucket.style.transform = `rotate(${bucketSwing}deg)`;
        }

        if (playerParts.bucketWater) {
          const waterOffset = isMoving ? Math.sin(walkPhase * 1.4) * 1.2 : 0;
          playerParts.bucketWater.style.transform = `translateY(${waterOffset}px)`;
        }
      }

      function updatePlayerPosition() {
        if (!playerWrap) return;

        playerWrap.style.left = `${state.player.x}px`;
        playerWrap.style.top = `${state.player.y}px`;

        state.bucketBox = {
          x: state.player.x + 40,
          y: state.player.y + 12,
          width: 32,
          height: 17
        };
      }

      function createDrop() {
        const size = 24;
        const el = document.createElement("div");
        el.className = "game4-drop";
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.display = "block";

        const core = document.createElement("div");
        core.className = "drop-core";
        core.style.position = "absolute";
        core.style.left = "50%";
        core.style.top = "50%";
        core.style.width = "14px";
        core.style.height = "18px";
        core.style.transform = "translate(-50%, -50%) rotate(8deg)";
        core.style.borderRadius = "50% 50% 60% 60% / 42% 42% 68% 68%";
        core.style.background = "linear-gradient(180deg, #d7f5ff 0%, #75d8ff 35%, #2fa8ff 100%)";
        core.style.boxShadow =
          "inset 0 1px 0 rgba(255,255,255,0.75), 0 1px 6px rgba(45, 154, 255, 0.18)";

        const shine = document.createElement("div");
        shine.style.position = "absolute";
        shine.style.left = "4px";
        shine.style.top = "3px";
        shine.style.width = "4px";
        shine.style.height = "7px";
        shine.style.borderRadius = "999px";
        shine.style.background = "rgba(255,255,255,0.72)";
        shine.style.transform = "rotate(-14deg)";

        core.appendChild(shine);
        el.appendChild(core);
        areaEl.appendChild(el);

        const drop = {
          el,
          size,
          x: 0,
          y: 0,
          speed: 0,
          sourceCloudIndex: 0
        };

        resetDrop(drop, true);
        state.drops.push(drop);
      }

      function resetDrop(drop, initial = false) {
        const cloud = getRandomCloud();

        if (cloud) {
          const cloudIndex = state.clouds.indexOf(cloud);
          drop.sourceCloudIndex = cloudIndex >= 0 ? cloudIndex : 0;
          const minX = cloud.x + 18 * cloud.scale;
          const maxX = cloud.x + cloud.width - 20 * cloud.scale;
          drop.x = randomBetween(minX, maxX);
          drop.y = initial
            ? randomBetween(cloud.y + cloud.height - 2, cloud.y + cloud.height + 26)
            : randomBetween(cloud.y + cloud.height - 2, cloud.y + cloud.height + 10);
        } else {
          drop.x = randomBetween(6, Math.max(7, state.width - drop.size - 6));
          drop.y = initial
            ? randomBetween(-state.height, -drop.size)
            : randomBetween(-120, -24);
        }

        drop.speed = randomBetween(fallSpeed * 0.72, fallSpeed * 1.28);
        renderDrop(drop);
      }

      function renderDrop(drop) {
        drop.el.style.left = `${drop.x}px`;
        drop.el.style.top = `${drop.y}px`;
      }

      function intersects(a, b) {
        return (
          a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y
        );
      }

      function getDropBox(drop) {
        return {
          x: drop.x + 5,
          y: drop.y + 4,
          width: drop.size - 10,
          height: drop.size - 8
        };
      }

      function updatePlayer() {
        let isMoving = false;

        if (pressed.left) {
          state.player.x -= state.player.speed;
          facing = -1;
          isMoving = true;
        }

        if (pressed.right) {
          state.player.x += state.player.speed;
          facing = 1;
          isMoving = true;
        }

        state.player.x = clamp(
          state.player.x,
          0,
          Math.max(0, state.width - state.player.width)
        );

        updatePlayerVisual(isMoving);
        updatePlayerPosition();
      }

      function updateDrops() {
        for (const drop of state.drops) {
          drop.y += drop.speed;
          renderDrop(drop);

          if (intersects(getDropBox(drop), state.bucketBox)) {
            score += bonusPerCatch;
            setScore(score);
            resetDrop(drop, false);
            continue;
          }

          if (drop.y > state.height) {
            resetDrop(drop, false);
          }
        }
      }

      function loop() {
        updatePlayer();
        updateDrops();
        animationId = requestAnimationFrame(loop);
      }

      return {
        setup() {
          const area = getAreaSize();
          state.width = area.width;
          state.height = area.height;

          applyAreaStyle();
          createClouds();
          createPlayer();

          state.player.x = (state.width - state.player.width) / 2;
          state.player.y = state.height - state.player.height - 8;

          updatePlayerVisual(false);
          updatePlayerPosition();

          setScore(0);

          for (let i = 0; i < waterCount; i += 1) {
            createDrop();
          }
        },

        start() {
          if (animationId) {
            cancelAnimationFrame(animationId);
          }
          loop();
        },

        stop() {
          if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
          }

          state.drops.forEach((drop) => {
            if (drop.el && drop.el.parentNode) {
              drop.el.parentNode.removeChild(drop.el);
            }
          });
          state.drops = [];

          state.clouds.forEach((cloud) => {
            if (cloud.el && cloud.el.parentNode) {
              cloud.el.parentNode.removeChild(cloud.el);
            }
          });
          state.clouds = [];

          state.decor.forEach((el) => {
            if (el && el.parentNode) {
              el.parentNode.removeChild(el);
            }
          });
          state.decor = [];

          if (playerWrap && playerWrap.parentNode) {
            playerWrap.parentNode.removeChild(playerWrap);
          }

          playerWrap = null;
          playerCharacter = null;
          playerShadow = null;

          Object.keys(playerParts).forEach((key) => {
            playerParts[key] = null;
          });
        },

        onKeyDown(key) {
          if (key === "a" || key === "arrowleft") {
            pressed.left = true;
          }
          if (key === "d" || key === "arrowright") {
            pressed.right = true;
          }
        },

        onKeyUp(key) {
          if (key === "a" || key === "arrowleft") {
            pressed.left = false;
          }
          if (key === "d" || key === "arrowright") {
            pressed.right = false;
          }
        },

        getScore() {
          return score;
        }
      };
    }
  };
});