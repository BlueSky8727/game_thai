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
  }
};