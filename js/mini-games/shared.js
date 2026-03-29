//js/mini-games/shared.js
window.MiniGameRegistry = window.MiniGameRegistry || {};

window.MiniGameShared = {
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  },

  isColliding(a, b) {
    return (
      a.x < b.x + b.size &&
      a.x + a.size > b.x &&
      a.y < b.y + b.size &&
      a.y + a.size > b.y
    );
  },

  normalizeVector(dx, dy) {
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    return {
      x: dx / distance,
      y: dy / distance,
      distance
    };
  },

  register(id, factory) {
    window.MiniGameRegistry[id] = factory;
  },

  createInputManager(options = {}) {
    const swipeThreshold = Number(options.swipeThreshold) || 30;

    const state = {
      left: false,
      right: false,
      up: false,
      down: false,
      tap: false,
      pointerDown: false,
      lastSwipe: null,
      touchSupported:
        "ontouchstart" in window || navigator.maxTouchPoints > 0
    };

    let rootElement = null;
    let cleanupFns = [];
    let touchStartX = 0;
    let touchStartY = 0;
    let touchMoved = false;

    const keyMap = {
      ArrowLeft: "left",
      KeyA: "left",
      ArrowRight: "right",
      KeyD: "right",
      ArrowUp: "up",
      KeyW: "up",
      ArrowDown: "down",
      KeyS: "down"
    };

    const setDirection = (direction, pressed) => {
      if (Object.prototype.hasOwnProperty.call(state, direction)) {
        state[direction] = pressed;
      }
    };

    const resetDirections = () => {
      state.left = false;
      state.right = false;
      state.up = false;
      state.down = false;
    };

    const triggerTap = () => {
      state.tap = true;
      window.requestAnimationFrame(() => {
        state.tap = false;
      });
    };

    const applySwipe = (dx, dy) => {
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX < swipeThreshold && absY < swipeThreshold) {
        triggerTap();
        state.lastSwipe = "tap";
        return;
      }

      resetDirections();

      if (absX > absY) {
        if (dx > 0) {
          state.right = true;
          state.lastSwipe = "right";
        } else {
          state.left = true;
          state.lastSwipe = "left";
        }
      } else {
        if (dy > 0) {
          state.down = true;
          state.lastSwipe = "down";
        } else {
          state.up = true;
          state.lastSwipe = "up";
        }
      }

      window.setTimeout(() => {
        resetDirections();
      }, 120);
    };

    const preventGesture = (event) => {
      if (!rootElement) return;
      if (rootElement.contains(event.target)) {
        event.preventDefault();
      }
    };

    const onKeyDown = (event) => {
      const direction = keyMap[event.code];
      if (!direction) return;
      setDirection(direction, true);
      event.preventDefault();
    };

    const onKeyUp = (event) => {
      const direction = keyMap[event.code];
      if (!direction) return;
      setDirection(direction, false);
      event.preventDefault();
    };

    const onTouchStart = (event) => {
      if (!rootElement || !rootElement.contains(event.target)) return;

      const touch = event.changedTouches[0];
      if (!touch) return;

      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchMoved = false;
      state.pointerDown = true;

      event.preventDefault();
    };

    const onTouchMove = (event) => {
      if (!rootElement || !rootElement.contains(event.target)) return;
      touchMoved = true;
      event.preventDefault();
    };

    const onTouchEnd = (event) => {
      if (!rootElement || !rootElement.contains(event.target)) return;

      const touch = event.changedTouches[0];
      if (!touch) return;

      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;

      state.pointerDown = false;

      if (!touchMoved && Math.abs(dx) < swipeThreshold && Math.abs(dy) < swipeThreshold) {
        triggerTap();
        state.lastSwipe = "tap";
      } else {
        applySwipe(dx, dy);
      }

      event.preventDefault();
    };

    const onTouchCancel = () => {
      state.pointerDown = false;
      touchMoved = false;
      resetDirections();
    };

    const onMouseDown = (event) => {
      if (!rootElement || !rootElement.contains(event.target)) return;
      state.pointerDown = true;
    };

    const onMouseUp = (event) => {
      if (!rootElement || !rootElement.contains(event.target)) return;
      state.pointerDown = false;
      triggerTap();
    };

    const createVirtualControls = () => {
      const controls = document.createElement("div");
      controls.className = "mini-game-touch-controls";
      controls.innerHTML = `
        <button type="button" class="mini-game-touch-btn up" data-dir="up" aria-label="ขึ้น">▲</button>
        <div class="mini-game-touch-row">
          <button type="button" class="mini-game-touch-btn left" data-dir="left" aria-label="ซ้าย">◀</button>
          <button type="button" class="mini-game-touch-btn down" data-dir="down" aria-label="ลง">▼</button>
          <button type="button" class="mini-game-touch-btn right" data-dir="right" aria-label="ขวา">▶</button>
        </div>
      `;

      const buttons = controls.querySelectorAll("[data-dir]");

      const pressHandler = (event) => {
        const button = event.currentTarget;
        const dir = button.getAttribute("data-dir");
        if (!dir) return;
        setDirection(dir, true);
        event.preventDefault();
      };

      const releaseHandler = (event) => {
        const button = event.currentTarget;
        const dir = button.getAttribute("data-dir");
        if (!dir) return;
        setDirection(dir, false);
        event.preventDefault();
      };

      buttons.forEach((button) => {
        button.addEventListener("touchstart", pressHandler, { passive: false });
        button.addEventListener("touchend", releaseHandler, { passive: false });
        button.addEventListener("touchcancel", releaseHandler, { passive: false });
        button.addEventListener("mousedown", pressHandler);
        button.addEventListener("mouseup", releaseHandler);
        button.addEventListener("mouseleave", releaseHandler);
      });

      return controls;
    };

    const ensureTouchStyles = () => {
      if (document.getElementById("mini-game-touch-style")) return;

      const style = document.createElement("style");
      style.id = "mini-game-touch-style";
      style.textContent = `
        .mini-game-touch-area {
          touch-action: none;
          -webkit-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
        }

        .mini-game-touch-controls {
          position: absolute;
          left: 50%;
          bottom: 12px;
          transform: translateX(-50%);
          z-index: 30;
          display: none;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          pointer-events: auto;
        }

        .mini-game-touch-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mini-game-touch-btn {
          width: 52px;
          height: 52px;
          border: none;
          border-radius: 14px;
          background: rgba(20, 20, 20, 0.78);
          color: #ffffff;
          font-size: 22px;
          font-weight: 700;
          backdrop-filter: blur(6px);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
          touch-action: none;
        }

        .mini-game-touch-btn:active {
          transform: scale(0.95);
        }

        @media (max-width: 900px), (pointer: coarse) {
          .mini-game-touch-controls {
            display: flex;
          }
        }
      `;
      document.head.appendChild(style);
    };

    const attach = (element, config = {}) => {
      if (!element) return null;

      detach();

      rootElement = element;
      ensureTouchStyles();

      rootElement.classList.add("mini-game-touch-area");
      if (getComputedStyle(rootElement).position === "static") {
        rootElement.style.position = "relative";
      }

      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      document.addEventListener("touchstart", onTouchStart, { passive: false });
      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onTouchEnd, { passive: false });
      document.addEventListener("touchcancel", onTouchCancel, { passive: false });
      document.addEventListener("gesturestart", preventGesture, { passive: false });
      rootElement.addEventListener("mousedown", onMouseDown);
      rootElement.addEventListener("mouseup", onMouseUp);

      cleanupFns.push(() => window.removeEventListener("keydown", onKeyDown));
      cleanupFns.push(() => window.removeEventListener("keyup", onKeyUp));
      cleanupFns.push(() =>
        document.removeEventListener("touchstart", onTouchStart, { passive: false })
      );
      cleanupFns.push(() =>
        document.removeEventListener("touchmove", onTouchMove, { passive: false })
      );
      cleanupFns.push(() =>
        document.removeEventListener("touchend", onTouchEnd, { passive: false })
      );
      cleanupFns.push(() =>
        document.removeEventListener("touchcancel", onTouchCancel, { passive: false })
      );
      cleanupFns.push(() =>
        document.removeEventListener("gesturestart", preventGesture, { passive: false })
      );
      cleanupFns.push(() => rootElement.removeEventListener("mousedown", onMouseDown));
      cleanupFns.push(() => rootElement.removeEventListener("mouseup", onMouseUp));

      if (config.showVirtualControls !== false) {
        const controls = createVirtualControls();
        rootElement.appendChild(controls);
        cleanupFns.push(() => controls.remove());
      }

      return {
        state,
        detach
      };
    };

    const detach = () => {
      cleanupFns.forEach((fn) => fn());
      cleanupFns = [];
      resetDirections();
      state.tap = false;
      state.pointerDown = false;
      state.lastSwipe = null;

      if (rootElement) {
        rootElement.classList.remove("mini-game-touch-area");
      }

      rootElement = null;
    };

    const consumeTap = () => {
      const value = state.tap;
      state.tap = false;
      return value;
    };

    return {
      state,
      attach,
      detach,
      resetDirections,
      consumeTap
    };
  }
};