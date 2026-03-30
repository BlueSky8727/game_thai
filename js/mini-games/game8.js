//js/mini-games/game8.js
window.MiniGameShared.register("game8", (config = {}) => {
  const duration = Number(config.duration) || 12;
  const bonusPerCatch = Number(config.bonusPerCatch) || 1;

  function ensureAssets() {
    const styleId = "mini-game8-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .theme-field {
        position: relative;
        overflow: hidden;
        background:
          radial-gradient(circle at 18% 14%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.07) 13%, transparent 28%),
          radial-gradient(circle at 80% 10%, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.05) 10%, transparent 24%),
          linear-gradient(180deg, #dff5ff 0%, #d7f0ff 18%, #d7efc8 44%, #9bd577 72%, #6ebd53 100%);
      }

      .theme-field::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        background:
          linear-gradient(to top, rgba(18, 55, 14, 0.10), transparent 26%),
          repeating-linear-gradient(
            100deg,
            rgba(255,255,255,0) 0px,
            rgba(255,255,255,0) 18px,
            rgba(255,255,255,0.024) 19px,
            rgba(255,255,255,0) 20px
          );
        opacity: 0.95;
      }

      .game8-sun {
        position: absolute;
        right: 62px;
        top: 30px;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        z-index: 0;
        pointer-events: none;
        background: radial-gradient(circle, #fff9b9 0%, #ffd86c 68%, #ffbf4a 100%);
        box-shadow:
          0 0 0 8px rgba(255, 217, 100, 0.12),
          0 0 34px rgba(255, 210, 88, 0.32);
        opacity: 0.94;
      }

      .game8-hill-back {
        position: absolute;
        left: -8%;
        right: -8%;
        bottom: 22%;
        height: 18%;
        z-index: 0;
        pointer-events: none;
        border-radius: 50% 50% 0 0 / 100% 100% 0 0;
        background: linear-gradient(180deg, rgba(113, 176, 88, 0.46) 0%, rgba(84, 141, 62, 0.66) 100%);
        opacity: 0.62;
      }

      .game8-grass-mid {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 7%;
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
        opacity: 0.94;
      }

      .game8-grass-front {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 22%;
        pointer-events: none;
        z-index: 1;
        background:
          linear-gradient(180deg, rgba(81, 156, 61, 0.06) 0%, rgba(52, 113, 42, 0.14) 100%),
          repeating-linear-gradient(
            100deg,
            rgba(0,0,0,0) 0px,
            rgba(0,0,0,0) 10px,
            rgba(125, 193, 82, 0.18) 11px,
            rgba(0,0,0,0) 12px
          );
      }

      .game8-status {
        position: absolute;
        left: 14px;
        top: 14px;
        padding: 10px 18px;
        border-radius: 999px;
        background: rgba(255,255,255,0.92);
        color: #5f7035;
        font-weight: 800;
        font-size: 14px;
        z-index: 6;
        box-shadow: 0 10px 24px rgba(0,0,0,0.08);
        backdrop-filter: blur(3px);
      }

      .game8-rope {
        position: absolute;
        height: 4px;
        border-radius: 999px;
        background: linear-gradient(90deg, #d8b88d 0%, #9d6f3b 100%);
        transform-origin: 0 50%;
        z-index: 3;
        opacity: 0;
        pointer-events: none;
        box-shadow: 0 2px 4px rgba(0,0,0,0.14);
      }

      .game8-pen {
        position: absolute;
        z-index: 2;
        box-shadow:
          inset 0 0 0 2px rgba(255,255,255,0.16),
          0 12px 24px rgba(94, 62, 28, 0.10);
      }

      .game8-pen .pen-post {
        position: absolute;
        width: 12px;
        height: 26px;
        background: linear-gradient(180deg, #9b6732 0%, #7a4d23 100%);
        border-radius: 8px;
        bottom: -8px;
      }

      .game8-farmer-wrap {
        position: absolute;
        z-index: 5;
        pointer-events: none;
        user-select: none;
        transform-origin: center bottom;
      }

      .game8-farmer-shadow {
        position: absolute;
        left: 50%;
        bottom: 6px;
        width: 46px;
        height: 10px;
        transform: translateX(-50%);
        border-radius: 999px;
        background: rgba(0,0,0,0.17);
        filter: blur(2px);
      }

      .game8-farmer-character {
        position: absolute;
        left: 50%;
        bottom: 8px;
        width: 78px;
        height: 98px;
        transform: translateX(-50%);
        transform-origin: center bottom;
        filter: drop-shadow(0 8px 10px rgba(0,0,0,0.16));
      }

      .game8-cow {
        position: absolute;
        z-index: 4;
        pointer-events: none;
        user-select: none;
        filter: drop-shadow(0 8px 10px rgba(0,0,0,0.14));
        transform-origin: center bottom;
      }

      .game8-cow-inner {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 42px;
        animation: game8CowIdle 1.15s ease-in-out infinite;
      }

      .game8-cow.tethered .game8-cow-inner {
        animation-duration: 0.72s;
      }

      @keyframes game8CowIdle {
        0%, 100% {
          transform: translateY(0px) rotate(-2deg);
        }
        50% {
          transform: translateY(-2px) rotate(2deg);
        }
      }

      @keyframes game8CloudFloat {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(5px);
        }
      }
    `;
    document.head.appendChild(style);
  }

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
      let walkPhase = 0;
      let facing = 1;

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
        width: 76,
        height: 104,
        speed: 4.5
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

      let farmerWrap = null;
      let farmerShadow = null;
      let farmerCharacter = null;

      const farmerParts = {
        armLeft: null,
        armRight: null,
        legLeft: null,
        legRight: null
      };

      const decorEls = [];

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

      function createPart(styles = {}) {
        const el = document.createElement("div");
        el.style.position = "absolute";
        el.style.boxSizing = "border-box";
        Object.assign(el.style, styles);
        return el;
      }

      function addDecor(className, styles = {}) {
        const el = document.createElement("div");
        el.className = className;
        Object.assign(el.style, styles);
        areaEl.appendChild(el);
        decorEls.push(el);
        return el;
      }

      function applyAreaStyle() {
        clearAreaInlineStyles();
        ensureAssets();

        areaEl.style.position = "relative";
        areaEl.style.overflow = "hidden";
        areaEl.style.background =
          "linear-gradient(180deg, #dff5ff 0%, #d7f0ff 18%, #d7efc8 44%, #9bd577 72%, #6ebd53 100%)";
        areaEl.style.border = "3px solid rgba(129, 186, 99, 0.30)";
        areaEl.style.boxShadow = "inset 0 10px 28px rgba(255,255,255,0.20)";

        addDecor("game8-sun", {
          right: "62px",
          top: "30px",
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          position: "absolute",
          zIndex: "0",
          pointerEvents: "none",
          background: "radial-gradient(circle, #fff9b9 0%, #ffd86c 68%, #ffbf4a 100%)",
          boxShadow: "0 0 0 8px rgba(255, 217, 100, 0.12), 0 0 34px rgba(255, 210, 88, 0.32)",
          opacity: "0.94"
        });

        addDecor("game8-hill-back");
        addDecor("game8-grass-mid");
        addDecor("game8-grass-front");
      }

      function updateStatus() {
        if (!statusEl) return;
        statusEl.textContent = tetheredCow
          ? "สถานะ: กำลังจูงวัวกลับคอก"
          : "สถานะ: ออกไปจับวัว";
      }

      function createPen() {
        const area = getAreaSize();

        pen.width = 164;
        pen.height = 118;
        pen.x = area.width / 2 - pen.width / 2;
        pen.y = area.height / 2 - pen.height / 2;

        penEl = document.createElement("div");
        penEl.className = "game8-pen";
        penEl.style.left = `${pen.x}px`;
        penEl.style.top = `${pen.y}px`;
        penEl.style.width = `${pen.width}px`;
        penEl.style.height = `${pen.height}px`;
        penEl.style.border = "6px solid #8b5a2b";
        penEl.style.borderRadius = "20px";
        penEl.style.background = "rgba(255, 242, 214, 0.66)";
        penEl.style.display = "flex";
        penEl.style.alignItems = "center";
        penEl.style.justifyContent = "center";
        penEl.style.fontWeight = "900";
        penEl.style.color = "#6d431d";
        penEl.style.fontSize = "18px";
        penEl.textContent = "คอกวัว";

        const straw = createPart({
          left: "18px",
          right: "18px",
          bottom: "12px",
          height: "22px",
          borderRadius: "999px",
          background: "rgba(223, 193, 117, 0.45)"
        });
        penEl.appendChild(straw);

        const postTL = document.createElement("div");
        postTL.className = "pen-post";
        postTL.style.left = "10px";

        const postTR = document.createElement("div");
        postTR.className = "pen-post";
        postTR.style.right = "10px";

        penEl.appendChild(postTL);
        penEl.appendChild(postTR);
        areaEl.appendChild(penEl);
      }

      function createRope() {
        ropeEl = document.createElement("div");
        ropeEl.className = "game8-rope";
        ropeEl.style.left = "0px";
        ropeEl.style.top = "0px";
        ropeEl.style.width = "0px";
        areaEl.appendChild(ropeEl);
      }

      function createStatus() {
        statusEl = document.createElement("div");
        statusEl.className = "game8-status";
        areaEl.appendChild(statusEl);
        updateStatus();
      }

      function createFarmer() {
        playerEl.style.display = "none";

        farmerWrap = document.createElement("div");
        farmerWrap.className = "game8-farmer-wrap";
        farmerWrap.style.width = `${player.width}px`;
        farmerWrap.style.height = `${player.height}px`;

        farmerShadow = document.createElement("div");
        farmerShadow.className = "game8-farmer-shadow";

        farmerCharacter = document.createElement("div");
        farmerCharacter.className = "game8-farmer-character";

        const bodyWrap = createPart({
          left: "50%",
          bottom: "0",
          width: "78px",
          height: "98px",
          transform: "translateX(-50%)",
          transformOrigin: "center bottom"
        });

        const hat = createPart({
          left: "22px",
          top: "8px",
          width: "32px",
          height: "14px",
          borderRadius: "18px 18px 12px 12px",
          background: "linear-gradient(180deg, #d7b35f 0%, #b88b36 100%)",
          zIndex: "5",
          boxShadow: "0 2px 4px rgba(0,0,0,0.10)"
        });

        const hatBrim = createPart({
          left: "13px",
          top: "18px",
          width: "50px",
          height: "7px",
          borderRadius: "999px",
          background: "linear-gradient(180deg, #e0be6d 0%, #c4923a 100%)",
          zIndex: "4"
        });

        const head = createPart({
          left: "25px",
          top: "22px",
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
          width: "24px",
          height: "11px",
          borderRadius: "14px 14px 10px 10px",
          background: "#2f2a28"
        });
        head.appendChild(hair);

        const eyeLeft = createPart({
          left: "7px",
          top: "10px",
          width: "3px",
          height: "3px",
          borderRadius: "50%",
          background: "#2c211b"
        });

        const eyeRight = createPart({
          left: "16px",
          top: "10px",
          width: "3px",
          height: "3px",
          borderRadius: "50%",
          background: "#2c211b"
        });

        const smile = createPart({
          left: "8px",
          top: "17px",
          width: "9px",
          height: "5px",
          borderBottom: "2px solid #a55d49",
          borderRadius: "0 0 8px 8px"
        });

        head.appendChild(eyeLeft);
        head.appendChild(eyeRight);
        head.appendChild(smile);

        const body = createPart({
          left: "22px",
          top: "48px",
          width: "34px",
          height: "30px",
          borderRadius: "12px 12px 10px 10px",
          background: "linear-gradient(180deg, #f2d55a 0%, #d8b42d 100%)",
          border: "2px solid rgba(0,0,0,0.08)",
          zIndex: "2"
        });

        const scarf = createPart({
          left: "10px",
          top: "3px",
          width: "13px",
          height: "7px",
          borderRadius: "0 0 8px 8px",
          background: "rgba(255,255,255,0.72)"
        });
        body.appendChild(scarf);

        const armLeft = createPart({
          left: "16px",
          top: "17px",
          width: "8px",
          height: "38px",
          borderRadius: "999px",
          background: "linear-gradient(180deg, #ffd7b0 0%, #f3bf8d 100%)",
          transformOrigin: "top center",
          zIndex: "1"
        });

        const armRight = createPart({
          left: "55px",
          top: "17px",
          width: "8px",
          height: "38px",
          borderRadius: "999px",
          background: "linear-gradient(180deg, #ffd7b0 0%, #f3bf8d 100%)",
          transformOrigin: "top center",
          zIndex: "1"
        });

        const stick = createPart({
          left: "58px",
          top: "24px",
          width: "4px",
          height: "38px",
          borderRadius: "999px",
          background: "linear-gradient(180deg, #c79861 0%, #8b5d2f 100%)",
          transform: "rotate(18deg)",
          transformOrigin: "top center",
          zIndex: "0"
        });

        const legLeft = createPart({
          left: "30px",
          top: "76px",
          width: "9px",
          height: "22px",
          borderRadius: "999px",
          background: "linear-gradient(180deg, #355fae 0%, #2a4b88 100%)",
          transformOrigin: "top center",
          zIndex: "0"
        });

        const legRight = createPart({
          left: "42px",
          top: "76px",
          width: "9px",
          height: "22px",
          borderRadius: "999px",
          background: "linear-gradient(180deg, #355fae 0%, #2a4b88 100%)",
          transformOrigin: "top center",
          zIndex: "0"
        });

        const footLeft = createPart({
          left: "-3px",
          bottom: "-2px",
          width: "13px",
          height: "7px",
          borderRadius: "8px",
          background: "#4f3b2f"
        });

        const footRight = createPart({
          left: "-2px",
          bottom: "-2px",
          width: "13px",
          height: "7px",
          borderRadius: "8px",
          background: "#4f3b2f"
        });

        legLeft.appendChild(footLeft);
        legRight.appendChild(footRight);

        bodyWrap.appendChild(stick);
        bodyWrap.appendChild(armLeft);
        bodyWrap.appendChild(armRight);
        bodyWrap.appendChild(legLeft);
        bodyWrap.appendChild(legRight);
        bodyWrap.appendChild(body);
        bodyWrap.appendChild(head);
        bodyWrap.appendChild(hatBrim);
        bodyWrap.appendChild(hat);

        farmerCharacter.appendChild(bodyWrap);
        farmerWrap.appendChild(farmerShadow);
        farmerWrap.appendChild(farmerCharacter);
        areaEl.appendChild(farmerWrap);

        farmerParts.armLeft = armLeft;
        farmerParts.armRight = armRight;
        farmerParts.legLeft = legLeft;
        farmerParts.legRight = legRight;

        player.x = 36;
        player.y = getAreaSize().height - player.height - 24;
        updateFarmerVisual(false);
        updateFarmerPosition();
      }

      function updateFarmerVisual(isMoving) {
        if (!farmerCharacter || !farmerShadow) return;

        walkPhase += isMoving ? 0.34 : 0.08;

        const swing = isMoving ? Math.sin(walkPhase) * 18 : Math.sin(walkPhase) * 4;
        const reverseSwing = -swing;
        const bob = isMoving ? Math.sin(walkPhase * 2) * 3 : Math.sin(walkPhase * 1.4) * 1.2;

        farmerCharacter.style.transform =
          `translateX(-50%) translateY(${bob}px) scaleX(${facing})`;

        farmerShadow.style.transform =
          `translateX(-50%) scale(${isMoving ? 0.92 : 1}, ${isMoving ? 0.92 : 1})`;

        if (farmerParts.armLeft) {
          farmerParts.armLeft.style.transform = `rotate(${swing * 0.6}deg)`;
        }

        if (farmerParts.armRight) {
          farmerParts.armRight.style.transform = `rotate(${reverseSwing * 0.55}deg)`;
        }

        if (farmerParts.legLeft) {
          farmerParts.legLeft.style.transform = `rotate(${reverseSwing}deg)`;
        }

        if (farmerParts.legRight) {
          farmerParts.legRight.style.transform = `rotate(${swing}deg)`;
        }
      }

      function updateFarmerPosition() {
        if (!farmerWrap) return;
        farmerWrap.style.left = `${player.x}px`;
        farmerWrap.style.top = `${player.y}px`;
      }

      function createCow() {
        if (!running) return;

        const area = getAreaSize();
        const size = 66;

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
        el.className = "game8-cow";
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;

        const inner = document.createElement("div");
        inner.className = "game8-cow-inner";
        inner.textContent = "🐄";
        el.appendChild(inner);

        const angle = Math.random() * Math.PI * 2;
        const speed = 1.25 + Math.random() * 1.35;

        const cow = {
          el,
          inner,
          x,
          y,
          size,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          tethered: false,
          nextTurnAt: performance.now() + 500 + Math.random() * 900
        };

        areaEl.appendChild(el);
        cows.push(cow);
        renderCow(cow);
      }

      function renderCow(cow) {
        cow.el.style.left = `${cow.x}px`;
        cow.el.style.top = `${cow.y}px`;

        const faceLeft = cow.vx < -0.08;
        cow.inner.style.transform = faceLeft ? "scaleX(-1)" : "scaleX(1)";
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
            player.x + player.width / 2,
            player.y + player.height / 2
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

        const targetX = player.x - 8;
        const targetY = player.y + 20;

        tetheredCow.x += (targetX - tetheredCow.x) * 0.14;
        tetheredCow.y += (targetY - tetheredCow.y) * 0.14;

        tetheredCow.el.classList.add("tethered");
        renderCow(tetheredCow);

        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
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
              { transform: "scale(0.82)", opacity: 0.84 },
              { transform: "scale(0.42)", opacity: 0 }
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
          x: player.x + 14,
          y: player.y + 16,
          width: player.width - 24,
          height: player.height - 18
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
        let moving = false;

        if (keys.up) {
          player.y -= player.speed;
          moving = true;
        }
        if (keys.down) {
          player.y += player.speed;
          moving = true;
        }
        if (keys.left) {
          player.x -= player.speed;
          facing = -1;
          moving = true;
        }
        if (keys.right) {
          player.x += player.speed;
          facing = 1;
          moving = true;
        }

        player.x = clamp(player.x, 0, area.width - player.width);
        player.y = clamp(player.y, 0, area.height - player.height);

        updateFarmerVisual(moving);
        updateFarmerPosition();
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
          createFarmer();
        },

        start() {
          running = true;

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

          if (farmerWrap && farmerWrap.parentNode) {
            farmerWrap.parentNode.removeChild(farmerWrap);
          }
          farmerWrap = null;
          farmerShadow = null;
          farmerCharacter = null;

          Object.keys(farmerParts).forEach((key) => {
            farmerParts[key] = null;
          });

          decorEls.forEach((el) => {
            if (el && el.parentNode) {
              el.parentNode.removeChild(el);
            }
          });
          decorEls.length = 0;

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