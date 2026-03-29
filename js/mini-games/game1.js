//js/mini-games/game1.js
window.MiniGameShared.register("game1", (config = {}) => {
  const duration = Number(config.duration) || 10;
  const bonusPerCatch = Number(config.bonusPerCatch) || 1;

  function ensureAssets() {
    const styleId = "mini-game1-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      /* =========================
         GAME 1 : ทุ่งหญ้า / ป่า / ทุ่งนา
      ========================= */
      .theme-field {
        position: relative;
        overflow: hidden;
        background:
          radial-gradient(circle at 18% 16%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 12%, transparent 26%),
          radial-gradient(circle at 82% 12%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.05) 10%, transparent 24%),
          linear-gradient(to bottom, #bfe8ff 0%, #dff4ff 18%, #9fd98a 18%, #80c965 48%, #63b44e 72%, #4c973f 100%);
      }

      /* หมอกอ่อน + ลายธรรมชาติ */
      .theme-field::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
          linear-gradient(to top, rgba(20, 60, 18, 0.10), transparent 24%),
          repeating-linear-gradient(
            90deg,
            rgba(255,255,255,0.00) 0px,
            rgba(255,255,255,0.00) 22px,
            rgba(255,255,255,0.035) 23px,
            rgba(255,255,255,0.00) 24px
          ),
          repeating-linear-gradient(
            0deg,
            rgba(255,255,255,0.00) 0px,
            rgba(255,255,255,0.00) 34px,
            rgba(120,170,90,0.05) 35px,
            rgba(255,255,255,0.00) 36px
          );
        opacity: 0.95;
      }

      /* แนวต้นไม้ไกล ๆ */
      .theme-field .field-tree-line {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 26%;
        height: 18%;
        pointer-events: none;
        z-index: 0;
        opacity: 0.48;
        background:
          radial-gradient(circle at 4% 100%, #4b7e39 0 18%, transparent 19%),
          radial-gradient(circle at 11% 100%, #5b8d46 0 16%, transparent 17%),
          radial-gradient(circle at 19% 100%, #4f813d 0 17%, transparent 18%),
          radial-gradient(circle at 28% 100%, #5b8f44 0 18%, transparent 19%),
          radial-gradient(circle at 37% 100%, #4e7d3a 0 16%, transparent 17%),
          radial-gradient(circle at 46% 100%, #5f9249 0 19%, transparent 20%),
          radial-gradient(circle at 56% 100%, #4f803b 0 17%, transparent 18%),
          radial-gradient(circle at 66% 100%, #628f4d 0 18%, transparent 19%),
          radial-gradient(circle at 76% 100%, #507f3c 0 17%, transparent 18%),
          radial-gradient(circle at 87% 100%, #5d8f47 0 16%, transparent 17%),
          radial-gradient(circle at 96% 100%, #4d7a39 0 18%, transparent 19%);
      }

      /* แปลงนา/ลอนหญ้า */
      .theme-field .field-rice-layer {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 38%;
        pointer-events: none;
        z-index: 0;
        background:
          linear-gradient(to top, rgba(53, 120, 44, 0.28), transparent 58%),
          radial-gradient(circle at 8% 100%, #72c556 0 14%, transparent 15%),
          radial-gradient(circle at 18% 100%, #6bbc52 0 13%, transparent 14%),
          radial-gradient(circle at 29% 100%, #79ca5d 0 14%, transparent 15%),
          radial-gradient(circle at 41% 100%, #67b34d 0 13%, transparent 14%),
          radial-gradient(circle at 54% 100%, #76c95b 0 14%, transparent 15%),
          radial-gradient(circle at 68% 100%, #69b951 0 13%, transparent 14%),
          radial-gradient(circle at 82% 100%, #73c85a 0 14%, transparent 15%),
          radial-gradient(circle at 95% 100%, #64b04a 0 13%, transparent 14%);
        opacity: 0.96;
      }

      /* กอหญ้าหน้าฉาก */
      .theme-field .field-grass-front {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 22%;
        pointer-events: none;
        z-index: 1;
        background:
          repeating-linear-gradient(
            100deg,
            rgba(77, 145, 53, 0.00) 0px,
            rgba(77, 145, 53, 0.00) 10px,
            rgba(122, 189, 78, 0.22) 11px,
            rgba(77, 145, 53, 0.00) 12px
          );
      }

      /* =========================
         PLAYER
      ========================= */
      .player.player-villager-net {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 48px;
        transform-origin: center center;
        user-select: none;
        background: transparent !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        filter: drop-shadow(0 10px 14px rgba(0,0,0,0.16));
      }

      .player.player-villager-net .villager-wrap {
        position: relative;
        width: 100%;
        height: 100%;
        display: block;
      }

      .player.player-villager-net .villager-body {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 42px;
        line-height: 1;
      }

      .player.player-villager-net .villager-net {
        position: absolute;
        right: -8px;
        top: -4px;
        font-size: 26px;
        transform: rotate(-18deg);
        transform-origin: 20% 80%;
        filter: drop-shadow(0 2px 2px rgba(0,0,0,0.18));
        animation: game1NetIdle 0.45s ease-in-out infinite alternate;
      }

      .player.player-villager-net .player-ground-shadow {
        position: absolute;
        left: 50%;
        bottom: 5px;
        width: 58%;
        height: 10px;
        transform: translateX(-50%);
        border-radius: 999px;
        background: rgba(0,0,0,0.16);
        filter: blur(3px);
      }

      .player.player-villager-net.is-catching {
        animation: game1CatchPlayer 0.18s ease-out;
      }

      .player.player-villager-net.is-catching .villager-net {
        animation: game1NetSwing 0.16s linear;
      }

      /* =========================
         ENEMY
      ========================= */
      .enemy.enemy-grasshopper {
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        transform-origin: center;
        background: transparent !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        filter: drop-shadow(0 7px 10px rgba(0,0,0,0.18));
      }

      .enemy.enemy-grasshopper .grasshopper-wrap {
        position: relative;
        width: 100%;
        height: 100%;
      }

      .enemy.enemy-grasshopper .grasshopper-body {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 31px;
        line-height: 1;
        animation:
          game1GrasshopperHop 0.42s ease-in-out infinite alternate,
          game1GrasshopperTilt 0.85s ease-in-out infinite;
        filter: saturate(1.15);
      }

      .enemy.enemy-grasshopper .grasshopper-shadow {
        position: absolute;
        left: 50%;
        bottom: 4px;
        width: 54%;
        height: 8px;
        transform: translateX(-50%);
        border-radius: 999px;
        background: rgba(0,0,0,0.16);
        filter: blur(2px);
      }

      .enemy.enemy-grasshopper.is-caught {
        animation: game1EnemyCaught 0.12s ease-out forwards;
      }

      @keyframes game1NetIdle {
        from {
          transform: rotate(-24deg) translateY(0px);
        }
        to {
          transform: rotate(-12deg) translateY(2px);
        }
      }

      @keyframes game1NetSwing {
        0% {
          transform: rotate(-14deg) scale(1);
        }
        45% {
          transform: rotate(34deg) scale(1.08);
        }
        100% {
          transform: rotate(-6deg) scale(1);
        }
      }

      @keyframes game1CatchPlayer {
        0% {
          transform: scale(1) rotate(0deg);
        }
        40% {
          transform: scale(1.08) rotate(-5deg);
        }
        100% {
          transform: scale(1) rotate(0deg);
        }
      }

      @keyframes game1GrasshopperHop {
        from {
          transform: translate(-50%, -50%) translateY(0px) scale(1);
        }
        to {
          transform: translate(-50%, -50%) translateY(-3px) scale(1.05);
        }
      }

      @keyframes game1GrasshopperTilt {
        0% {
          rotate: -4deg;
        }
        50% {
          rotate: 4deg;
        }
        100% {
          rotate: -4deg;
        }
      }

      @keyframes game1EnemyCaught {
        0% {
          opacity: 1;
          transform: scale(1);
        }
        100% {
          opacity: 0;
          transform: scale(1.35);
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureSceneDecor(area) {
    if (!area) return;

    if (!area.querySelector(".field-tree-line")) {
      const treeLine = document.createElement("div");
      treeLine.className = "field-tree-line";
      area.appendChild(treeLine);
    }

    if (!area.querySelector(".field-rice-layer")) {
      const riceLayer = document.createElement("div");
      riceLayer.className = "field-rice-layer";
      area.appendChild(riceLayer);
    }

    if (!area.querySelector(".field-grass-front")) {
      const grassFront = document.createElement("div");
      grassFront.className = "field-grass-front";
      area.appendChild(grassFront);
    }
  }

  function clearSceneDecor(area) {
    if (!area) return;

    area.querySelectorAll(".field-tree-line, .field-rice-layer, .field-grass-front").forEach((el) => {
      el.remove();
    });
  }

  return {
    id: "game1",
    title: "ขี่ช้างจับตั๊กแตน",
    description: `ควบคุมชาวบ้านเดินจับตั๊กแตนให้ได้มากที่สุดภายใน ${duration} วินาที`,
    overlayTitle: "มินิเกม: ขี่ช้างจับตั๊กแตน",
    overlayDescription: "ใช้ปุ่ม W A S D หรือปุ่มลูกศร เดินไล่จับตั๊กแตนในทุ่งหญ้าให้ได้มากที่สุด",
    themeClass: "theme-field",
    duration,
    bonusPerCatch,

    playerSize: 62,
    playerSpeed: 4.2,
    playerClassName: "player-villager-net",
    playerHtml: `
      <div class="villager-wrap">
        <span class="player-ground-shadow"></span>
        <span class="villager-body">🧑‍🌾</span>
        <span class="villager-net">🪤</span>
      </div>
    `,

    enemyCount: 7,
    enemySize: 46,
    enemySpeedLimit: 2.5,
    enemyRunDistance: 180,
    enemyClassName: "enemy enemy-grasshopper",
    enemyHtml: `
      <div class="grasshopper-wrap">
        <span class="grasshopper-shadow"></span>
        <span class="grasshopper-body">🦗</span>
      </div>
    `,

    catchAnimationClass: "is-catching",
    catchAnimationDuration: 180,
    enemyCaughtClass: "is-caught",
    enemyCaughtDuration: 120,

    ensureAssets,

    onStart(area) {
      ensureSceneDecor(area);
    },

    onStop(area) {
      clearSceneDecor(area);
    },

    getPlayerCatchBox(player) {
      return {
        x: player.x + 10,
        y: player.y + 8,
        size: Math.max(30, player.size - 18)
      };
    },

    customUpdateEnemy(enemy, player, area, helpers) {
      const { clamp, randomBetween, runDistance, speedLimit } = helpers;

      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;

      if (distance < runDistance) {
        enemy.vx += (dx / distance) * 0.22;
        enemy.vy += (dy / distance) * 0.22;
      } else {
        enemy.vx += randomBetween(-0.06, 0.06);
        enemy.vy += randomBetween(-0.06, 0.06);
      }

      enemy.vx = clamp(enemy.vx, -speedLimit, speedLimit);
      enemy.vy = clamp(enemy.vy, -speedLimit, speedLimit);

      enemy.x += enemy.vx;
      enemy.y += enemy.vy;

      if (enemy.x <= 0 || enemy.x >= area.width - enemy.size) {
        enemy.vx *= -1;
        enemy.x = clamp(enemy.x, 0, area.width - enemy.size);
      }

      if (enemy.y <= 0 || enemy.y >= area.height - enemy.size) {
        enemy.vy *= -1;
        enemy.y = clamp(enemy.y, 0, area.height - enemy.size);
      }
    },

    onPlayerMove(playerElement, playerState, pressedKeys) {
      const movingLeft = pressedKeys["a"] || pressedKeys["arrowleft"];
      const movingRight = pressedKeys["d"] || pressedKeys["arrowright"];
      const movingUp = pressedKeys["w"] || pressedKeys["arrowup"];
      const movingDown = pressedKeys["s"] || pressedKeys["arrowdown"];

      let scaleX = 1;
      if (movingLeft) scaleX = -1;
      if (movingRight) scaleX = 1;

      const moving = movingLeft || movingRight || movingUp || movingDown;
      const bob = moving ? Math.sin(Date.now() / 85) * 2.2 : 0;

      playerElement.style.transform = `scaleX(${scaleX}) translateY(${bob}px)`;
    },

    finishText(score) {
      return `จบมินิเกม! จับตั๊กแตนได้ ${score} ตัว รับโบนัส +${score} คะแนน`;
    }
  };
});