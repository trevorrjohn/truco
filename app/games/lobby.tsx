import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  useGame,
  useGameActions,
  useGameQuery,
  GamePhase,
} from "../game-engine";

export default function GameLobby() {
  const router = useRouter();
  const { gameState, error } = useGame();
  const { joinGame, readyPlayer, startGame } = useGameActions();
  const { getScores } = useGameQuery();
  const [currentPlayerId, setCurrentPlayerId] = useState("");

  useEffect(() => {
    // Generate a unique player ID if we don't have one
    if (!currentPlayerId) {
      const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setCurrentPlayerId(playerId);
    }
  }, [currentPlayerId]);

  useEffect(() => {
    // Redirect to game screen when game starts
    if (gameState?.phase === GamePhase.PLAYING) {
      router.push("/games/play");
    }
  }, [gameState?.phase]);

  const handleJoinGame = () => {
    if (!currentPlayerId) return;

    const playerName = `Player ${gameState?.players.length ? gameState.players.length + 1 : 1}`;
    joinGame(currentPlayerId, playerName);
  };

  const handleReadyToggle = () => {
    if (!currentPlayerId) return;
    readyPlayer(currentPlayerId);
  };

  const handleStartGame = () => {
    if (!currentPlayerId) return;
    startGame(currentPlayerId);
  };

  const handleLeaveGame = () => {
    Alert.alert(
      "Leave Game",
      "Are you sure you want to leave?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Leave", onPress: () => router.back() },
      ]
    );
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

  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  const isInGame = !!currentPlayer;
  const canStart = gameState.players.length >= 2 && gameState.players.every(p => p.isReady);
  const isHost = gameState.players.length > 0 && gameState.players[0].id === currentPlayerId;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Game Lobby</Text>
        <Text style={styles.gameId}>Game ID: {gameState.id.slice(-8)}</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.gameInfo}>
        <Text style={styles.sectionTitle}>Game Settings</Text>
        <Text style={styles.infoText}>Max Players: {gameState.players.length}/6</Text>
        <Text style={styles.infoText}>Score to Win: {gameState.maxScore}</Text>
        <Text style={styles.infoText}>Phase: {gameState.phase}</Text>
      </View>

      <View style={styles.playersSection}>
        <Text style={styles.sectionTitle}>
          Players ({gameState.players.length})
        </Text>
        <ScrollView style={styles.playersList}>
          {gameState.players.map((player, index) => (
            <View key={player.id} style={styles.playerItem}>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>
                  {player.name} {index === 0 && "(Host)"}
                </Text>
                <Text style={styles.playerStatus}>
                  {player.isReady ? "✓ Ready" : "⏳ Not Ready"}
                </Text>
              </View>
              {player.id === currentPlayerId && (
                <View style={styles.currentPlayerIndicator}>
                  <Text style={styles.currentPlayerText}>You</Text>
                </View>
              )}
            </View>
          ))}

          {gameState.players.length === 0 && (
            <Text style={styles.emptyText}>No players yet</Text>
          )}
        </ScrollView>
      </View>

      <View style={styles.actions}>
        {!isInGame ? (
          <TouchableOpacity
            style={[styles.button, styles.joinButton]}
            onPress={handleJoinGame}
          >
            <Text style={styles.buttonText}>Join Game</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.button,
                currentPlayer.isReady ? styles.notReadyButton : styles.readyButton,
              ]}
              onPress={handleReadyToggle}
            >
              <Text style={styles.buttonText}>
                {currentPlayer.isReady ? "Not Ready" : "Ready"}
              </Text>
            </TouchableOpacity>

            {isHost && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.startButton,
                  !canStart && styles.disabledButton,
                ]}
                onPress={handleStartGame}
                disabled={!canStart}
              >
                <Text style={styles.buttonText}>Start Game</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <TouchableOpacity
          style={[styles.button, styles.leaveButton]}
          onPress={handleLeaveGame}
        >
          <Text style={styles.buttonText}>Leave</Text>
        </TouchableOpacity>
      </View>

      {!canStart && gameState.players.length >= 2 && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            All players must be ready to start the game
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  gameId: {
    fontSize: 14,
    color: "#666",
    fontFamily: "monospace",
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  errorText: {
    color: "#c62828",
    fontSize: 14,
    textAlign: "center",
  },
  gameInfo: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  playersSection: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  playersList: {
    flex: 1,
  },
  playerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  playerStatus: {
    fontSize: 14,
    color: "#666",
  },
  currentPlayerIndicator: {
    backgroundColor: "#4e8090",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentPlayerText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontStyle: "italic",
    marginTop: 20,
  },
  actions: {
    gap: 10,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  joinButton: {
    backgroundColor: "#4e8090",
  },
  readyButton: {
    backgroundColor: "#4caf50",
  },
  notReadyButton: {
    backgroundColor: "#ff9800",
  },
  startButton: {
    backgroundColor: "#2196f3",
  },
  leaveButton: {
    backgroundColor: "#f44336",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  warningContainer: {
    backgroundColor: "#fff3cd",
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
    marginTop: 10,
  },
  warningText: {
    color: "#856404",
    fontSize: 14,
    textAlign: "center",
  },
});
