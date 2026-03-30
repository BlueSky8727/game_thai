//js/mini-games/game4.js
window.MiniGameShared.register("game4", (config = {}) => {
  const duration = Number(config.duration) || 20;
  const bonusPerCatch = Number(config.bonusPerCatch) || 1;
  const fallSpeed = Number(config.enemySpeedLimit) || 3.0;
  const waterCount = Number(config.enemyCount) || 9;

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
          speed: 5.6
        },
        bucketBox: {
          x: 0,
          y: 0,
          width: 44,
          height: 20
        },
        drops: [],
        clouds: []
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

      function applyAreaStyle() {
        clearAreaInlineStyles();
        areaEl.style.position = "relative";
        areaEl.style.overflow = "hidden";
        areaEl.style.background =
          "linear-gradient(180deg, #dff3ff 0%, #caeaff 20%, #a7daf8 42%, #99d98c 73%, #68b94f 100%)";
        areaEl.style.border = "3px solid rgba(132, 191, 255, 0.55)";
        areaEl.style.boxShadow = "inset 0 10px 30px rgba(255,255,255,0.28)";
      }

      function createPart(baseStyles = {}) {
        const el = document.createElement("div");
        el.style.position = "absolute";
        el.style.boxSizing = "border-box";
        Object.assign(el.style, baseStyles);
        return el;
      }

      function createCloud({ x, y, scale = 1 }) {
        const cloud = document.createElement("div");
        cloud.style.position = "absolute";
        cloud.style.left = `${x}px`;
        cloud.style.top = `${y}px`;
        cloud.style.width = `${110 * scale}px`;
        cloud.style.height = `${44 * scale}px`;
        cloud.style.pointerEvents = "none";
        cloud.style.userSelect = "none";
        cloud.style.zIndex = "2";
        cloud.style.opacity = "0.95";
        cloud.style.filter = "drop-shadow(0 5px 10px rgba(60, 100, 160, 0.10))";

        const puff1 = createPart({
          left: `${8 * scale}px`,
          top: `${14 * scale}px`,
          width: `${34 * scale}px`,
          height: `${24 * scale}px`,
          borderRadius: "999px",
          background: "linear-gradient(180deg, #ffffff 0%, #eef7ff 100%)"
        });

        const puff2 = createPart({
          left: `${26 * scale}px`,
          top: `${2 * scale}px`,
          width: `${44 * scale}px`,
          height: `${30 * scale}px`,
          borderRadius: "999px",
          background: "linear-gradient(180deg, #ffffff 0%, #eef7ff 100%)"
        });

        const puff3 = createPart({
          left: `${54 * scale}px`,
          top: `${10 * scale}px`,
          width: `${36 * scale}px`,
          height: `${25 * scale}px`,
          borderRadius: "999px",
          background: "linear-gradient(180deg, #ffffff 0%, #eef7ff 100%)"
        });

        const base = createPart({
          left: `${18 * scale}px`,
          top: `${20 * scale}px`,
          width: `${62 * scale}px`,
          height: `${18 * scale}px`,
          borderRadius: "999px",
          background: "linear-gradient(180deg, #fafdff 0%, #e8f3ff 100%)"
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
          { x: 16, y: 18, scale: 0.92 },
          { x: 110, y: 8, scale: 1.02 },
          { x: 220, y: 20, scale: 0.88 },
          { x: 328, y: 10, scale: 1.06 },
          { x: 450, y: 16, scale: 0.94 },
          { x: 560, y: 14, scale: 0.86 }
        ];

        state.clouds = presets
          .filter((item) => item.x < state.width - 10)
          .map((item) => createCloud(item));
      }

      function getRandomCloud() {
        if (!state.clouds.length) {
          return null;
        }
        return state.clouds[Math.floor(Math.random() * state.clouds.length)];
      }

      function createPlayer() {
        playerEl.style.display = "none";

        playerWrap = document.createElement("div");
        playerWrap.style.position = "absolute";
        playerWrap.style.width = `${state.player.width}px`;
        playerWrap.style.height = `${state.player.height}px`;
        playerWrap.style.pointerEvents = "none";
        playerWrap.style.userSelect = "none";
        playerWrap.style.zIndex = "5";
        playerWrap.style.transformOrigin = "center bottom";

        playerShadow = createPart({
          left: "50%",
          bottom: "6px",
          width: "58px",
          height: "12px",
          borderRadius: "999px",
          background: "rgba(0,0,0,0.16)",
          transform: "translateX(-50%)",
          filter: "blur(1px)"
        });

        playerCharacter = createPart({
          left: "50%",
          bottom: "10px",
          width: "94px",
          height: "116px",
          transform: "translateX(-50%)",
          transformOrigin: "center bottom",
          filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.16))"
        });

        const bodyWrap = createPart({
          left: "50%",
          bottom: "0",
          width: "94px",
          height: "116px",
          transform: "translateX(-50%)",
          transformOrigin: "center bottom"
        });

        const head = createPart({
          left: "34px",
          top: "26px",
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: "linear-gradient(180deg, #ffd7b0 0%, #f6c391 100%)",
          border: "2px solid rgba(0,0,0,0.08)",
          zIndex: "3"
        });

        const hair = createPart({
          left: "1px",
          top: "-1px",
          width: "25px",
          height: "12px",
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
          left: "17px",
          top: "11px",
          width: "3px",
          height: "3px",
          borderRadius: "50%",
          background: "#2c211b"
        });

        const smile = createPart({
          left: "9px",
          top: "17px",
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
          top: "51px",
          width: "38px",
          height: "32px",
          borderRadius: "12px 12px 10px 10px",
          background: "linear-gradient(180deg, #ffd34d 0%, #f0aa1f 100%)",
          border: "2px solid rgba(0,0,0,0.08)",
          zIndex: "2"
        });

        const collar = createPart({
          left: "11px",
          top: "2px",
          width: "13px",
          height: "8px",
          borderRadius: "0 0 8px 8px",
          background: "rgba(255,255,255,0.75)"
        });
        body.appendChild(collar);

        const armLeft = createPart({
          left: "26px",
          top: "18px",
          width: "8px",
          height: "42px",
          borderRadius: "999px",
          background: "linear-gradient(180deg, #ffd7b0 0%, #f3bf8d 100%)",
          transformOrigin: "bottom center",
          zIndex: "1"
        });

        const armRight = createPart({
          left: "62px",
          top: "18px",
          width: "8px",
          height: "42px",
          borderRadius: "999px",
          background: "linear-gradient(180deg, #ffd7b0 0%, #f3bf8d 100%)",
          transformOrigin: "bottom center",
          zIndex: "1"
        });

        const legLeft = createPart({
          left: "36px",
          top: "80px",
          width: "9px",
          height: "32px",
          borderRadius: "999px",
          background: "linear-gradient(180deg, #355fae 0%, #2a4b88 100%)",
          transformOrigin: "top center",
          zIndex: "0"
        });

        const legRight = createPart({
          left: "49px",
          top: "80px",
          width: "9px",
          height: "32px",
          borderRadius: "999px",
          background: "linear-gradient(180deg, #355fae 0%, #2a4b88 100%)",
          transformOrigin: "top center",
          zIndex: "0"
        });

        const footLeft = createPart({
          left: "-3px",
          bottom: "-2px",
          width: "14px",
          height: "8px",
          borderRadius: "8px",
          background: "#4f3b2f"
        });

        const footRight = createPart({
          left: "-2px",
          bottom: "-2px",
          width: "14px",
          height: "8px",
          borderRadius: "8px",
          background: "#4f3b2f"
        });

        legLeft.appendChild(footLeft);
        legRight.appendChild(footRight);

        const bucket = createPart({
          left: "36px",
          top: "0px",
          width: "24px",
          height: "24px",
          borderRadius: "0 0 8px 8px",
          background: "linear-gradient(180deg, #6b7e8f 0%, #485866 100%)",
          border: "2px solid rgba(255,255,255,0.22)",
          transformOrigin: "bottom center",
          zIndex: "5",
          boxShadow: "0 3px 6px rgba(0,0,0,0.12)"
        });

        const bucketRim = createPart({
          left: "-2px",
          top: "-3px",
          width: "24px",
          height: "6px",
          borderRadius: "999px",
          background: "#92a2af",
          border: "1px solid rgba(0,0,0,0.08)"
        });

        const bucketHandle = createPart({
          left: "4px",
          top: "-10px",
          width: "12px",
          height: "11px",
          border: "2px solid #b9c6cf",
          borderBottom: "none",
          borderRadius: "12px 12px 0 0",
          background: "transparent"
        });

        const bucketWater = createPart({
          left: "3px",
          top: "4px",
          width: "14px",
          height: "8px",
          borderRadius: "0 0 6px 6px",
          background: "linear-gradient(180deg, #80d8ff 0%, #37a8ff 100%)",
          opacity: "0.9"
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
        if (!playerCharacter || !playerShadow) {
          return;
        }

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
        if (!playerWrap) {
          return;
        }

        playerWrap.style.left = `${state.player.x}px`;
        playerWrap.style.top = `${state.player.y}px`;

        state.bucketBox = {
          x: state.player.x + 39,
          y: state.player.y + 12,
          width: 30,
          height: 16
        };
      }

      function createDrop() {
        const size = 26;
        const el = document.createElement("div");
        el.textContent = "💧";
        el.style.position = "absolute";
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.fontSize = "24px";
        el.style.lineHeight = "1";
        el.style.pointerEvents = "none";
        el.style.userSelect = "none";
        el.style.zIndex = "3";
        el.style.filter = "drop-shadow(0 4px 8px rgba(0, 110, 255, 0.18))";

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