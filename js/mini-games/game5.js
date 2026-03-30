//js/mini-games/game5.js
window.MiniGameShared.register("game5", (config = {}) => {
  const duration = Number(config.duration) || 10;
  const bonusPerCatch = Number(config.bonusPerCatch) || 1;
  const ingredientCount = Number(config.enemyCount) || 7;
  const spawnIntervalMs = Number(config.spawnIntervalMs) || 720;
  const dangerChance = Number(config.dangerChance) || 0.3;

  return {
    id: "game5",
    title: "ตำน้ำพริกละลายแม่น้ำ",
    description: `ตำเฉพาะพริกให้ได้มากที่สุดภายใน ${duration} วินาที ระวังของอันตรายให้ดี`,
    overlayTitle: "มินิเกม: ตำผิด = ระเบิด",
    overlayDescription:
      "คลิกหรือแตะเฉพาะพริก 🌶️ ในครกเพื่อทำคะแนน ห้ามกดโดนระเบิด 🧨 หรือ 💣 ไม่งั้นจะโดนหักคะแนน",
    themeClass: "theme-mortar",
    duration,
    bonusPerCatch,

    finishText(score) {
      return `จบมินิเกม! ตำพริกได้ ${score} ครั้ง รับโบนัส +${score} คะแนน`;
    },

    createController(context) {
      const { areaEl, playerEl, setScore, clearAreaInlineStyles, utils } = context;
      const { clamp, randomBetween } = utils;

      let score = 0;
      let animationId = null;
      let spawnTimerId = null;
      let started = false;
      let phase = 0;
      let effectTimer = 0;

      const state = {
        width: 0,
        height: 0,
        ingredients: [],
        mortar: {
          x: 0,
          y: 0,
          width: 240,
          height: 170
        }
      };

      let bgRiver = null;
      let bgTreeLeft = null;
      let bgBushLeft = null;
      let bgBushRight = null;
      let bgCloudLeft = null;
      let bgCloudRight = null;
      let bgTongueCloud = null;

      let mortarWrap = null;
      let mortarBowl = null;
      let mortarRim = null;
      let mortarInside = null;
      let mortarLabel = null;
      let pestle = null;
      let splashFx = null;
      let messageEl = null;
      let explosionFlash = null;

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
          "linear-gradient(180deg, #dff4ff 0%, #c7ecff 22%, #b9eac1 55%, #84cb63 100%)";
        areaEl.style.border = "3px solid rgba(122, 196, 191, 0.5)";
        areaEl.style.boxShadow = "inset 0 10px 30px rgba(255,255,255,0.24)";
      }

      function createBackground() {
        bgRiver = createPart({
          right: "-10px",
          bottom: "18px",
          width: "46%",
          height: "46%",
          background:
            "radial-gradient(circle at 30% 30%, rgba(219,255,214,0.9) 0%, rgba(137,209,105,0.92) 38%, rgba(103,168,80,0.96) 100%)",
          borderRadius: "54% 46% 8% 45%",
          transform: "rotate(-6deg)",
          opacity: "0.92",
          zIndex: "1"
        });

        const riverHighlight1 = createPart({
          left: "12%",
          top: "22%",
          width: "56%",
          height: "12px",
          borderRadius: "999px",
          background: "rgba(214, 255, 170, 0.35)",
          transform: "rotate(-8deg)"
        });

        const riverHighlight2 = createPart({
          left: "20%",
          top: "48%",
          width: "48%",
          height: "10px",
          borderRadius: "999px",
          background: "rgba(214, 255, 170, 0.22)",
          transform: "rotate(-6deg)"
        });

        bgRiver.appendChild(riverHighlight1);
        bgRiver.appendChild(riverHighlight2);

        bgTreeLeft = createPart({
          left: "8px",
          top: "0",
          width: "84px",
          height: "230px",
          zIndex: "1"
        });

        const trunk = createPart({
          left: "0",
          top: "0",
          width: "34px",
          height: "210px",
          background: "linear-gradient(180deg, #8b5b35 0%, #6e4225 100%)",
          borderRadius: "18px 18px 8px 8px"
        });

        const branch1 = createPart({
          left: "24px",
          top: "38px",
          width: "58px",
          height: "14px",
          background: "#6e4225",
          borderRadius: "999px",
          transform: "rotate(-26deg)",
          transformOrigin: "left center"
        });

        const branch2 = createPart({
          left: "18px",
          top: "84px",
          width: "54px",
          height: "12px",
          background: "#6e4225",
          borderRadius: "999px",
          transform: "rotate(24deg)",
          transformOrigin: "left center"
        });

        bgTreeLeft.appendChild(trunk);
        bgTreeLeft.appendChild(branch1);
        bgTreeLeft.appendChild(branch2);

        bgBushLeft = createPart({
          left: "28px",
          bottom: "118px",
          width: "150px",
          height: "78px",
          zIndex: "1"
        });

        ["18px", "48px", "80px", "104px"].forEach((left, index) => {
          const puff = createPart({
            left,
            bottom: `${index % 2 === 0 ? 8 : 18}px`,
            width: `${index % 2 === 0 ? 54 : 64}px`,
            height: `${index % 2 === 0 ? 38 : 46}px`,
            borderRadius: "999px",
            background:
              index % 2 === 0
                ? "linear-gradient(180deg, #c2a36a 0%, #a78343 100%)"
                : "linear-gradient(180deg, #d7bd89 0%, #b08b4b 100%)"
          });
          bgBushLeft.appendChild(puff);
        });

        bgBushRight = createPart({
          right: "56px",
          top: "78px",
          width: "240px",
          height: "120px",
          zIndex: "1"
        });

        [0, 1, 2, 3, 4].forEach((i) => {
          const puff = createPart({
            left: `${i * 36}px`,
            bottom: `${i % 2 === 0 ? 8 : 24}px`,
            width: `${i % 2 === 0 ? 64 : 78}px`,
            height: `${i % 2 === 0 ? 46 : 56}px`,
            borderRadius: "999px",
            background:
              i % 2 === 0
                ? "linear-gradient(180deg, #c19852 0%, #9e7334 100%)"
                : "linear-gradient(180deg, #d3af70 0%, #ad8242 100%)"
          });
          bgBushRight.appendChild(puff);
        });

        bgCloudLeft = createCloud(126, 28, 1.22, false);
        bgCloudRight = createCloud(state.width - 226, 18, 1.08, false);
        bgTongueCloud = createCloud(state.width - 90, 22, 0.72, true);

        areaEl.appendChild(bgRiver);
        areaEl.appendChild(bgTreeLeft);
        areaEl.appendChild(bgBushLeft);
        areaEl.appendChild(bgBushRight);
        areaEl.appendChild(bgCloudLeft);
        areaEl.appendChild(bgCloudRight);
        areaEl.appendChild(bgTongueCloud);
      }

      function createCloud(x, y, scale = 1, funny = false) {
        const cloud = createPart({
          left: `${x}px`,
          top: `${y}px`,
          width: `${120 * scale}px`,
          height: `${58 * scale}px`,
          zIndex: "1",
          opacity: "0.97"
        });

        const p1 = createPart({
          left: `${6 * scale}px`,
          top: `${18 * scale}px`,
          width: `${44 * scale}px`,
          height: `${28 * scale}px`,
          borderRadius: "999px",
          background: "linear-gradient(180deg, #ffffff 0%, #eef8ff 100%)"
        });

        const p2 = createPart({
          left: `${28 * scale}px`,
          top: `${4 * scale}px`,
          width: `${52 * scale}px`,
          height: `${34 * scale}px`,
          borderRadius: "999px",
          background: "linear-gradient(180deg, #ffffff 0%, #eef8ff 100%)"
        });

        const p3 = createPart({
          left: `${60 * scale}px`,
          top: `${16 * scale}px`,
          width: `${42 * scale}px`,
          height: `${27 * scale}px`,
          borderRadius: "999px",
          background: "linear-gradient(180deg, #ffffff 0%, #eef8ff 100%)"
        });

        const base = createPart({
          left: `${18 * scale}px`,
          top: `${26 * scale}px`,
          width: `${64 * scale}px`,
          height: `${18 * scale}px`,
          borderRadius: "999px",
          background: "linear-gradient(180deg, #fafdff 0%, #e6f4ff 100%)"
        });

        cloud.appendChild(p1);
        cloud.appendChild(p2);
        cloud.appendChild(p3);
        cloud.appendChild(base);

        if (funny) {
          const eyeLeft = createPart({
            left: `${72 * scale}px`,
            top: `${18 * scale}px`,
            width: `${4 * scale}px`,
            height: `${4 * scale}px`,
            borderRadius: "50%",
            background: "#444"
          });

          const eyeRight = createPart({
            left: `${87 * scale}px`,
            top: `${18 * scale}px`,
            width: `${4 * scale}px`,
            height: `${4 * scale}px`,
            borderRadius: "50%",
            background: "#444"
          });

          const mouth = createPart({
            left: `${76 * scale}px`,
            top: `${28 * scale}px`,
            width: `${18 * scale}px`,
            height: `${10 * scale}px`,
            borderRadius: "0 0 18px 18px",
            borderBottom: `${2 * scale}px solid #444`
          });

          const tongue = createPart({
            left: `${82 * scale}px`,
            top: `${34 * scale}px`,
            width: `${10 * scale}px`,
            height: `${12 * scale}px`,
            borderRadius: "0 0 8px 8px",
            background: "#ff7f98"
          });

          cloud.appendChild(eyeLeft);
          cloud.appendChild(eyeRight);
          cloud.appendChild(mouth);
          cloud.appendChild(tongue);
        }

        return cloud;
      }

      function createMortar() {
        mortarWrap = createPart({
          left: "50%",
          bottom: "24px",
          width: `${state.mortar.width}px`,
          height: `${state.mortar.height}px`,
          transform: "translateX(-50%)",
          zIndex: "5",
          pointerEvents: "none"
        });

        const shadow = createPart({
          left: "44px",
          bottom: "0",
          width: "146px",
          height: "20px",
          borderRadius: "999px",
          background: "rgba(0,0,0,0.16)",
          filter: "blur(2px)"
        });

        mortarBowl = createPart({
          left: "24px",
          bottom: "16px",
          width: "192px",
          height: "122px",
          borderRadius: "58% 58% 30% 30%",
          background: "linear-gradient(180deg, #b67846 0%, #8b562c 62%, #70401f 100%)",
          border: "3px solid rgba(83, 47, 22, 0.18)",
          boxShadow: "inset 0 10px 12px rgba(255,255,255,0.13)"
        });

        mortarRim = createPart({
          left: "34px",
          top: "6px",
          width: "124px",
          height: "26px",
          borderRadius: "999px",
          background: "linear-gradient(180deg, #d2a16f 0%, #946138 100%)",
          border: "2px solid rgba(84, 48, 20, 0.2)"
        });

        mortarInside = createPart({
          left: "41px",
          top: "15px",
          width: "110px",
          height: "40px",
          borderRadius: "999px",
          background: "radial-gradient(circle at 50% 40%, #4d2f1d 0%, #2e1a10 100%)",
          overflow: "hidden"
        });

        const innerGlow = createPart({
          left: "14px",
          top: "11px",
          width: "82px",
          height: "14px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.08)"
        });
        mortarInside.appendChild(innerGlow);

        const crack = createPart({
          right: "30px",
          bottom: "24px",
          width: "26px",
          height: "56px",
          borderLeft: "2px solid rgba(72, 38, 17, 0.35)",
          transform: "rotate(16deg)"
        });

        const base = createPart({
          left: "70px",
          bottom: "-2px",
          width: "100px",
          height: "30px",
          borderRadius: "22px 22px 14px 14px",
          background: "linear-gradient(180deg, #8c562d 0%, #70401f 100%)"
        });

        mortarLabel = createPart({
          left: "80px",
          bottom: "40px",
          width: "48px",
          height: "24px",
          borderRadius: "7px",
          background: "linear-gradient(180deg, #ffcb73 0%, #e0942f 100%)",
          color: "#5c2600",
          fontSize: "11px",
          fontWeight: "900",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          letterSpacing: "0.4px",
          transform: "rotate(-2deg)"
        });
        mortarLabel.textContent = "BLAST!";

        pestle = createPart({
          left: "124px",
          top: "-12px",
          width: "26px",
          height: "112px",
          borderRadius: "14px",
          background: "linear-gradient(180deg, #d1d1d1 0%, #a2a2a2 60%, #7b7b7b 100%)",
          border: "2px solid rgba(65,65,65,0.2)",
          transform: "rotate(20deg)",
          transformOrigin: "center 88px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.12)"
        });

        const pestleTip = createPart({
          left: "2px",
          bottom: "0",
          width: "18px",
          height: "18px",
          borderRadius: "10px",
          background: "linear-gradient(180deg, #b6b6b6 0%, #7c7c7c 100%)"
        });
        pestle.appendChild(pestleTip);

        splashFx = createPart({
          left: "70px",
          top: "30px",
          width: "72px",
          height: "24px",
          opacity: "0",
          transform: "scale(0.7)",
          transition: "transform 120ms ease, opacity 120ms ease"
        });

        [0, 1, 2, 3].forEach((i) => {
          const dot = createPart({
            left: `${i * 18}px`,
            top: `${i % 2 === 0 ? 4 : 10}px`,
            width: `${10 + (i % 2) * 4}px`,
            height: `${10 + (i % 2) * 4}px`,
            borderRadius: "50%",
            background: i % 2 === 0 ? "#d33628" : "#ff6b44"
          });
          splashFx.appendChild(dot);
        });

        messageEl = createPart({
          left: "50%",
          top: "14px",
          transform: "translateX(-50%)",
          minWidth: "220px",
          maxWidth: "82%",
          padding: "10px 16px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.88)",
          color: "#6a2c00",
          fontSize: "14px",
          fontWeight: "800",
          textAlign: "center",
          zIndex: "8",
          opacity: "0",
          transition: "opacity 160ms ease"
        });
        messageEl.textContent = "คลิกเฉพาะพริก 🌶️ ห้ามโดนระเบิด 🧨";

        explosionFlash = createPart({
          inset: "0",
          background: "radial-gradient(circle at center, rgba(255,120,80,0.30) 0%, rgba(255,30,0,0.22) 35%, rgba(255,0,0,0) 70%)",
          opacity: "0",
          zIndex: "7",
          pointerEvents: "none",
          transition: "opacity 140ms ease"
        });

        mortarBowl.appendChild(mortarRim);
        mortarBowl.appendChild(mortarInside);
        mortarBowl.appendChild(crack);
        mortarBowl.appendChild(mortarLabel);
        mortarBowl.appendChild(splashFx);
        mortarWrap.appendChild(shadow);
        mortarWrap.appendChild(mortarBowl);
        mortarWrap.appendChild(base);
        mortarWrap.appendChild(pestle);

        areaEl.appendChild(mortarWrap);
        areaEl.appendChild(messageEl);
        areaEl.appendChild(explosionFlash);
      }

      function updateMortarBounds() {
        state.mortar.x = (state.width - state.mortar.width) / 2;
        state.mortar.y = state.height - state.mortar.height - 24;
      }

      function getSpawnBounds() {
        return {
          minX: state.mortar.x + 42,
          maxX: state.mortar.x + state.mortar.width - 42,
          minY: state.mortar.y + 18,
          maxY: state.mortar.y + 90
        };
      }

      function showMessage(text, color = "#6a2c00", bg = "rgba(255,255,255,0.88)") {
        if (!messageEl) return;
        messageEl.textContent = text;
        messageEl.style.color = color;
        messageEl.style.background = bg;
        messageEl.style.opacity = "1";
      }

      function hideMessage() {
        if (!messageEl) return;
        messageEl.style.opacity = "0";
      }

      function triggerPoundEffect(isDanger = false) {
        if (pestle) {
          pestle.animate(
            [
              { transform: "rotate(20deg) translateY(0px)" },
              { transform: "rotate(11deg) translateY(22px)" },
              { transform: "rotate(20deg) translateY(0px)" }
            ],
            {
              duration: 160,
              easing: "ease-out"
            }
          );
        }

        if (splashFx) {
          splashFx.style.opacity = "1";
          splashFx.style.transform = "scale(1.08)";
          setTimeout(() => {
            if (!splashFx) return;
            splashFx.style.opacity = "0";
            splashFx.style.transform = "scale(0.72)";
          }, 120);
        }

        if (mortarWrap) {
          mortarWrap.animate(
            [
              { transform: "translateX(-50%) translateX(0px)" },
              { transform: "translateX(-50%) translateX(-5px)" },
              { transform: "translateX(-50%) translateX(5px)" },
              { transform: "translateX(-50%) translateX(0px)" }
            ],
            {
              duration: isDanger ? 220 : 120,
              easing: "ease-out"
            }
          );
        }

        if (isDanger && explosionFlash) {
          explosionFlash.style.opacity = "1";
          effectTimer = Date.now() + 180;
          setTimeout(() => {
            if (!explosionFlash) return;
            explosionFlash.style.opacity = "0";
          }, 180);
        }
      }

      function createIngredient(kind = "good") {
        const isDanger = kind === "danger";
        const el = document.createElement("button");
        el.type = "button";
        el.setAttribute("aria-label", isDanger ? "danger ingredient" : "good ingredient");
        el.style.position = "absolute";
        el.style.width = isDanger ? "46px" : "42px";
        el.style.height = isDanger ? "46px" : "42px";
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

        const icon = document.createElement("div");
        icon.textContent = isDanger ? (Math.random() < 0.5 ? "🧨" : "💣") : "🌶️";
        icon.style.width = "100%";
        icon.style.height = "100%";
        icon.style.display = "flex";
        icon.style.alignItems = "center";
        icon.style.justifyContent = "center";
        icon.style.fontSize = isDanger ? "34px" : "32px";
        icon.style.lineHeight = "1";
        icon.style.transform = `rotate(${randomBetween(-22, 22)}deg)`;

        el.appendChild(icon);
        areaEl.appendChild(el);

        const ingredient = {
          el,
          icon,
          kind,
          alive: true,
          bornAt: performance.now(),
          ttl: randomBetween(1350, 2100),
          driftX: randomBetween(-0.35, 0.35),
          driftY: randomBetween(-0.08, 0.08),
          pulseOffset: randomBetween(0, Math.PI * 2),
          x: 0,
          y: 0,
          size: isDanger ? 46 : 42
        };

        placeIngredient(ingredient);

        el.addEventListener("click", () => {
          if (!ingredient.alive || !started) return;

          if (ingredient.kind === "good") {
            score += bonusPerCatch;
            setScore(score);
            showMessage("ดีมาก! ตำพริกถูก 🌶️", "#0d6b2f", "rgba(232,255,239,0.92)");
            triggerPoundEffect(false);
          } else {
            score = Math.max(0, score - 2);
            setScore(score);
            showMessage("ระวัง! ตำผิดจนระเบิด 🧨", "#8d1200", "rgba(255,232,226,0.94)");
            triggerPoundEffect(true);
          }

          removeIngredient(ingredient, true);
        });

        state.ingredients.push(ingredient);
      }

      function placeIngredient(ingredient) {
        const bounds = getSpawnBounds();
        ingredient.x = randomBetween(bounds.minX, bounds.maxX - ingredient.size);
        ingredient.y = randomBetween(bounds.minY, bounds.maxY - ingredient.size);
        renderIngredient(ingredient);
      }

      function renderIngredient(ingredient) {
        ingredient.el.style.left = `${ingredient.x}px`;
        ingredient.el.style.top = `${ingredient.y}px`;
      }

      function removeIngredient(ingredient, animate = false) {
        if (!ingredient || !ingredient.alive) return;
        ingredient.alive = false;

        if (animate) {
          ingredient.el.animate(
            [
              { transform: "scale(1)", opacity: 1 },
              { transform: "scale(1.25)", opacity: 0.9 },
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

      function spawnBatch() {
        if (!started) return;

        cleanupIngredients();

        const availableSlots = Math.max(1, ingredientCount - state.ingredients.length);
        const spawnAmount = Math.min(2, availableSlots);

        for (let i = 0; i < spawnAmount; i += 1) {
          const kind = Math.random() < dangerChance ? "danger" : "good";
          createIngredient(kind);
        }
      }

      function updateIngredients(now) {
        const bounds = getSpawnBounds();

        state.ingredients.forEach((item) => {
          if (!item.alive) return;

          const age = now - item.bornAt;
          const pulse = Math.sin(age * 0.008 + item.pulseOffset) * 2.2;

          item.x = clamp(item.x + item.driftX, bounds.minX, bounds.maxX - item.size);
          item.y = clamp(item.y + item.driftY, bounds.minY, bounds.maxY - item.size);

          item.icon.style.transform = `translateY(${pulse}px) rotate(${Math.sin(age * 0.004 + item.pulseOffset) * 8}deg)`;
          item.icon.style.opacity = age > item.ttl - 350 ? `${Math.max(0.35, 1 - (age - (item.ttl - 350)) / 500)}` : "1";

          renderIngredient(item);

          if (age >= item.ttl) {
            removeIngredient(item, false);
          }
        });

        cleanupIngredients();
      }

      function updateAmbient(now) {
        phase += 0.02;

        if (bgCloudLeft) {
          bgCloudLeft.style.transform = `translateX(${Math.sin(now * 0.0007) * 4}px)`;
        }
        if (bgCloudRight) {
          bgCloudRight.style.transform = `translateX(${Math.sin(now * 0.0009 + 1.2) * 5}px)`;
        }
        if (bgTongueCloud) {
          bgTongueCloud.style.transform = `translateX(${Math.sin(now * 0.0011 + 0.6) * 3}px)`;
        }
        if (bgRiver) {
          bgRiver.style.transform = `rotate(-6deg) translateY(${Math.sin(now * 0.0012) * 2}px)`;
        }
        if (pestle && !effectTimer) {
          pestle.style.transform = `rotate(${20 + Math.sin(phase) * 2.2}deg)`;
        }
        if (effectTimer && Date.now() > effectTimer) {
          effectTimer = 0;
        }
      }

      function loop(now) {
        updateAmbient(now || performance.now());
        updateIngredients(now || performance.now());
        animationId = requestAnimationFrame(loop);
      }

      function startSpawning() {
        if (spawnTimerId) {
          clearInterval(spawnTimerId);
        }

        spawnBatch();
        spawnTimerId = setInterval(spawnBatch, spawnIntervalMs);
      }

      function stopSpawning() {
        if (spawnTimerId) {
          clearInterval(spawnTimerId);
          spawnTimerId = null;
        }
      }

      return {
        setup() {
          const area = getAreaSize();
          state.width = area.width;
          state.height = area.height;

          applyAreaStyle();
          updateMortarBounds();
          createBackground();
          createMortar();

          playerEl.style.display = "none";
          setScore(0);
          showMessage("คลิกเฉพาะพริก 🌶️ ห้ามโดนระเบิด 🧨");
        },

        start() {
          started = true;
          hideMessage();
          startSpawning();

          if (animationId) {
            cancelAnimationFrame(animationId);
          }
          loop(performance.now());
        },

        stop() {
          started = false;
          stopSpawning();

          if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
          }

          state.ingredients.forEach((item) => {
            if (item.el && item.el.parentNode) {
              item.el.parentNode.removeChild(item.el);
            }
          });
          state.ingredients = [];

          [
            bgRiver,
            bgTreeLeft,
            bgBushLeft,
            bgBushRight,
            bgCloudLeft,
            bgCloudRight,
            bgTongueCloud,
            mortarWrap,
            messageEl,
            explosionFlash
          ].forEach((el) => {
            if (el && el.parentNode) {
              el.parentNode.removeChild(el);
            }
          });

          bgRiver = null;
          bgTreeLeft = null;
          bgBushLeft = null;
          bgBushRight = null;
          bgCloudLeft = null;
          bgCloudRight = null;
          bgTongueCloud = null;
          mortarWrap = null;
          mortarBowl = null;
          mortarRim = null;
          mortarInside = null;
          mortarLabel = null;
          pestle = null;
          splashFx = null;
          messageEl = null;
          explosionFlash = null;
        },

        onKeyDown(key) {
          if (key === " " || key === "enter") {
            showMessage("ใช้เมาส์หรือแตะหน้าจอเพื่อเลือกพริก 🌶️", "#5a2c00", "rgba(255,255,255,0.9)");
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