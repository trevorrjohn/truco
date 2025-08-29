import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import {
  useGame,
  useGameActions,
  useGameQuery,
  GamePhase,
  Card,
  TrucoCall,
} from "../game-engine";

const { width: screenWidth } = Dimensions.get("window");

export default function GamePlay() {
  const router = useRouter();
  const { gameState, error } = useGame();
  const { playCard, callTruco, acceptTruco, rejectTruco } = useGameActions();
  const {
    getCurrentPlayer,
    getPlayer,
    getCurrentTrick,
    getPlayerHand,
    canPlayCard,
    getRoundInfo,
    getScores,
  } = useGameQuery();

  const [currentPlayerId, setCurrentPlayerId] = useState("");
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  useEffect(() => {
    // Get player ID from previous screens or generate one
    // In a real app, this would be managed more robustly
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setCurrentPlayerId(playerId);
  }, []);

  useEffect(() => {
    // Handle game end
    if (gameState?.phase === GamePhase.GAME_END) {
      Alert.alert(
        "Game Over!",
        "The game has ended. Check the final scores.",
        [{ text: "OK", onPress: () => router.push("/games/results") }]
      );
    }
  }, [gameState?.phase]);

  const handleCardPlay = (card: Card) => {
    if (!currentPlayerId || !canPlayCard(currentPlayerId)) {
      Alert.alert("Not Your Turn", "Wait for your turn to play a card");
      return;
    }

    playCard(currentPlayerId, card.id);
    setSelectedCard(null);
  };

  const handleTrucoCall = (call: TrucoCall) => {
    if (!currentPlayerId) return;
    callTruco(currentPlayerId, call);
  };

  const handleTrucoResponse = (accept: boolean) => {
    if (!currentPlayerId) return;
    if (accept) {
      acceptTruco(currentPlayerId);
    } else {
      rejectTruco(currentPlayerId);
    }
  };

  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case "hearts":
        return "♥️";
      case "diamonds":
        return "♦️";
      case "clubs":
        return "♣️";
      case "spades":
        return "♠️";
      default:
        return "?";
    }
  };

  const getCardDisplayName = (card: Card) => {
    const rankNames: Record<string, string> = {
      "A": "A",
      "2": "2",
      "3": "3",
      "4": "4",
      "5": "5",
      "6": "6",
      "7": "7",
      "J": "J",
      "Q": "Q",
      "K": "K",
    };
    return `${rankNames[card.rank] || card.rank}${getSuitSymbol(card.suit)}`;
  };

  if (!gameState) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No active game</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (gameState.phase !== GamePhase.PLAYING) {
    return (
      <View style={styles.container}>
        <Text style={styles.statusText}>Game is not in playing phase</Text>
        <Text style={styles.statusText}>Current phase: {gameState.phase}</Text>
      </View>
    );
  }

  const currentPlayer = getCurrentPlayer();
  const myPlayer = getPlayer(currentPlayerId);
  const currentTrick = getCurrentTrick();
  const roundInfo = getRoundInfo();
  const scores = getScores();
  const myHand = getPlayerHand(currentPlayerId);
  const isMyTurn = canPlayCard(currentPlayerId);

  return (
    <ScrollView style={styles.container}>
      {/* Header with game info */}
      <View style={styles.header}>
        <Text style={styles.title}>Truco Game</Text>
        {roundInfo && (
          <View style={styles.roundInfo}>
            <Text style={styles.roundText}>Round {roundInfo.roundNumber}</Text>
            <Text style={styles.valueText}>
              Worth: {roundInfo.trucoValue} points
            </Text>
            {roundInfo.trucoCall !== "none" && (
              <Text style={styles.trucoText}>
                {roundInfo.trucoCall.toUpperCase()}!
              </Text>
            )}
          </View>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Scores */}
      <View style={styles.scoresContainer}>
        <Text style={styles.sectionTitle}>Scores</Text>
        <View style={styles.scoresList}>
          {scores.map((score) => (
            <View key={score.id} style={styles.scoreItem}>
              <Text style={styles.playerName}>
                {score.name}
                {score.id === currentPlayerId && " (You)"}
                {currentPlayer?.id === score.id && " 🎯"}
              </Text>
              <Text style={styles.scoreValue}>{score.score}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Current trick */}
      {currentTrick && (
        <View style={styles.trickContainer}>
          <Text style={styles.sectionTitle}>
            Current Trick ({currentTrick.cardsPlayed.length}/{gameState.players.length})
          </Text>
          <View style={styles.trickCards}>
            {currentTrick.cardsPlayed.map((playedCard, index) => {
              const player = getPlayer(playedCard.playerId);
              return (
                <View key={index} style={styles.trickCard}>
                  <Text style={styles.cardText}>
                    {getCardDisplayName(playedCard.card)}
                  </Text>
                  <Text style={styles.cardPlayer}>
                    {player?.name || "Unknown"}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Turn indicator */}
      <View style={styles.turnIndicator}>
        {isMyTurn ? (
          <Text style={styles.yourTurnText}>🎯 Your Turn!</Text>
        ) : (
          <Text style={styles.waitingText}>
            Waiting for {currentPlayer?.name || "player"}...
          </Text>
        )}
      </View>

      {/* Player's hand */}
      {myHand && myHand.length > 0 && (
        <View style={styles.handContainer}>
          <Text style={styles.sectionTitle}>Your Cards</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.hand}>
              {myHand.map((card) => (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.card,
                    selectedCard?.id === card.id && styles.selectedCard,
                    !isMyTurn && styles.disabledCard,
                  ]}
                  onPress={() => {
                    if (isMyTurn) {
                      if (selectedCard?.id === card.id) {
                        handleCardPlay(card);
                      } else {
                        setSelectedCard(card);
                      }
                    }
                  }}
                  disabled={!isMyTurn}
                >
                  <Text style={styles.cardText}>
                    {getCardDisplayName(card)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          {selectedCard && isMyTurn && (
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => handleCardPlay(selectedCard)}
            >
              <Text style={styles.buttonText}>
                Play {getCardDisplayName(selectedCard)}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Truco actions */}
      {isMyTurn && roundInfo && (
        <View style={styles.trucoActions}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionButtons}>
            {roundInfo.trucoCall === "none" && (
              <TouchableOpacity
                style={[styles.button, styles.trucoButton]}
                onPress={() => handleTrucoCall(TrucoCall.TRUCO)}
              >
                <Text style={styles.buttonText}>Truco!</Text>
              </TouchableOpacity>
            )}
            {roundInfo.trucoCall === "truco" && (
              <TouchableOpacity
                style={[styles.button, styles.trucoButton]}
                onPress={() => handleTrucoCall(TrucoCall.RETRUCO)}
              >
                <Text style={styles.buttonText}>Retruco!</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Game actions */}
      <View style={styles.gameActions}>
        <TouchableOpacity
          style={[styles.button, styles.leaveButton]}
          onPress={() => {
            Alert.alert(
              "Leave Game",
              "Are you sure you want to leave the game?",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Leave", onPress: () => router.push("/") },
              ]
            );
          }}
        >
          <Text style={styles.buttonText}>Leave Game</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "white",
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  roundInfo: {
    flexDirection: "row",
    gap: 15,
    alignItems: "center",
  },
  roundText: {
    fontSize: 16,
    color: "#666",
  },
  valueText: {
    fontSize: 16,
    color: "#4e8090",
    fontWeight: "600",
  },
  trucoText: {
    fontSize: 16,
    color: "#f44336",
    fontWeight: "bold",
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 10,
    margin: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  errorText: {
    color: "#c62828",
    fontSize: 14,
    textAlign: "center",
  },
  statusText: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    margin: 20,
  },
  scoresContainer: {
    backgroundColor: "white",
    margin: 15,
    padding: 15,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  scoresList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  scoreItem: {
    backgroundColor: "#f8f9fa",
    padding: 10,
    borderRadius: 6,
    minWidth: 100,
    alignItems: "center",
  },
  playerName: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4e8090",
  },
  trickContainer: {
    backgroundColor: "white",
    margin: 15,
    padding: 15,
    borderRadius: 8,
  },
  trickCards: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  trickCard: {
    backgroundColor: "#e3f2fd",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    minWidth: 60,
  },
  turnIndicator: {
    alignItems: "center",
    padding: 15,
  },
  yourTurnText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4caf50",
  },
  waitingText: {
    fontSize: 16,
    color: "#666",
  },
  handContainer: {
    backgroundColor: "white",
    margin: 15,
    padding: 15,
    borderRadius: 8,
  },
  hand: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 5,
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    minWidth: 60,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderColor: "#4e8090",
    backgroundColor: "#e8f4f6",
    transform: [{ translateY: -5 }],
  },
  disabledCard: {
    opacity: 0.6,
  },
  cardText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  cardPlayer: {
    fontSize: 10,
    color: "#666",
    marginTop: 5,
  },
  playButton: {
    backgroundColor: "#4caf50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  trucoActions: {
    backgroundColor: "white",
    margin: 15,
    padding: 15,
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
  },
  trucoButton: {
    backgroundColor: "#ff5722",
  },
  leaveButton: {
    backgroundColor: "#f44336",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  gameActions: {
    padding: 15,
  },
});
