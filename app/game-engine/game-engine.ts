import {
  GameState,
  GameConfig,
  Player,
  Team,
  Round,
  Trick,
  Card,
  PlayedCard,
  GamePhase,
  TrucoCall,
  GameAction,
  GameActionPayload,
  GameError
} from './types';
import {
  createDeck,
  shuffleDeck,
  dealCards,
  findWinningCard,
  isValidPlay,
  removeCardFromHand
} from './deck';

/**
 * Main game engine for managing game state, rules, and player actions
 */
export class GameEngine {
  private gameState: GameState;
  private config: GameConfig;
  private eventListeners: ((event: any) => void)[] = [];

  constructor(config: GameConfig) {
    this.config = config;
    this.gameState = this.initializeGame();
  }

  /**
   * Initialize a new game state
   */
  private initializeGame(): GameState {
    return {
      id: this.generateId(),
      phase: GamePhase.WAITING,
      players: [],
      teams: [],
      deck: [],
      currentRound: null,
      rounds: [],
      currentPlayerIndex: 0,
      maxScore: this.config.maxScore,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  /**
   * Get current game state (readonly)
   */
  public getGameState(): Readonly<GameState> {
    return { ...this.gameState };
  }

  /**
   * Add event listener for game events
   */
  public addEventListener(listener: (event: any) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(listener: (event: any) => void): void {
    this.eventListeners = this.eventListeners.filter(l => l !== listener);
  }

  /**
   * Emit game event to all listeners
   */
  private emit(eventType: string, payload: any, playerId?: string): void {
    const event = {
      type: eventType,
      payload,
      timestamp: Date.now(),
      playerId
    };

    this.eventListeners.forEach(listener => listener(event));
  }

  /**
   * Process a game action
   */
  public processAction(action: GameActionPayload): void {
    try {
      switch (action.type) {
        case GameAction.JOIN_GAME:
          this.handleJoinGame(action.playerId, action.data);
          break;
        case GameAction.LEAVE_GAME:
          this.handleLeaveGame(action.playerId);
          break;
        case GameAction.READY_PLAYER:
          this.handleReadyPlayer(action.playerId);
          break;
        case GameAction.START_GAME:
          this.handleStartGame(action.playerId);
          break;
        case GameAction.PLAY_CARD:
          this.handlePlayCard(action.playerId, action.data.cardId);
          break;
        case GameAction.CALL_TRUCO:
          this.handleCallTruco(action.playerId, action.data.call);
          break;
        case GameAction.ACCEPT_TRUCO:
          this.handleAcceptTruco(action.playerId);
          break;
        case GameAction.REJECT_TRUCO:
          this.handleRejectTruco(action.playerId);
          break;
        default:
          throw new GameError(`Unknown action type: ${action.type}`, 'INVALID_ACTION');
      }

      this.gameState.updatedAt = Date.now();
    } catch (error) {
      if (error instanceof GameError) {
        this.emit('game_error', { message: error.message, code: error.code }, error.playerId);
      } else {
        this.emit('game_error', { message: 'Unknown error occurred', code: 'UNKNOWN' });
      }
    }
  }

  /**
   * Handle player joining the game
   */
  private handleJoinGame(playerId: string, playerData: { name: string }): void {
    if (this.gameState.phase !== GamePhase.WAITING) {
      throw new GameError('Cannot join game that has already started', 'GAME_IN_PROGRESS', playerId);
    }

    if (this.gameState.players.length >= this.config.maxPlayers) {
      throw new GameError('Game is full', 'GAME_FULL', playerId);
    }

    if (this.gameState.players.some(p => p.id === playerId)) {
      throw new GameError('Player already in game', 'PLAYER_EXISTS', playerId);
    }

    const newPlayer: Player = {
      id: playerId,
      name: playerData.name,
      hand: [],
      score: 0,
      isReady: false,
      isActive: false
    };

    this.gameState.players.push(newPlayer);
    this.emit('player_joined', { player: newPlayer });

    // Auto-create teams if using team mode
    if (this.config.useTeams) {
      this.updateTeams();
    }
  }

  /**
   * Handle player leaving the game
   */
  private handleLeaveGame(playerId: string): void {
    const playerIndex = this.gameState.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      throw new GameError('Player not in game', 'PLAYER_NOT_FOUND', playerId);
    }

    this.gameState.players.splice(playerIndex, 1);

    // Adjust current player index if necessary
    if (this.gameState.currentPlayerIndex >= this.gameState.players.length) {
      this.gameState.currentPlayerIndex = 0;
    }

    this.emit('player_left', { playerId });

    // End game if not enough players
    if (this.gameState.players.length < this.config.minPlayers && this.gameState.phase === GamePhase.PLAYING) {
      this.endGame('Not enough players');
    }

    if (this.config.useTeams) {
      this.updateTeams();
    }
  }

  /**
   * Handle player ready state
   */
  private handleReadyPlayer(playerId: string): void {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) {
      throw new GameError('Player not found', 'PLAYER_NOT_FOUND', playerId);
    }

    player.isReady = !player.isReady;
    this.emit('player_ready_changed', { playerId, isReady: player.isReady });
  }

  /**
   * Handle starting the game
   */
  private handleStartGame(playerId: string): void {
    if (this.gameState.phase !== GamePhase.WAITING) {
      throw new GameError('Game already started', 'GAME_IN_PROGRESS', playerId);
    }

    if (this.gameState.players.length < this.config.minPlayers) {
      throw new GameError('Not enough players', 'NOT_ENOUGH_PLAYERS', playerId);
    }

    if (!this.gameState.players.every(p => p.isReady)) {
      throw new GameError('Not all players are ready', 'PLAYERS_NOT_READY', playerId);
    }

    this.startNewRound();
    this.emit('game_started', {});
  }

  /**
   * Handle playing a card
   */
  private handlePlayCard(playerId: string, cardId: string): void {
    if (this.gameState.phase !== GamePhase.PLAYING) {
      throw new GameError('Game not in playing phase', 'INVALID_PHASE', playerId);
    }

    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) {
      throw new GameError('Player not found', 'PLAYER_NOT_FOUND', playerId);
    }

    if (!player.isActive) {
      throw new GameError('Not your turn', 'NOT_YOUR_TURN', playerId);
    }

    const card = player.hand.find(c => c.id === cardId);
    if (!card) {
      throw new GameError('Card not in hand', 'INVALID_CARD', playerId);
    }

    if (!this.gameState.currentRound?.currentTrick) {
      throw new GameError('No active trick', 'NO_ACTIVE_TRICK', playerId);
    }

    // Play the card
    this.playCard(player, card);
  }

  /**
   * Handle truco call
   */
  private handleCallTruco(playerId: string, call: TrucoCall): void {
    if (!this.gameState.currentRound) {
      throw new GameError('No active round', 'NO_ACTIVE_ROUND', playerId);
    }

    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) {
      throw new GameError('Player not found', 'PLAYER_NOT_FOUND', playerId);
    }

    // Validate truco call progression
    const currentCall = this.gameState.currentRound.trucoCall;
    if (!this.isValidTrucoCall(currentCall, call)) {
      throw new GameError('Invalid truco call', 'INVALID_TRUCO_CALL', playerId);
    }

    this.gameState.currentRound.trucoCall = call;
    this.gameState.currentRound.calledBy = playerId;
    this.gameState.currentRound.trucoValue = this.getTrucoValue(call);

    this.emit('truco_called', { playerId, call, value: this.gameState.currentRound.trucoValue });
  }

  /**
   * Start a new round
   */
  private startNewRound(): void {
    this.gameState.phase = GamePhase.DEALING;

    const newRound: Round = {
      id: this.generateId(),
      number: this.gameState.rounds.length + 1,
      tricks: [],
      currentTrick: null,
      trucoCall: TrucoCall.NONE,
      trucoValue: 1,
      calledBy: null,
      acceptedBy: null
    };

    // Create and shuffle deck
    this.gameState.deck = shuffleDeck(createDeck(this.config.deckType));

    // Deal cards to players
    const { hands } = dealCards(
      this.gameState.deck,
      this.gameState.players.length,
      this.config.handSize
    );

    hands.forEach((hand, index) => {
      this.gameState.players[index].hand = hand;
    });

    this.gameState.currentRound = newRound;
    this.gameState.rounds.push(newRound);
    this.gameState.phase = GamePhase.PLAYING;

    // Start first trick
    this.startNewTrick();

    this.emit('round_started', { round: newRound });
  }

  /**
   * Start a new trick within the current round
   */
  private startNewTrick(): void {
    if (!this.gameState.currentRound) return;

    const trickNumber = this.gameState.currentRound.tricks.length + 1;
    const newTrick: Trick = {
      id: this.generateId(),
      number: trickNumber,
      cardsPlayed: [],
      winner: null,
      isComplete: false
    };

    this.gameState.currentRound.currentTrick = newTrick;
    this.gameState.currentRound.tricks.push(newTrick);

    // Set the first player active
    this.gameState.players.forEach(p => p.isActive = false);
    if (this.gameState.players[this.gameState.currentPlayerIndex]) {
      this.gameState.players[this.gameState.currentPlayerIndex].isActive = true;
    }

    this.emit('trick_started', { trick: newTrick });
  }

  /**
   * Play a card from a player's hand
   */
  private playCard(player: Player, card: Card): void {
    if (!this.gameState.currentRound?.currentTrick) return;

    const playedCard: PlayedCard = {
      card,
      playerId: player.id,
      timestamp: Date.now()
    };

    // Add card to trick
    this.gameState.currentRound.currentTrick.cardsPlayed.push(playedCard);

    // Remove card from player's hand
    player.hand = removeCardFromHand(card, player.hand);
    player.isActive = false;

    this.emit('card_played', { playerId: player.id, card, trick: this.gameState.currentRound.currentTrick });

    // Check if trick is complete
    if (this.gameState.currentRound.currentTrick.cardsPlayed.length === this.gameState.players.length) {
      this.completeTrick();
    } else {
      this.nextPlayer();
    }
  }

  /**
   * Complete the current trick
   */
  private completeTrick(): void {
    if (!this.gameState.currentRound?.currentTrick) return;

    const trick = this.gameState.currentRound.currentTrick;
    const winningPlay = findWinningCard(trick.cardsPlayed.map(pc => ({ card: pc.card, playerId: pc.playerId })));

    if (winningPlay) {
      trick.winner = winningPlay.playerId;
      trick.isComplete = true;

      // Set winner as next starting player
      const winnerIndex = this.gameState.players.findIndex(p => p.id === winningPlay.playerId);
      if (winnerIndex !== -1) {
        this.gameState.currentPlayerIndex = winnerIndex;
      }

      this.emit('trick_completed', { trick, winnerId: winningPlay.playerId });

      // Check if round is complete (3 tricks played or someone won 2 tricks)
      if (this.isRoundComplete()) {
        this.completeRound();
      } else {
        this.startNewTrick();
      }
    }
  }

  /**
   * Check if the current round is complete
   */
  private isRoundComplete(): boolean {
    if (!this.gameState.currentRound) return false;

    const tricks = this.gameState.currentRound.tricks;
    if (tricks.length < 2) return false;

    // Count tricks won by each player
    const trickWins: Record<string, number> = {};
    tricks.forEach(trick => {
      if (trick.winner) {
        trickWins[trick.winner] = (trickWins[trick.winner] || 0) + 1;
      }
    });

    // Someone won 2 out of 3 tricks
    const maxWins = Math.max(...Object.values(trickWins));
    return maxWins >= 2 || tricks.length >= 3;
  }

  /**
   * Complete the current round and update scores
   */
  private completeRound(): void {
    if (!this.gameState.currentRound) return;

    this.gameState.phase = GamePhase.ROUND_END;

    // Determine round winner
    const roundWinner = this.determineRoundWinner();
    if (roundWinner) {
      const winnerPlayer = this.gameState.players.find(p => p.id === roundWinner);
      if (winnerPlayer) {
        winnerPlayer.score += this.gameState.currentRound.trucoValue;
      }
    }

    this.emit('round_completed', {
      round: this.gameState.currentRound,
      winnerId: roundWinner,
      points: this.gameState.currentRound.trucoValue
    });

    // Check for game end
    if (this.isGameComplete()) {
      this.endGame();
    } else {
      // Start new round after delay
      setTimeout(() => {
        this.startNewRound();
      }, 2000);
    }
  }

  /**
   * Determine the winner of the current round
   */
  private determineRoundWinner(): string | null {
    if (!this.gameState.currentRound) return null;

    const tricks = this.gameState.currentRound.tricks.filter(t => t.isComplete);
    const trickWins: Record<string, number> = {};

    tricks.forEach(trick => {
      if (trick.winner) {
        trickWins[trick.winner] = (trickWins[trick.winner] || 0) + 1;
      }
    });

    // Find player with most trick wins
    let maxWins = 0;
    let winner = null;

    Object.entries(trickWins).forEach(([playerId, wins]) => {
      if (wins > maxWins) {
        maxWins = wins;
        winner = playerId;
      }
    });

    return winner;
  }

  /**
   * Check if the game is complete
   */
  private isGameComplete(): boolean {
    return this.gameState.players.some(player => player.score >= this.gameState.maxScore);
  }

  /**
   * End the game
   */
  private endGame(reason?: string): void {
    this.gameState.phase = GamePhase.GAME_END;

    const winner = this.gameState.players.reduce((prev, current) =>
      prev.score > current.score ? prev : current
    );

    this.emit('game_ended', {
      winner: winner.id,
      finalScores: this.gameState.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
      reason
    });
  }

  /**
   * Move to the next player's turn
   */
  private nextPlayer(): void {
    this.gameState.players.forEach(p => p.isActive = false);

    this.gameState.currentPlayerIndex =
      (this.gameState.currentPlayerIndex + 1) % this.gameState.players.length;

    if (this.gameState.players[this.gameState.currentPlayerIndex]) {
      this.gameState.players[this.gameState.currentPlayerIndex].isActive = true;
    }

    this.emit('turn_changed', {
      currentPlayerId: this.gameState.players[this.gameState.currentPlayerIndex]?.id
    });
  }

  /**
   * Update team configuration
   */
  private updateTeams(): void {
    if (!this.config.useTeams) return;

    this.gameState.teams = [];

    // Simple 2-team setup for now
    const team1Players = this.gameState.players.filter((_, index) => index % 2 === 0);
    const team2Players = this.gameState.players.filter((_, index) => index % 2 === 1);

    if (team1Players.length > 0) {
      this.gameState.teams.push({
        id: 'team1',
        name: 'Team 1',
        players: team1Players,
        score: team1Players.reduce((sum, p) => sum + p.score, 0)
      });
    }

    if (team2Players.length > 0) {
      this.gameState.teams.push({
        id: 'team2',
        name: 'Team 2',
        players: team2Players,
        score: team2Players.reduce((sum, p) => sum + p.score, 0)
      });
    }
  }

  /**
   * Validate truco call progression
   */
  private isValidTrucoCall(current: TrucoCall, requested: TrucoCall): boolean {
    const callOrder = [TrucoCall.NONE, TrucoCall.TRUCO, TrucoCall.RETRUCO, TrucoCall.VALE_CUATRO];
    const currentIndex = callOrder.indexOf(current);
    const requestedIndex = callOrder.indexOf(requested);

    return requestedIndex === currentIndex + 1;
  }

  /**
   * Get point value for truco call
   */
  private getTrucoValue(call: TrucoCall): number {
    const values = {
      [TrucoCall.NONE]: 1,
      [TrucoCall.TRUCO]: 2,
      [TrucoCall.RETRUCO]: 3,
      [TrucoCall.VALE_CUATRO]: 4
    };

    return values[call] || 1;
  }

  /**
   * Handle accepting truco
   */
  private handleAcceptTruco(playerId: string): void {
    if (!this.gameState.currentRound) {
      throw new GameError('No active round', 'NO_ACTIVE_ROUND', playerId);
    }

    this.gameState.currentRound.acceptedBy = playerId;
    this.emit('truco_accepted', { playerId, value: this.gameState.currentRound.trucoValue });
  }

  /**
   * Handle rejecting truco
   */
  private handleRejectTruco(playerId: string): void {
    if (!this.gameState.currentRound) {
      throw new GameError('No active round', 'NO_ACTIVE_ROUND', playerId);
    }

    // Award points to the caller and end round
    if (this.gameState.currentRound.calledBy) {
      const caller = this.gameState.players.find(p => p.id === this.gameState.currentRound!.calledBy);
      if (caller) {
        caller.score += 1; // Base point for rejected truco
      }
    }

    this.emit('truco_rejected', { playerId });
    this.completeRound();
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}
