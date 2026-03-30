//js/mini-games/game8.js
window.MiniGameShared.register("game8", (config = {}) => {
  const duration = Number(config.duration) || 12;
  const bonusPerCatch = Number(config.bonusPerCatch) || 1;

  return {
    id: "game8",
    title: "ต้อนวัวกลับคอก",
    description: `วิ่งไล่จับวัวแล้วพากลับเข้าคอกให้ได้มากที่สุดภายใน ${duration} วินาที`,
    overlayTitle: "มินิเกม: วัวหายล้อมคอก",
    overlayDescription:
      "วัวหนีออกจากคอกไปแล้ว! รีบวิ่งไปจับวัว แล้วจูงกลับเข้าคอกให้ได้มากที่สุด",
    themeClass: "theme-field",
    duration,

    finishText(score) {
      return `หมดเวลา! คุณต้อนวัวกลับคอกได้ ${score} ตัว`;
    },

    finishPopupMessage(score) {
      if (score >= 8) return "ยอดเยี่ยม! ต้อนวัวกลับได้เก่งมาก";
      if (score >= 4) return "ดีมาก! ช่วยวัวกลับคอกได้หลายตัว";
      if (score > 0) return "ได้อยู่! ถ้าไวขึ้นอีกนิดจะช่วยได้มากกว่านี้";
      return "วัววิ่งหนีหมดเลย ลองใหม่อีกครั้งนะ";
    },

    createController(context) {
      const { areaEl, playerEl, setScore, clearAreaInlineStyles } = context;

      let score = 0;
      let running = false;
      let animationId = null;
      let spawnInterval = null;

      const cows = [];
      const keys = {
        up: false,
        down: false,
        left: false,
        right: false
      };

      const player = {
        x: 0,
        y: 0,
        size: 56,
        speed: 4.6
      };

      const pen = {
        x: 0,
        y: 0,
        width: 150,
        height: 110
      };

      let penEl = null;
      let ropeEl = null;
      let statusEl = null;
      let tetheredCow = null;

      function getAreaSize() {
        return {
          width: areaEl.clientWidth || 680,
          height: areaEl.clientHeight || 390
        };
      }

      function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
      }

      function isCollidingRect(a, b) {
        return (
          a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y
        );
      }

      function getDistance(ax, ay, bx, by) {
        const dx = bx - ax;
        const dy = by - ay;
        return Math.sqrt(dx * dx + dy * dy);
      }

      function applyAreaStyle() {
        clearAreaInlineStyles();
        areaEl.style.position = "relative";
        areaEl.style.overflow = "hidden";
        areaEl.style.background =
          "linear-gradient(180deg, #dff4ff 0%, #d7f4c4 48%, #7ecb61 100%)";
        areaEl.style.border = "3px solid rgba(129, 186, 99, 0.30)";
      }

      function createPart(styles = {}) {
        const el = document.createElement("div");
        el.style.position = "absolute";
        el.style.boxSizing = "border-box";
        Object.assign(el.style, styles);
        return el;
      }

      function updateStatus() {
        if (!statusEl) return;
        statusEl.textContent = tetheredCow
          ? "สถานะ: กำลังจูงวัวกลับคอก"
          : "สถานะ: ออกไปจับวัว";
      }

      function createPen() {
        const area = getAreaSize();

        pen.width = 156;
        pen.height = 112;
        pen.x = area.width / 2 - pen.width / 2;
        pen.y = area.height / 2 - pen.height / 2;

        penEl = createPart({
          left: `${pen.x}px`,
          top: `${pen.y}px`,
          width: `${pen.width}px`,
          height: `${pen.height}px`,
          border: "6px solid #8b5a2b",
          borderRadius: "18px",
          background: "rgba(255, 240, 210, 0.58)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "800",
          color: "#6d431d",
          fontSize: "18px",
          zIndex: "1",
          boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.18)"
        });
        penEl.textContent = "คอกวัว";

        const straw = createPart({
          left: "18px",
          right: "18px",
          bottom: "10px",
          height: "20px",
          borderRadius: "999px",
          background: "rgba(223, 193, 117, 0.45)"
        });
        penEl.appendChild(straw);

        areaEl.appendChild(penEl);
      }

      function createRope() {
        ropeEl = createPart({
          left: "0px",
          top: "0px",
          width: "0px",
          height: "4px",
          borderRadius: "999px",
          background: "linear-gradient(90deg, #d5b07d 0%, #9b6a38 100%)",
          transformOrigin: "0 50%",
          zIndex: "2",
          opacity: "0",
          pointerEvents: "none",
          boxShadow: "0 2px 4px rgba(0,0,0,0.14)"
        });
        areaEl.appendChild(ropeEl);
      }

      function createStatus() {
        statusEl = createPart({
          left: "14px",
          top: "14px",
          padding: "8px 14px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.88)",
          color: "#5c6f33",
          fontWeight: "800",
          fontSize: "14px",
          zIndex: "5"
        });
        areaEl.appendChild(statusEl);
        updateStatus();
      }

      function createPlayer() {
        player.x = 36;
        player.y = getAreaSize().height - player.size - 26;

        playerEl.style.display = "flex";
        playerEl.style.position = "absolute";
        playerEl.style.alignItems = "center";
        playerEl.style.justifyContent = "center";
        playerEl.style.width = `${player.size}px`;
        playerEl.style.height = `${player.size}px`;
        playerEl.style.left = `${player.x}px`;
        playerEl.style.top = `${player.y}px`;
        playerEl.style.fontSize = "38px";
        playerEl.style.zIndex = "4";
        playerEl.style.userSelect = "none";
        playerEl.style.filter = "drop-shadow(0 8px 10px rgba(0,0,0,0.16))";
        playerEl.textContent = "🧑‍🌾";
      }

      function updatePlayerEl() {
        playerEl.style.left = `${player.x}px`;
        playerEl.style.top = `${player.y}px`;
      }

      function createCow() {
        if (!running) return;

        const area = getAreaSize();
        const size = 52;

        let x = 0;
        let y = 0;
        let attempts = 0;

        do {
          x = 20 + Math.random() * (area.width - size - 40);
          y = 20 + Math.random() * (area.height - size - 40);
          attempts += 1;
        } while (
          attempts < 40 &&
          isCollidingRect(
            { x, y, width: size, height: size },
            { x: pen.x - 40, y: pen.y - 40, width: pen.width + 80, height: pen.height + 80 }
          )
        );

        const el = document.createElement("div");
        el.textContent = "🐄";
        el.style.position = "absolute";
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.fontSize = "34px";
        el.style.userSelect = "none";
        el.style.pointerEvents = "none";
        el.style.zIndex = "3";
        el.style.filter = "drop-shadow(0 8px 10px rgba(0,0,0,0.14))";

        const angle = Math.random() * Math.PI * 2;
        const speed = 1.3 + Math.random() * 1.4;

        const cow = {
          el,
          x,
          y,
          size,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          tethered: false,
          sway: Math.random() * Math.PI * 2,
          nextTurnAt: performance.now() + 500 + Math.random() * 900
        };

        areaEl.appendChild(el);
        cows.push(cow);
        renderCow(cow);
      }

      function renderCow(cow) {
        cow.el.style.left = `${cow.x}px`;
        cow.el.style.top = `${cow.y}px`;
      }

      function removeCow(cow) {
        const idx = cows.indexOf(cow);
        if (idx >= 0) cows.splice(idx, 1);

        if (tetheredCow === cow) {
          tetheredCow = null;
          updateStatus();
        }

        if (cow.el && cow.el.parentNode) {
          cow.el.parentNode.removeChild(cow.el);
        }
      }

      function updateFreeCows(now) {
        const area = getAreaSize();

        cows.forEach((cow) => {
          if (cow.tethered) return;

          if (now >= cow.nextTurnAt) {
            cow.vx += (Math.random() - 0.5) * 1.1;
            cow.vy += (Math.random() - 0.5) * 1.1;
            cow.vx = clamp(cow.vx, -2.2, 2.2);
            cow.vy = clamp(cow.vy, -2.2, 2.2);

            if (Math.abs(cow.vx) < 0.6) cow.vx = cow.vx < 0 ? -0.8 : 0.8;
            if (Math.abs(cow.vy) < 0.6) cow.vy = cow.vy < 0 ? -0.8 : 0.8;

            cow.nextTurnAt = now + 500 + Math.random() * 1100;
          }

          const playerDist = getDistance(
            cow.x + cow.size / 2,
            cow.y + cow.size / 2,
            player.x + player.size / 2,
            player.y + player.size / 2
          );

          if (playerDist < 150) {
            const dx = cow.x - player.x;
            const dy = cow.y - player.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;

            cow.vx += (dx / len) * 0.18;
            cow.vy += (dy / len) * 0.18;
            cow.vx = clamp(cow.vx, -2.8, 2.8);
            cow.vy = clamp(cow.vy, -2.8, 2.8);
          }

          cow.x += cow.vx;
          cow.y += cow.vy;

          if (cow.x <= 0 || cow.x >= area.width - cow.size) {
            cow.vx *= -1;
            cow.x = clamp(cow.x, 0, area.width - cow.size);
          }

          if (cow.y <= 0 || cow.y >= area.height - cow.size) {
            cow.vy *= -1;
            cow.y = clamp(cow.y, 0, area.height - cow.size);
          }

          renderCow(cow);
        });
      }

      function updateTetheredCow() {
        if (!tetheredCow) {
          ropeEl.style.opacity = "0";
          return;
        }

        const targetX = player.x - 28;
        const targetY = player.y + 6;

        tetheredCow.x += (targetX - tetheredCow.x) * 0.14;
        tetheredCow.y += (targetY - tetheredCow.y) * 0.14;

        renderCow(tetheredCow);

        const playerCenterX = player.x + player.size / 2;
        const playerCenterY = player.y + player.size / 2;
        const cowCenterX = tetheredCow.x + tetheredCow.size / 2;
        const cowCenterY = tetheredCow.y + tetheredCow.size / 2;

        const dx = cowCenterX - playerCenterX;
        const dy = cowCenterY - playerCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        ropeEl.style.left = `${playerCenterX}px`;
        ropeEl.style.top = `${playerCenterY}px`;
        ropeEl.style.width = `${dist}px`;
        ropeEl.style.transform = `rotate(${angle}deg)`;
        ropeEl.style.opacity = "1";

        const inPen = isCollidingRect(
          {
            x: tetheredCow.x,
            y: tetheredCow.y,
            width: tetheredCow.size,
            height: tetheredCow.size
          },
          {
            x: pen.x + 12,
            y: pen.y + 12,
            width: pen.width - 24,
            height: pen.height - 24
          }
        );

        if (inPen) {
          score += bonusPerCatch;
          setScore(score);

          tetheredCow.el.animate(
            [
              { transform: "scale(1)", opacity: 1 },
              { transform: "scale(0.8)", opacity: 0.84 },
              { transform: "scale(0.4)", opacity: 0 }
            ],
            {
              duration: 220,
              easing: "ease-out"
            }
          );

          const savedCow = tetheredCow;
          tetheredCow = null;
          updateStatus();
          ropeEl.style.opacity = "0";

          setTimeout(() => {
            removeCow(savedCow);
            createCow();
          }, 180);
        }
      }

      function checkCatchCow() {
        if (tetheredCow) return;

        const playerBox = {
          x: player.x,
          y: player.y,
          width: player.size,
          height: player.size
        };

        for (const cow of cows) {
          if (cow.tethered) continue;

          const cowBox = {
            x: cow.x,
            y: cow.y,
            width: cow.size,
            height: cow.size
          };

          if (isCollidingRect(playerBox, cowBox)) {
            cow.tethered = true;
            tetheredCow = cow;
            cow.vx = 0;
            cow.vy = 0;
            cow.el.animate(
              [
                { transform: "scale(1)" },
                { transform: "scale(1.12)" },
                { transform: "scale(1)" }
              ],
              {
                duration: 180,
                easing: "ease-out"
              }
            );
            updateStatus();
            break;
          }
        }
      }

      function updatePlayer() {
        const area = getAreaSize();

        if (keys.up) player.y -= player.speed;
        if (keys.down) player.y += player.speed;
        if (keys.left) player.x -= player.speed;
        if (keys.right) player.x += player.speed;

        player.x = clamp(player.x, 0, area.width - player.size);
        player.y = clamp(player.y, 0, area.height - player.size);

        updatePlayerEl();
      }

      function loop(now) {
        if (!running) return;

        updatePlayer();
        updateFreeCows(now || performance.now());
        checkCatchCow();
        updateTetheredCow();

        animationId = requestAnimationFrame(loop);
      }

      function clearAllCows() {
        while (cows.length > 0) {
          removeCow(cows[0]);
        }
      }

      return {
        setup() {
          applyAreaStyle();
          playerEl.style.display = "none";
          score = 0;
          setScore(0);

          createPen();
          createRope();
          createStatus();
          createPlayer();
        },

        start() {
          running = true;
          playerEl.style.display = "flex";

          createCow();
          createCow();
          createCow();

          spawnInterval = setInterval(() => {
            if (cows.length < 5) {
              createCow();
            }
          }, 1200);

          loop();
        },

        stop() {
          running = false;

          if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
          }

          if (spawnInterval) {
            clearInterval(spawnInterval);
            spawnInterval = null;
          }

          clearAllCows();

          if (ropeEl && ropeEl.parentNode) {
            ropeEl.parentNode.removeChild(ropeEl);
          }
          ropeEl = null;

          if (statusEl && statusEl.parentNode) {
            statusEl.parentNode.removeChild(statusEl);
          }
          statusEl = null;

          if (penEl && penEl.parentNode) {
            penEl.parentNode.removeChild(penEl);
          }
          penEl = null;

          tetheredCow = null;
        },

        onKeyDown(key) {
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