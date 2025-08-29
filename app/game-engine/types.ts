// Core game types and interfaces for card game mechanics

export enum Suit {
  HEARTS = 'hearts',
  DIAMONDS = 'diamonds',
  CLUBS = 'clubs',
  SPADES = 'spades'
}

export enum Rank {
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  QUEEN = 'Q',
  JACK = 'J',
  KING = 'K',
  ACE = 'A',
  TWO = '2',
  THREE = '3'
}

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string; // Unique identifier for each card
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  score: number;
  isReady: boolean;
  isActive: boolean; // Current turn indicator
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  score: number;
}

export enum GamePhase {
  WAITING = 'waiting',
  DEALING = 'dealing',
  PLAYING = 'playing',
  ROUND_END = 'round_end',
  GAME_END = 'game_end'
}

export enum TrucoCall {
  NONE = 'none',
  TRUCO = 'truco',
  RETRUCO = 'retruco',
  VALE_CUATRO = 'vale_cuatro'
}

export interface Round {
  id: string;
  number: number;
  tricks: Trick[];
  currentTrick: Trick | null;
  trucoCall: TrucoCall;
  trucoValue: number; // Points this round is worth
  calledBy: string | null; // Player ID who called truco
  acceptedBy: string | null; // Player ID who accepted truco
}

export interface Trick {
  id: string;
  number: number; // 1, 2, or 3 for each round
  cardsPlayed: PlayedCard[];
  winner: string | null; // Player ID
  isComplete: boolean;
}

export interface PlayedCard {
  card: Card;
  playerId: string;
  timestamp: number;
}

export interface GameState {
  id: string;
  phase: GamePhase;
  players: Player[];
  teams: Team[];
  deck: Card[];
  currentRound: Round | null;
  rounds: Round[];
  currentPlayerIndex: number;
  maxScore: number; // Game ends when a team reaches this score
  createdAt: number;
  updatedAt: number;
}

export interface GameConfig {
  maxPlayers: number;
  minPlayers: number;
  maxScore: number;
  useTeams: boolean;
  deckType: 'spanish' | 'french'; // Spanish deck (40 cards) vs French deck (52 cards)
  handSize: number;
}

export enum GameAction {
  JOIN_GAME = 'join_game',
  LEAVE_GAME = 'leave_game',
  READY_PLAYER = 'ready_player',
  START_GAME = 'start_game',
  DEAL_CARDS = 'deal_cards',
  PLAY_CARD = 'play_card',
  CALL_TRUCO = 'call_truco',
  ACCEPT_TRUCO = 'accept_truco',
  REJECT_TRUCO = 'reject_truco',
  NEXT_ROUND = 'next_round',
  END_GAME = 'end_game'
}

export interface GameActionPayload {
  type: GameAction;
  playerId: string;
  data?: any;
}

// Error types for game validation
export class GameError extends Error {
  constructor(
    message: string,
    public code: string,
    public playerId?: string
  ) {
    super(message);
    this.name = 'GameError';
  }
}

// Utility type for game events
export interface GameEvent {
  type: string;
  payload: any;
  timestamp: number;
  playerId?: string;
}
