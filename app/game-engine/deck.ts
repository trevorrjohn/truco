import { Card, Suit, Rank } from './types';

/**
 * Deck utilities for card management, creation, and shuffling
 */

// Spanish Truco deck configuration (40 cards - no 8s, 9s, 10s)
const SPANISH_RANKS = [
  Rank.FOUR, Rank.FIVE, Rank.SIX, Rank.SEVEN,
  Rank.QUEEN, Rank.JACK, Rank.KING, Rank.ACE,
  Rank.TWO, Rank.THREE
];

// French deck configuration (52 cards - all ranks)
const FRENCH_RANKS = [
  Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX, Rank.SEVEN,
  Rank.QUEEN, Rank.JACK, Rank.KING, Rank.ACE
];

const ALL_SUITS = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];

/**
 * Creates a new deck of cards based on the specified type
 */
export function createDeck(deckType: 'spanish' | 'french' = 'spanish'): Card[] {
  const ranks = deckType === 'spanish' ? SPANISH_RANKS : FRENCH_RANKS;
  const deck: Card[] = [];

  ALL_SUITS.forEach(suit => {
    ranks.forEach(rank => {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank
      });
    });
  });

  return deck;
}

/**
 * Shuffles an array of cards using Fisher-Yates algorithm
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Deals cards from the deck to players
 */
export function dealCards(
  deck: Card[],
  numPlayers: number,
  cardsPerPlayer: number
): { hands: Card[][], remainingDeck: Card[] } {
  const shuffledDeck = shuffleDeck(deck);
  const hands: Card[][] = Array(numPlayers).fill(null).map(() => []);

  // Deal cards round-robin style
  for (let cardIndex = 0; cardIndex < cardsPerPlayer * numPlayers; cardIndex++) {
    const playerIndex = cardIndex % numPlayers;
    const card = shuffledDeck[cardIndex];

    if (card) {
      hands[playerIndex].push(card);
    }
  }

  const remainingDeck = shuffledDeck.slice(cardsPerPlayer * numPlayers);

  return { hands, remainingDeck };
}

/**
 * Gets the card power value for Truco game rules
 * Higher values beat lower values
 */
export function getCardPower(card: Card): number {
  const { suit, rank } = card;

  // Special manilhas (trump cards) in Truco
  // These change based on the vira (turned card), but this is a basic implementation
  const powerMap: Record<string, number> = {
    // Regular cards (lowest)
    '4': 1,
    '5': 2,
    '6': 3,
    '7': 4,
    'Q': 5,
    'J': 6,
    'K': 7,
    'A': 8,
    '2': 9,
    '3': 10,

    // Manilhas (highest) - this is simplified, normally depends on vira
    'manilha-clubs': 11,
    'manilha-hearts': 12,
    'manilha-spades': 13,
    'manilha-diamonds': 14,
  };

  return powerMap[rank] || 0;
}

/**
 * Compares two cards to determine which one wins
 * Returns 1 if card1 wins, -1 if card2 wins, 0 if tie
 */
export function compareCards(card1: Card, card2: Card): number {
  const power1 = getCardPower(card1);
  const power2 = getCardPower(card2);

  if (power1 > power2) return 1;
  if (power1 < power2) return -1;
  return 0;
}

/**
 * Finds the winning card from an array of played cards
 */
export function findWinningCard(playedCards: { card: Card; playerId: string }[]): { card: Card; playerId: string } | null {
  if (playedCards.length === 0) return null;

  return playedCards.reduce((winner, current) => {
    if (!winner || compareCards(current.card, winner.card) > 0) {
      return current;
    }
    return winner;
  });
}

/**
 * Validates if a card exists in a player's hand
 */
export function isValidPlay(card: Card, playerHand: Card[]): boolean {
  return playerHand.some(handCard => handCard.id === card.id);
}

/**
 * Removes a card from a player's hand
 */
export function removeCardFromHand(card: Card, hand: Card[]): Card[] {
  return hand.filter(handCard => handCard.id !== card.id);
}

/**
 * Gets a human-readable card name
 */
export function getCardName(card: Card): string {
  const suitNames = {
    [Suit.HEARTS]: 'Hearts',
    [Suit.DIAMONDS]: 'Diamonds',
    [Suit.CLUBS]: 'Clubs',
    [Suit.SPADES]: 'Spades'
  };

  const rankNames = {
    [Rank.ACE]: 'Ace',
    [Rank.TWO]: '2',
    [Rank.THREE]: '3',
    [Rank.FOUR]: '4',
    [Rank.FIVE]: '5',
    [Rank.SIX]: '6',
    [Rank.SEVEN]: '7',
    [Rank.JACK]: 'Jack',
    [Rank.QUEEN]: 'Queen',
    [Rank.KING]: 'King'
  };

  return `${rankNames[card.rank]} of ${suitNames[card.suit]}`;
}

/**
 * Validates deck integrity (no duplicates, correct number of cards)
 */
export function validateDeck(deck: Card[], deckType: 'spanish' | 'french' = 'spanish'): boolean {
  const expectedSize = deckType === 'spanish' ? 40 : 52;

  if (deck.length !== expectedSize) return false;

  const cardIds = new Set(deck.map(card => card.id));
  return cardIds.size === deck.length; // No duplicates
}
