const CONSTANTS = {
  VERSION: "0.0.1",

  levels: ["styx_level", "charon", "underworld_level", "hades"],
  playerMaxLives: 3,

  level_info: {
    styx_level: {
      music: { name: "River Styx.mp3", volume: 0.3 },
      timeStarCutoffs: [90, 120, 180],
    },
    charon: {
      music: { name: "Charon-Boss Fight.mp3", volume: 0.3 },
      timeStarCutoffs: [90, 120, 180],
    },
    underworld_level: {
      music: { name: "Bones and Demons -Decending baseline.mp3", volume: 0.3 },
      timeStarCutoffs: [90, 120, 180],
    },
    hades: {
      music: { name: "Final Boss.mp3", volume: 0.3 },
      timeStarCutoffs: [90, 120, 180],
    },
    harpy: {
      music: { name: "Harpy Chase!-More Intense.mp3", volume: 0.3 },
      timeStarCutoffs: [90, 120, 180],
    },
  },

  // levels: ['level_corgi', 'level_1', 'level_5', 'level_corgi'],
  unlockedLevels: [],
  completedLevels: [],
  DEBUG: false,

  // levels: ['level_1', 'level_5', 'level_7']
};
