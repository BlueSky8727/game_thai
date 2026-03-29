//js/mini-games/game4.js
window.MiniGameShared.register("game4", (config = {}) => {
  const duration = Number(config.duration) || 20;
  const bonusPerCatch = Number(config.bonusPerCatch) || 1;
  const fallSpeed = Number(config.enemySpeedLimit) || 3.0;
  const waterCount = Number(config.enemyCount) || 7;

  return {
    id: "game4",
    title: "รองน้ำฝน",
    description: `ขยับซ้ายและขวาเพื่อเอาถังไปรับน้ำฝนให้ได้มากที่สุดภายใน ${duration} วินาที`,
    overlayTitle: "มินิเกม: รองน้ำฝน",
    overlayDescription:
      "ใช้ปุ่ม A D หรือ ← → ขยับเด็กถือถังไปทางซ้ายและขวา เพื่อรองน้ำที่ตกลงมาจากด้านบนให้ได้มากที่สุด",

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
          width: 92,
          height: 96,
          speed: 5.6
        },
        bucketBox: {
          x: 0,
          y: 0,
          width: 46,
          height: 22
        },
        drops: []
      };

      let playerWrap = null;

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
          "linear-gradient(180deg, #dff3ff 0%, #ccecff 22%, #9fdd8a 65%, #65b64a 100%)";
        areaEl.style.border = "3px solid rgba(132, 191, 255, 0.55)";
        areaEl.style.boxShadow = "inset 0 10px 30px rgba(255,255,255,0.28)";
      }

      function createPlayer() {
        playerEl.style.display = "none";

        playerWrap = document.createElement("div");
        playerWrap.style.position = "absolute";
        playerWrap.style.width = `${state.player.width}px`;
        playerWrap.style.height = `${state.player.height}px`;
        playerWrap.style.display = "flex";
        playerWrap.style.alignItems = "center";
        playerWrap.style.justifyContent = "center";
        playerWrap.style.userSelect = "none";
        playerWrap.style.pointerEvents = "none";
        playerWrap.style.zIndex = "5";
        playerWrap.style.filter = "drop-shadow(0 8px 12px rgba(0,0,0,0.18))";

        const inner = document.createElement("div");
        inner.style.position = "relative";
        inner.style.width = "100%";
        inner.style.height = "100%";

        const boy = document.createElement("div");
        boy.textContent = "👦";
        boy.style.position = "absolute";
        boy.style.left = "50%";
        boy.style.top = "8px";
        boy.style.transform = "translateX(-50%)";
        boy.style.fontSize = "40px";
        boy.style.lineHeight = "1";

        const bucket = document.createElement("div");
        bucket.textContent = "🪣";
        bucket.style.position = "absolute";
        bucket.style.left = "50%";
        bucket.style.bottom = "6px";
        bucket.style.transform = "translateX(-50%)";
        bucket.style.fontSize = "40px";
        bucket.style.lineHeight = "1";

        inner.appendChild(boy);
        inner.appendChild(bucket);
        playerWrap.appendChild(inner);
        areaEl.appendChild(playerWrap);
      }

      function updatePlayerPosition() {
        playerWrap.style.left = `${state.player.x}px`;
        playerWrap.style.top = `${state.player.y}px`;

        state.bucketBox = {
          x: state.player.x + 23,
          y: state.player.y + 56,
          width: 46,
          height: 20
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
          speed: 0
        };

        resetDrop(drop, true);
        state.drops.push(drop);
      }

      function resetDrop(drop, initial = false) {
        drop.x = randomBetween(6, Math.max(7, state.width - drop.size - 6));
        drop.y = initial
          ? randomBetween(-state.height, -drop.size)
          : randomBetween(-120, -24);
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
        if (pressed.left) {
          state.player.x -= state.player.speed;
        }
        if (pressed.right) {
          state.player.x += state.player.speed;
        }

        state.player.x = clamp(
          state.player.x,
          0,
          Math.max(0, state.width - state.player.width)
        );

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
          createPlayer();

          state.player.x = (state.width - state.player.width) / 2;
          state.player.y = state.height - state.player.height - 8;
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

          if (playerWrap && playerWrap.parentNode) {
            playerWrap.parentNode.removeChild(playerWrap);
          }
          playerWrap = null;
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