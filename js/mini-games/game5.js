//js/mini-games/game5.js
window.MiniGameShared.register("game5", (config = {}) => {
  const duration = Number(config.duration) || 9;
  const bonusPerCatch = Number(config.bonusPerCatch) || 1;
  const ingredientCount = Number(config.enemyCount) || 10;
  const dangerChance = Number(config.dangerChance) || 0.3;

  return {
    id: "game5",
    title: "ตำน้ำพริกละลายแม่น้ำ",
    description: `ตำเฉพาะพริกให้ได้มากที่สุดภายใน ${duration} วินาที ระวังของอันตรายให้ดี`,
    overlayTitle: "มินิเกม: ตำผิด = ระเบิด",
    overlayDescription:
      "มองจากในครกโดยตรง พริกและระเบิดจะสุ่มโผล่มาตามจุดต่าง ๆ ในครก คลิกที่สิ่งที่โผล่มา แล้วสากจะตำลงไปตรงนั้นทันที",

    themeClass: "theme-mortar",
    duration,
    bonusPerCatch,

    finishText(score) {
      return `จบมินิเกม! ตำพริกได้ ${score} ครั้ง รับโบนัส +${score} คะแนน`;
    },

    createController(context) {
      const { areaEl, playerEl, setScore, clearAreaInlineStyles, utils } = context;
      const { randomBetween } = utils;

      let score = 0;
      let animationId = null;
      let started = false;
      let messageTimeoutId = null;
      let ambientPhase = 0;

      const state = {
        width: 0,
        height: 0,
        ingredients: [],
        mortar: {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          centerX: 0,
          centerY: 0
        }
      };

      let mortarShell = null;
      let mortarInner = null;
      let mortarShadow = null;
      let pestle = null;
      let splashFx = null;
      let messageEl = null;
      let explosionFlash = null;
      let labelEl = null;

      function getAreaSize() {
        return {
          width: areaEl.clientWidth || 680,
          height: areaEl.clientHeight || 390
        };
      }

      function createPart(styles = {}) {
        const el = document.createElement("div");
        el.style.position = "absolute";
        el.style.boxSizing = "border-box";
        Object.assign(el.style, styles);
        return el;
      }

      function applyAreaStyle() {
        clearAreaInlineStyles();
        areaEl.style.position = "relative";
        areaEl.style.overflow = "hidden";
        areaEl.style.background =
          "linear-gradient(180deg, #eef8ff 0%, #d8f1ff 26%, #c8ecce 62%, #9bd96c 100%)";
        areaEl.style.border = "3px solid rgba(122, 196, 191, 0.5)";
        areaEl.style.boxShadow = "inset 0 10px 30px rgba(255,255,255,0.24)";
      }

      function updateMortarGeometry() {
        state.mortar.width = Math.max(560, state.width * 0.86);
        state.mortar.height = Math.max(300, state.height * 0.74);
        state.mortar.x = (state.width - state.mortar.width) / 2;
        state.mortar.y = (state.height - state.mortar.height) / 2 + 8;
        state.mortar.centerX = state.mortar.x + state.mortar.width / 2;
        state.mortar.centerY = state.mortar.y + state.mortar.height / 2;
      }

      function createMortarView() {
        updateMortarGeometry();

        mortarShadow = createPart({
          left: `${state.mortar.x + 18}px`,
          top: `${state.mortar.y + 18}px`,
          width: `${state.mortar.width}px`,
          height: `${state.mortar.height}px`,
          borderRadius: "50%",
          background: "rgba(83, 56, 26, 0.18)",
          filter: "blur(18px)",
          zIndex: "1"
        });

        mortarShell = createPart({
          left: `${state.mortar.x}px`,
          top: `${state.mortar.y}px`,
          width: `${state.mortar.width}px`,
          height: `${state.mortar.height}px`,
          borderRadius: "50%",
          background: "linear-gradient(180deg, #c68950 0%, #9a5f2d 56%, #7d461f 100%)",
          border: "8px solid rgba(109, 64, 30, 0.36)",
          boxShadow:
            "inset 0 14px 26px rgba(255,255,255,0.12), inset 0 -20px 30px rgba(62,31,12,0.18)",
          zIndex: "2"
        });

        mortarInner = createPart({
          left: `${state.mortar.x + 24}px`,
          top: `${state.mortar.y + 24}px`,
          width: `${state.mortar.width - 48}px`,
          height: `${state.mortar.height - 48}px`,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 50% 38%, #5b321b 0%, #3d2012 48%, #2a140b 100%)",
          boxShadow:
            "inset 0 18px 24px rgba(255,255,255,0.08), inset 0 -10px 18px rgba(0,0,0,0.22)",
          overflow: "hidden",
          zIndex: "3"
        });

        const innerGlow = createPart({
          left: "12%",
          top: "9%",
          width: "76%",
          height: "18%",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)"
        });
        mortarInner.appendChild(innerGlow);

        labelEl = createPart({
          left: `${state.mortar.x + state.mortar.width - 126}px`,
          top: `${state.mortar.y + state.mortar.height * 0.38}px`,
          width: "96px",
          height: "50px",
          borderRadius: "12px",
          background: "linear-gradient(180deg, #ffcb73 0%, #e39a2f 100%)",
          color: "#5c2600",
          fontSize: "20px",
          fontWeight: "900",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          letterSpacing: "0.4px",
          transform: "rotate(-4deg)",
          zIndex: "5",
          boxShadow: "0 6px 12px rgba(0,0,0,0.14)"
        });
        labelEl.textContent = "BLAST!";

        pestle = createPart({
          left: `${state.mortar.centerX + 54}px`,
          top: `${state.mortar.y + 42}px`,
          width: "44px",
          height: `${Math.max(160, state.mortar.height * 0.56)}px`,
          borderRadius: "22px",
          background: "linear-gradient(180deg, #dbdbdb 0%, #b8b8b8 48%, #8a8a8a 100%)",
          border: "2px solid rgba(80,80,80,0.16)",
          transform: "rotate(22deg)",
          transformOrigin: `center ${Math.max(118, state.mortar.height * 0.4)}px`,
          boxShadow: "0 7px 14px rgba(0,0,0,0.16)",
          zIndex: "8",
          pointerEvents: "none"
        });

        const pestleTip = createPart({
          left: "4px",
          bottom: "0",
          width: "34px",
          height: "26px",
          borderRadius: "16px",
          background: "linear-gradient(180deg, #bababa 0%, #7d7d7d 100%)"
        });
        pestle.appendChild(pestleTip);

        splashFx = createPart({
          left: "0",
          top: "0",
          width: "110px",
          height: "110px",
          opacity: "0",
          transform: "translate(-50%, -50%) scale(0.72)",
          transition: "transform 120ms ease, opacity 120ms ease",
          zIndex: "7",
          pointerEvents: "none"
        });

        [0, 1, 2, 3, 4].forEach((i) => {
          const dot = createPart({
            left: `${24 + (i % 3) * 18}px`,
            top: `${20 + Math.floor(i / 2) * 16}px`,
            width: `${10 + (i % 2) * 5}px`,
            height: `${10 + (i % 2) * 5}px`,
            borderRadius: "50%",
            background: i % 2 === 0 ? "#d33628" : "#ff6b44"
          });
          splashFx.appendChild(dot);
        });

        messageEl = createPart({
          left: "50%",
          top: "14px",
          transform: "translateX(-50%)",
          minWidth: "230px",
          maxWidth: "82%",
          padding: "10px 16px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.9)",
          color: "#6a2c00",
          fontSize: "14px",
          fontWeight: "800",
          textAlign: "center",
          zIndex: "10",
          opacity: "0",
          transition: "opacity 160ms ease"
        });
        messageEl.textContent = "คลิกเฉพาะพริก 🌶️ ห้ามโดนระเบิด 💣";

        explosionFlash = createPart({
          inset: "0",
          background:
            "radial-gradient(circle at center, rgba(255,120,80,0.30) 0%, rgba(255,30,0,0.22) 35%, rgba(255,0,0,0) 70%)",
          opacity: "0",
          zIndex: "9",
          pointerEvents: "none",
          transition: "opacity 140ms ease"
        });

        areaEl.appendChild(mortarShadow);
        areaEl.appendChild(mortarShell);
        areaEl.appendChild(mortarInner);
        areaEl.appendChild(labelEl);
        areaEl.appendChild(splashFx);
        areaEl.appendChild(pestle);
        areaEl.appendChild(messageEl);
        areaEl.appendChild(explosionFlash);
      }

      function showMessage(text, color = "#6a2c00", bg = "rgba(255,255,255,0.88)") {
        if (!messageEl) return;

        if (messageTimeoutId) {
          clearTimeout(messageTimeoutId);
          messageTimeoutId = null;
        }

        messageEl.textContent = text;
        messageEl.style.color = color;
        messageEl.style.background = bg;
        messageEl.style.opacity = "1";

        messageTimeoutId = setTimeout(() => {
          if (started) hideMessage();
        }, 760);
      }

      function hideMessage() {
        if (!messageEl) return;
        messageEl.style.opacity = "0";
      }

      function animatePestleTo(targetX, targetY, isDanger = false) {
        if (!pestle) return;

        const originX = state.mortar.centerX + 60;
        const originY = state.mortar.y + 54;
        const dx = targetX - originX;
        const dy = targetY - originY;

        const translateX = Math.max(-140, Math.min(60, dx * 0.62));
        const translateY = Math.max(-10, Math.min(90, dy * 0.54));
        const rotateA = 22;
        const rotateB = 8 + translateX * 0.06;

        pestle.animate(
          [
            { transform: `rotate(${rotateA}deg) translate(0px, 0px)` },
            { transform: `rotate(${rotateB}deg) translate(${translateX}px, ${translateY}px)` },
            { transform: `rotate(${rotateA}deg) translate(0px, 0px)` }
          ],
          {
            duration: isDanger ? 220 : 180,
            easing: "ease-out"
          }
        );
      }

      function triggerPoundEffectAt(targetX, targetY, isDanger = false) {
        animatePestleTo(targetX, targetY, isDanger);

        if (splashFx) {
          splashFx.style.left = `${targetX}px`;
          splashFx.style.top = `${targetY}px`;
          splashFx.style.opacity = "1";
          splashFx.style.transform = "translate(-50%, -50%) scale(1.08)";

          setTimeout(() => {
            if (!splashFx) return;
            splashFx.style.opacity = "0";
            splashFx.style.transform = "translate(-50%, -50%) scale(0.72)";
          }, 120);
        }

        if (mortarShell) {
          mortarShell.animate(
            [
              { transform: "translateX(0px)" },
              { transform: "translateX(-4px)" },
              { transform: "translateX(4px)" },
              { transform: "translateX(0px)" }
            ],
            {
              duration: isDanger ? 220 : 120,
              easing: "ease-out"
            }
          );
        }

        if (mortarInner) {
          mortarInner.animate(
            [
              { transform: "translateX(0px)" },
              { transform: "translateX(-3px)" },
              { transform: "translateX(3px)" },
              { transform: "translateX(0px)" }
            ],
            {
              duration: isDanger ? 220 : 120,
              easing: "ease-out"
            }
          );
        }

        if (isDanger && explosionFlash) {
          explosionFlash.style.opacity = "1";
          setTimeout(() => {
            if (!explosionFlash) return;
            explosionFlash.style.opacity = "0";
          }, 180);
        }
      }

      function createIngredientVisual(kind) {
        const wrap = createPart({
          inset: "0"
        });

        if (kind === "good") {
          const pepper1 = createPart({
            left: "4px",
            top: "12px",
            width: "22px",
            height: "40px",
            borderRadius: "16px 16px 14px 14px",
            background: "linear-gradient(180deg, #ff745d 0%, #d4211d 100%)",
            transform: "rotate(-18deg)",
            boxShadow: "inset -2px -4px 0 rgba(110,0,0,0.18)"
          });

          const pepper2 = createPart({
            left: "18px",
            top: "6px",
            width: "22px",
            height: "42px",
            borderRadius: "16px 16px 14px 14px",
            background: "linear-gradient(180deg, #ff7d64 0%, #d81f1c 100%)",
            transform: "rotate(14deg)",
            boxShadow: "inset -2px -4px 0 rgba(110,0,0,0.18)"
          });

          const stem1 = createPart({
            left: "10px",
            top: "8px",
            width: "8px",
            height: "8px",
            borderRadius: "0 0 8px 8px",
            borderTop: "3px solid #4e9d31",
            transform: "rotate(-30deg)"
          });

          const stem2 = createPart({
            left: "24px",
            top: "2px",
            width: "8px",
            height: "8px",
            borderRadius: "0 0 8px 8px",
            borderTop: "3px solid #4e9d31",
            transform: "rotate(18deg)"
          });

          wrap.appendChild(pepper1);
          wrap.appendChild(pepper2);
          wrap.appendChild(stem1);
          wrap.appendChild(stem2);
        } else {
          const bomb = createPart({
            left: "8px",
            top: "8px",
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 30%, #4f5e70 0%, #1c2734 68%, #0f1720 100%)",
            boxShadow: "inset 3px 3px 6px rgba(255,255,255,0.10)"
          });

          const fuse = createPart({
            left: "30px",
            top: "2px",
            width: "10px",
            height: "14px",
            borderRight: "3px solid #7b4b23",
            borderTop: "3px solid #7b4b23",
            borderRadius: "0 8px 0 0",
            transform: "rotate(20deg)"
          });

          const spark1 = createPart({
            left: "37px",
            top: "0px",
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: "#ffc433",
            boxShadow: "0 0 8px rgba(255,193,51,0.8)"
          });

          const spark2 = createPart({
            left: "32px",
            top: "8px",
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: "#ff7a21"
          });

          wrap.appendChild(bomb);
          wrap.appendChild(fuse);
          wrap.appendChild(spark1);
          wrap.appendChild(spark2);
        }

        return wrap;
      }

      function randomPointInMortar() {
        const cx = state.mortar.centerX;
        const cy = state.mortar.centerY;
        const rx = (state.mortar.width - 120) / 2;
        const ry = (state.mortar.height - 110) / 2;

        let px = cx;
        let py = cy;
        let ok = false;

        for (let i = 0; i < 20; i += 1) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.sqrt(Math.random());
          const dx = Math.cos(angle) * rx * radius;
          const dy = Math.sin(angle) * ry * radius;

          px = cx + dx;
          py = cy + dy;

          const nx = (px - cx) / rx;
          const ny = (py - cy) / ry;
          if (nx * nx + ny * ny <= 0.92) {
            ok = true;
            break;
          }
        }

        if (!ok) {
          px = cx;
          py = cy;
        }

        return { x: px, y: py };
      }

      function createIngredient(kind = "good") {
        const isDanger = kind === "danger";
        const size = isDanger ? 50 : 46;
        const point = randomPointInMortar();

        const el = document.createElement("button");
        el.type = "button";
        el.setAttribute("aria-label", isDanger ? "danger ingredient" : "good ingredient");
        el.style.position = "absolute";
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.border = "none";
        el.style.background = "transparent";
        el.style.cursor = "pointer";
        el.style.padding = "0";
        el.style.margin = "0";
        el.style.zIndex = "6";
        el.style.userSelect = "none";
        el.style.touchAction = "manipulation";
        el.style.filter = isDanger
          ? "drop-shadow(0 4px 8px rgba(255,80,30,0.22))"
          : "drop-shadow(0 4px 8px rgba(150,40,40,0.18))";

        const icon = createIngredientVisual(kind);
        icon.style.width = "100%";
        icon.style.height = "100%";
        icon.style.transform = `rotate(${randomBetween(-14, 14)}deg)`;

        el.appendChild(icon);
        areaEl.appendChild(el);

        const ingredient = {
          el,
          icon,
          kind,
          alive: true,
          bornAt: performance.now(),
          ttl: randomBetween(1800, 3200),
          pulseOffset: randomBetween(0, Math.PI * 2),
          x: point.x - size / 2,
          y: point.y - size / 2,
          size,
          vx: randomBetween(-0.22, 0.22),
          vy: randomBetween(-0.18, 0.18),
          nextRetargetAt: performance.now() + randomBetween(900, 1600),
          nextHideAt: performance.now() + randomBetween(1400, 2400),
          hiddenUntil: 0,
          visible: true
        };

        renderIngredient(ingredient);

        el.addEventListener("pointerdown", (event) => {
          event.preventDefault();
          event.stopPropagation();

          if (!ingredient.alive || !started || !ingredient.visible) return;

          const centerX = ingredient.x + ingredient.size / 2;
          const centerY = ingredient.y + ingredient.size / 2;

          if (ingredient.kind === "good") {
            score += bonusPerCatch;
            setScore(score);
            showMessage("ดีมาก! ตำพริกถูก 🌶️", "#0d6b2f", "rgba(232,255,239,0.92)");
            triggerPoundEffectAt(centerX, centerY, false);
          } else {
            score = Math.max(0, score - 2);
            setScore(score);
            showMessage("ระวัง! ตำผิดจนระเบิด 💣", "#8d1200", "rgba(255,232,226,0.94)");
            triggerPoundEffectAt(centerX, centerY, true);
          }

          removeIngredient(ingredient, true);
        });

        state.ingredients.push(ingredient);
      }

      function renderIngredient(ingredient) {
        ingredient.el.style.left = `${ingredient.x}px`;
        ingredient.el.style.top = `${ingredient.y}px`;
        ingredient.el.style.opacity = ingredient.visible ? "1" : "0";
        ingredient.el.style.pointerEvents = ingredient.visible ? "auto" : "none";
      }

      function removeIngredient(ingredient, animate = false) {
        if (!ingredient || !ingredient.alive) return;
        ingredient.alive = false;

        if (animate) {
          ingredient.el.animate(
            [
              { transform: "scale(1)", opacity: 1 },
              { transform: "scale(1.22)", opacity: 0.92 },
              { transform: "scale(0.4)", opacity: 0 }
            ],
            {
              duration: 180,
              easing: "ease-out"
            }
          );
        }

        setTimeout(() => {
          if (ingredient.el && ingredient.el.parentNode) {
            ingredient.el.parentNode.removeChild(ingredient.el);
          }
        }, animate ? 170 : 0);
      }

      function cleanupIngredients() {
        state.ingredients = state.ingredients.filter((item) => item.alive);
      }

      function maintainIngredientPopulation(now) {
        cleanupIngredients();

        while (started && state.ingredients.length < ingredientCount) {
          const kind = Math.random() < dangerChance ? "danger" : "good";
          createIngredient(kind);
        }

        state.ingredients.forEach((item) => {
          if (!item.alive) return;

          if (now >= item.nextRetargetAt) {
            item.vx = randomBetween(-0.28, 0.28);
            item.vy = randomBetween(-0.22, 0.22);
            item.nextRetargetAt = now + randomBetween(900, 1700);
          }

          if (item.visible && now >= item.nextHideAt) {
            item.visible = false;
            item.hiddenUntil = now + randomBetween(300, 700);
            item.nextHideAt = now + randomBetween(1500, 2600);
          }

          if (!item.visible && now >= item.hiddenUntil) {
            item.visible = true;
          }
        });
      }

      function keepInsideMortar(item) {
        const cx = state.mortar.centerX;
        const cy = state.mortar.centerY;
        const rx = (state.mortar.width - 120) / 2;
        const ry = (state.mortar.height - 110) / 2;

        const centerX = item.x + item.size / 2;
        const centerY = item.y + item.size / 2;

        const nx = (centerX - cx) / rx;
        const ny = (centerY - cy) / ry;
        const d = nx * nx + ny * ny;

        if (d > 0.9) {
          item.vx *= -1;
          item.vy *= -1;
          item.x -= item.vx * 2;
          item.y -= item.vy * 2;
        }
      }

      function updateIngredients(now) {
        state.ingredients.forEach((item) => {
          if (!item.alive) return;

          const age = now - item.bornAt;
          const pulse = Math.sin(age * 0.008 + item.pulseOffset) * 2.2;

          item.x += item.vx;
          item.y += item.vy;

          keepInsideMortar(item);

          item.icon.style.transform =
            `translateY(${pulse}px) rotate(${Math.sin(age * 0.004 + item.pulseOffset) * 7}deg)`;
          item.icon.style.opacity =
            age > item.ttl - 320
              ? `${Math.max(0.34, 1 - (age - (item.ttl - 320)) / 500)}`
              : "1";

          renderIngredient(item);

          if (age >= item.ttl) {
            removeIngredient(item, false);
          }
        });

        cleanupIngredients();
        maintainIngredientPopulation(now);
      }

      function updateAmbient(now) {
        ambientPhase += 0.02;

        if (pestle) {
          pestle.style.transform = `rotate(${22 + Math.sin(ambientPhase) * 1.8}deg)`;
        }

        if (mortarShell) {
          mortarShell.style.boxShadow =
            `inset 0 14px 26px rgba(255,255,255,0.12), inset 0 -20px 30px rgba(62,31,12,0.18), 0 0 ${8 + Math.sin(now * 0.002) * 2}px rgba(255,255,255,0.02)`;
        }
      }

      function loop(now) {
        const current = now || performance.now();
        updateAmbient(current);
        updateIngredients(current);
        animationId = requestAnimationFrame(loop);
      }

      return {
        setup() {
          const area = getAreaSize();
          state.width = area.width;
          state.height = area.height;

          applyAreaStyle();
          createMortarView();

          playerEl.style.display = "none";
          setScore(0);
          showMessage("คลิกเฉพาะพริก 🌶️ ห้ามโดนระเบิด 💣");
        },

        start() {
          started = true;
          hideMessage();

          cleanupIngredients();
          while (state.ingredients.length < ingredientCount) {
            const kind = Math.random() < dangerChance ? "danger" : "good";
            createIngredient(kind);
          }

          if (animationId) {
            cancelAnimationFrame(animationId);
          }
          loop(performance.now());
        },

        stop() {
          started = false;

          if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
          }

          if (messageTimeoutId) {
            clearTimeout(messageTimeoutId);
            messageTimeoutId = null;
          }

          state.ingredients.forEach((item) => {
            if (item.el && item.el.parentNode) {
              item.el.parentNode.removeChild(item.el);
            }
          });
          state.ingredients = [];

          [
            mortarShadow,
            mortarShell,
            mortarInner,
            labelEl,
            splashFx,
            pestle,
            messageEl,
            explosionFlash
          ].forEach((el) => {
            if (el && el.parentNode) {
              el.parentNode.removeChild(el);
            }
          });

          mortarShadow = null;
          mortarShell = null;
          mortarInner = null;
          labelEl = null;
          splashFx = null;
          pestle = null;
          messageEl = null;
          explosionFlash = null;
        },

        onKeyDown(key) {
          if (key === " " || key === "enter") {
            showMessage(
              "ตอนนี้พริกกับระเบิดจะสุ่ม ขยับ และหายโผล่เองในครก",
              "#5a2c00",
              "rgba(255,255,255,0.92)"
            );
          }
        },

        onKeyUp() {},

        getScore() {
          return score;
        }
      };
    }
  };
});