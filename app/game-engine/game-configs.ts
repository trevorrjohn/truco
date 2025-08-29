import { GameConfig } from './types';

/**
 * Default game configurations for different types of card games
 */

export const DEFAULT_TRUCO_CONFIG: GameConfig = {
  maxPlayers: 6,
  minPlayers: 2,
  maxScore: 15,
  useTeams: false,
  deckType: 'spanish',
  handSize: 3,
};

export const TEAM_TRUCO_CONFIG: GameConfig = {
  maxPlayers: 4,
  minPlayers: 4,
  maxScore: 15,
  useTeams: true,
  deckType: 'spanish',
  handSize: 3,
};

export const QUICK_TRUCO_CONFIG: GameConfig = {
  maxPlayers: 4,
  minPlayers: 2,
  maxScore: 9,
  useTeams: false,
  deckType: 'spanish',
  handSize: 3,
};

export const EXTENDED_TRUCO_CONFIG: GameConfig = {
  maxPlayers: 6,
  minPlayers: 2,
  maxScore: 30,
  useTeams: false,
  deckType: 'spanish',
  handSize: 3,
};

// For other card games that might use French deck
export const POKER_STYLE_CONFIG: GameConfig = {
  maxPlayers: 8,
  minPlayers: 2,
  maxScore: 100,
  useTeams: false,
  deckType: 'french',
  handSize: 5,
};

export const BRIDGE_STYLE_CONFIG: GameConfig = {
  maxPlayers: 4,
  minPlayers: 4,
  maxScore: 500,
  useTeams: true,
  deckType: 'french',
  handSize: 13,
};

/**
 * Get a game configuration by name
 */
export function getGameConfig(configName: string): GameConfig {
  const configs: Record<string, GameConfig> = {
    'default': DEFAULT_TRUCO_CONFIG,
    'team': TEAM_TRUCO_CONFIG,
    'quick': QUICK_TRUCO_CONFIG,
    'extended': EXTENDED_TRUCO_CONFIG,
    'poker': POKER_STYLE_CONFIG,
    'bridge': BRIDGE_STYLE_CONFIG,
  };

  return configs[configName] || DEFAULT_TRUCO_CONFIG;
}

/**
 * Validate a game configuration
 */
export function validateGameConfig(config: GameConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.minPlayers < 1) {
    errors.push('Minimum players must be at least 1');
  }

  if (config.maxPlayers < config.minPlayers) {
    errors.push('Maximum players must be greater than or equal to minimum players');
  }

  if (config.maxScore <= 0) {
    errors.push('Maximum score must be greater than 0');
  }

  if (config.handSize <= 0) {
    errors.push('Hand size must be greater than 0');
  }

  if (config.useTeams && config.maxPlayers % 2 !== 0) {
    errors.push('Team games require an even number of players');
  }

  if (config.deckType === 'spanish' && config.handSize * config.maxPlayers > 40) {
    errors.push('Spanish deck has only 40 cards - not enough for this configuration');
  }

  if (config.deckType === 'french' && config.handSize * config.maxPlayers > 52) {
    errors.push('French deck has only 52 cards - not enough for this configuration');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create a custom game configuration
 */
export function createCustomConfig(
  options: Partial<GameConfig> & { minPlayers: number; maxPlayers: number }
): GameConfig {
  return {
    ...DEFAULT_TRUCO_CONFIG,
    ...options,
  };
}
