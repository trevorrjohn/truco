// Game Engine - Main exports
export * from './types';
export * from './deck';
export * from './game-engine';
export * from './game-context';
export * from './game-configs';

// Re-export commonly used items for convenience
export {
  GameEngine,
  type GameState,
  type GameConfig,
  type Player,
  type Card,
  GamePhase,
  GameAction,
  TrucoCall
} from './types';

export {
  createDeck,
  shuffleDeck,
  dealCards,
  getCardName,
  compareCards
} from './deck';

export {
  GameProvider,
  useGame,
  useGameActions,
  useGameQuery
} from './game-context';

export {
  DEFAULT_TRUCO_CONFIG,
  TEAM_TRUCO_CONFIG,
  QUICK_TRUCO_CONFIG,
  getGameConfig,
  validateGameConfig,
  createCustomConfig
} from './game-configs';
