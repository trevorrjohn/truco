import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { GameEngine } from './game-engine';
import { GameState, GameConfig, GameActionPayload, GameEvent } from './types';

interface GameContextType {
  gameState: GameState | null;
  gameEngine: GameEngine | null;
  dispatch: (action: GameActionPayload) => void;
  createGame: (config: GameConfig) => void;
  isConnected: boolean;
  error: string | null;
}

interface GameContextState {
  gameState: GameState | null;
  gameEngine: GameEngine | null;
  isConnected: boolean;
  error: string | null;
}

type GameContextAction =
  | { type: 'CREATE_GAME'; payload: { engine: GameEngine; state: GameState } }
  | { type: 'UPDATE_GAME_STATE'; payload: GameState }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_CONNECTED'; payload: boolean };

const initialState: GameContextState = {
  gameState: null,
  gameEngine: null,
  isConnected: false,
  error: null,
};

function gameContextReducer(state: GameContextState, action: GameContextAction): GameContextState {
  switch (action.type) {
    case 'CREATE_GAME':
      return {
        ...state,
        gameEngine: action.payload.engine,
        gameState: action.payload.state,
        isConnected: true,
        error: null,
      };
    case 'UPDATE_GAME_STATE':
      return {
        ...state,
        gameState: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_CONNECTED':
      return {
        ...state,
        isConnected: action.payload,
      };
    default:
      return state;
  }
}

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameContextReducer, initialState);

  const createGame = (config: GameConfig) => {
    try {
      const engine = new GameEngine(config);

      // Set up event listener for game state updates
      const handleGameEvent = (event: GameEvent) => {
        console.log('Game Event:', event);

        // Update game state on any game event
        const newState = engine.getGameState();
        dispatch({ type: 'UPDATE_GAME_STATE', payload: newState });

        // Handle specific events
        switch (event.type) {
          case 'game_error':
            dispatch({ type: 'SET_ERROR', payload: event.payload.message });
            break;
          case 'player_joined':
          case 'player_left':
          case 'game_started':
          case 'round_started':
          case 'card_played':
          case 'trick_completed':
          case 'round_completed':
          case 'game_ended':
            dispatch({ type: 'CLEAR_ERROR' });
            break;
        }
      };

      engine.addEventListener(handleGameEvent);

      const initialState = engine.getGameState();
      dispatch({
        type: 'CREATE_GAME',
        payload: { engine, state: initialState }
      });

    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to create game'
      });
    }
  };

  const dispatchAction = (action: GameActionPayload) => {
    if (!state.gameEngine) {
      dispatch({ type: 'SET_ERROR', payload: 'No active game' });
      return;
    }

    try {
      state.gameEngine.processAction(action);
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Action failed'
      });
    }
  };

  const contextValue: GameContextType = {
    gameState: state.gameState,
    gameEngine: state.gameEngine,
    dispatch: dispatchAction,
    createGame,
    isConnected: state.isConnected,
    error: state.error,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextType {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

// Custom hooks for specific game actions
export function useGameActions() {
  const { dispatch, gameState } = useGame();

  const joinGame = (playerId: string, playerName: string) => {
    dispatch({
      type: 'JOIN_GAME',
      playerId,
      data: { name: playerName }
    });
  };

  const leaveGame = (playerId: string) => {
    dispatch({
      type: 'LEAVE_GAME',
      playerId
    });
  };

  const readyPlayer = (playerId: string) => {
    dispatch({
      type: 'READY_PLAYER',
      playerId
    });
  };

  const startGame = (playerId: string) => {
    dispatch({
      type: 'START_GAME',
      playerId
    });
  };

  const playCard = (playerId: string, cardId: string) => {
    dispatch({
      type: 'PLAY_CARD',
      playerId,
      data: { cardId }
    });
  };

  const callTruco = (playerId: string, call: string) => {
    dispatch({
      type: 'CALL_TRUCO',
      playerId,
      data: { call }
    });
  };

  const acceptTruco = (playerId: string) => {
    dispatch({
      type: 'ACCEPT_TRUCO',
      playerId
    });
  };

  const rejectTruco = (playerId: string) => {
    dispatch({
      type: 'REJECT_TRUCO',
      playerId
    });
  };

  return {
    joinGame,
    leaveGame,
    readyPlayer,
    startGame,
    playCard,
    callTruco,
    acceptTruco,
    rejectTruco,
  };
}

// Custom hook for game state queries
export function useGameQuery() {
  const { gameState } = useGame();

  const getCurrentPlayer = () => {
    if (!gameState) return null;
    return gameState.players.find(p => p.isActive) || null;
  };

  const getPlayer = (playerId: string) => {
    if (!gameState) return null;
    return gameState.players.find(p => p.id === playerId) || null;
  };

  const getCurrentTrick = () => {
    if (!gameState?.currentRound) return null;
    return gameState.currentRound.currentTrick;
  };

  const getPlayerHand = (playerId: string) => {
    const player = getPlayer(playerId);
    return player?.hand || [];
  };

  const getScores = () => {
    if (!gameState) return [];
    return gameState.players.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score
    }));
  };

  const canPlayCard = (playerId: string) => {
    const player = getPlayer(playerId);
    return player?.isActive && gameState?.phase === 'playing';
  };

  const getRoundInfo = () => {
    if (!gameState?.currentRound) return null;
    return {
      roundNumber: gameState.currentRound.number,
      trucoCall: gameState.currentRound.trucoCall,
      trucoValue: gameState.currentRound.trucoValue,
      tricksCompleted: gameState.currentRound.tricks.filter(t => t.isComplete).length
    };
  };

  return {
    getCurrentPlayer,
    getPlayer,
    getCurrentTrick,
    getPlayerHand,
    getScores,
    canPlayCard,
    getRoundInfo,
  };
}
