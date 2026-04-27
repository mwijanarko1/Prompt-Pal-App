module.exports = {
  NanoAssistant: {
    getCooldownStatus: jest.fn(() => ({ isOnCooldown: false, remainingMs: 0 })),
    getHintsRemaining: jest.fn(() => 4),
    getMaxHintsPerLevel: jest.fn(() => 4),
    getHintsUsed: jest.fn(() => 0),
    getHint: jest.fn(() => Promise.resolve('Try adding more detail.')),
    resetHintsForLevel: jest.fn(),
    getNextHintPenaltyDescription: jest.fn(() => 'Next hint: -5% score'),
  },
};
