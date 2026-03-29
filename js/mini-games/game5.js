//js/mini-games/game5.js
window.MiniGameShared.register("game5", (config = {}) => {
  const duration = Number(config.duration) || 10;
  const bonusPerCatch = Number(config.bonusPerCatch) || 1;

  return {
    id: "game5",
    title: "ตำน้ำพริกละลายแม่น้ำ",
    description: `ควบคุมครกไปเก็บเม็ดพริกให้ได้มากที่สุดภายใน ${duration} วินาที`,
    overlayTitle: "มินิเกม: ตำน้ำพริกละลายแม่น้ำ",
    overlayDescription: "ใช้ปุ่ม W A S D หรือปุ่มลูกศร เก็บพริกให้ได้มากที่สุดก่อนจะละลายหายไป",
    playerEmoji: "🥣",
    enemyEmoji: "🌶️",
    themeClass: "theme-mortar",
    duration,
    bonusPerCatch,
    playerSpeed: 4.1,
    enemyCount: 6,
    enemySize: 40,
    enemySpeedLimit: 2.6,
    enemyRunDistance: 180,
    enemyClassName: "enemy enemy-fast",
    finishText(score) {
      return `จบมินิเกม! เก็บพริกได้ ${score} เม็ด รับโบนัส +${score} คะแนน`;
    }
  };
});