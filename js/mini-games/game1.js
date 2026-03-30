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
         GAME 1 : ขี่ช้างจับตั๊กแตน
         เวอร์ชันอัปเกรดฉาก + ตัวละคร + เอฟเฟกต์
      ========================= */

      .theme-field {
        position: relative;
        overflow: hidden;
        background:
          radial-gradient(circle at 18% 14%, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 12%, transparent 26%),
          radial-gradient(circle at 84% 10%, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.06) 10%, transparent 24%),
          linear-gradient(to bottom, #b8e4ff 0%, #daf2ff 16%, #b7e39b 16%, #88cf68 46%, #63b44e 74%, #4a943d 100%);
      }

      .theme-field::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        background:
          linear-gradient(to top, rgba(15, 45, 12, 0.10), transparent 28%),
          radial-gradient(circle at 50% 0%, rgba(255, 243, 184, 0.22), transparent 28%),
          repeating-linear-gradient(
            90deg,
            rgba(255,255,255,0.00) 0px,
            rgba(255,255,255,0.00) 24px,
            rgba(255,255,255,0.03) 25px,
            rgba(255,255,255,0.00) 26px
          ),
          repeating-linear-gradient(
            0deg,
            rgba(255,255,255,0.00) 0px,
            rgba(255,255,255,0.00) 34px,
            rgba(100,150,80,0.05) 35px,
            rgba(255,255,255,0.00) 36px
          );
        opacity: 0.96;
      }

      .theme-field::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        background:
          radial-gradient(circle at 50% 115%, rgba(46, 108, 36, 0.22), transparent 36%);
        mix-blend-mode: multiply;
      }

      /* =========================
         ฉากหลัง
      ========================= */
      .theme-field .field-sun {
        position: absolute;
        left: 72px;
        top: 42px;
        width: 68px;
        height: 68px;
        border-radius: 50%;
        z-index: 0;
        pointer-events: none;
        background: radial-gradient(circle, #fff9c2 0%, #ffd96b 68%, #ffc84c 100%);
        box-shadow:
          0 0 0 8px rgba(255, 220, 102, 0.14),
          0 0 34px rgba(255, 216, 98, 0.36);
      }

      .theme-field .field-cloud {
        position: absolute;
        z-index: 0;
        pointer-events: none;
        border-radius: 999px;
        background: rgba(255,255,255,0.72);
        filter: blur(0.4px);
        box-shadow:
          18px -8px 0 8px rgba(255,255,255,0.72),
          42px 0 0 2px rgba(255,255,255,0.62);
        animation: game1CloudFloat 6.8s ease-in-out infinite;
      }

      .theme-field .field-cloud.cloud-a {
        left: 120px;
        top: 36px;
        width: 78px;
        height: 26px;
      }

      .theme-field .field-cloud.cloud-b {
        right: 138px;
        top: 62px;
        width: 70px;
        height: 24px;
        animation-delay: 1s;
      }

      .theme-field .field-hill-back {
        position: absolute;
        left: -6%;
        right: -6%;
        bottom: 28%;
        height: 20%;
        z-index: 0;
        pointer-events: none;
        border-radius: 50% 50% 0 0 / 100% 100% 0 0;
        background:
          linear-gradient(180deg, rgba(115, 175, 86, 0.50) 0%, rgba(89, 144, 64, 0.68) 100%);
        opacity: 0.62;
      }

      .theme-field .field-tree-line {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 25%;
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

      .theme-field .field-rice-layer {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 40%;
        pointer-events: none;
        z-index: 0;
        background:
          linear-gradient(to top, rgba(53, 120, 44, 0.30), transparent 58%),
          radial-gradient(circle at 8% 100%, #72c556 0 14%, transparent 15%),
          radial-gradient(circle at 18% 100%, #6bbc52 0 13%, transparent 14%),
          radial-gradient(circle at 29% 100%, #79ca5d 0 14%, transparent 15%),
          radial-gradient(circle at 41% 100%, #67b34d 0 13%, transparent 14%),
          radial-gradient(circle at 54% 100%, #76c95b 0 14%, transparent 15%),
          radial-gradient(circle at 68% 100%, #69b951 0 13%, transparent 14%),
          radial-gradient(circle at 82% 100%, #73c85a 0 14%, transparent 15%),
          radial-gradient(circle at 95% 100%, #64b04a 0 13%, transparent 14%);
        opacity: 0.98;
      }

      .theme-field .field-grass-mid {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 8%;
        height: 18%;
        pointer-events: none;
        z-index: 1;
        background:
          repeating-linear-gradient(
            102deg,
            rgba(77, 145, 53, 0.00) 0px,
            rgba(77, 145, 53, 0.00) 12px,
            rgba(128, 198, 84, 0.14) 13px,
            rgba(77, 145, 53, 0.00) 14px
          );
        opacity: 0.92;
      }

      .theme-field .field-grass-front {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 22%;
        pointer-events: none;
        z-index: 2;
        background:
          repeating-linear-gradient(
            100deg,
            rgba(77, 145, 53, 0.00) 0px,
            rgba(77, 145, 53, 0.00) 10px,
            rgba(122, 189, 78, 0.22) 11px,
            rgba(77, 145, 53, 0.00) 12px
          );
      }

      .theme-field .field-wind {
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        background:
          linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.08) 48%, transparent 56%);
        background-size: 220px 100%;
        animation: game1WindMove 5.5s linear infinite;
        opacity: 0.35;
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
        font-size: 44px;
        line-height: 1;
        animation: game1VillagerIdle 1.2s ease-in-out infinite;
      }

      .player.player-villager-net .villager-net {
        position: absolute;
        right: -8px;
        top: -2px;
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

      /* =========================
         ANIMATIONS
      ========================= */
      @keyframes game1CloudFloat {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(5px);
        }
      }

      @keyframes game1WindMove {
        from {
          background-position: -220px 0;
        }
        to {
          background-position: 220px 0;
        }
      }

      @keyframes game1VillagerIdle {
        0%, 100% {
          transform: translate(-50%, -50%) translateY(0px);
        }
        50% {
          transform: translate(-50%, -50%) translateY(-1.5px);
        }
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

    const decorMap = [
      ["field-sun"],
      ["field-cloud cloud-a"],
      ["field-cloud cloud-b"],
      ["field-hill-back"],
      ["field-tree-line"],
      ["field-rice-layer"],
      ["field-grass-mid"],
      ["field-grass-front"],
      ["field-wind"]
    ];

    decorMap.forEach((classes) => {
      const selector = "." + classes.join(".");
      if (!area.querySelector(selector)) {
        const el = document.createElement("div");
        el.className = classes.join(" ");
        area.appendChild(el);
      }
    });
  }

  function clearSceneDecor(area) {
    if (!area) return;

    area.querySelectorAll(
      ".field-sun, .field-cloud, .field-hill-back, .field-tree-line, .field-rice-layer, .field-grass-mid, .field-grass-front, .field-wind"
    ).forEach((el) => {
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
      const tilt = movingLeft ? -3 : movingRight ? 3 : 0;

      playerElement.style.transform = `scaleX(${scaleX}) translateY(${bob}px) rotate(${tilt}deg)`;
    },

    finishText(score) {
      return `จบมินิเกม! จับตั๊กแตนได้ ${score} ตัว รับโบนัส +${score} คะแนน`;
    }
  };
});