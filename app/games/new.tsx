import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  useGame,
  DEFAULT_TRUCO_CONFIG,
  TEAM_TRUCO_CONFIG,
  QUICK_TRUCO_CONFIG,
  getGameConfig,
} from "../game-engine";

export default function NewGame() {
  const router = useRouter();
  const { createGame, gameState, isConnected } = useGame();
  const [playerName, setPlayerName] = useState("");
  const [selectedConfig, setSelectedConfig] = useState("default");

  const gameConfigs = [
    {
      key: "default",
      name: "Standard Truco",
      description: "2-6 players, play to 15 points",
    },
    {
      key: "quick",
      name: "Quick Game",
      description: "2-4 players, play to 9 points",
    },
    { key: "team", name: "Team Truco", description: "4 players in 2 teams" },
  ];

  const handleCreateGame = () => {
    if (!playerName.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    try {
      const config = getGameConfig(selectedConfig);
      createGame(config);

      // Navigate to game lobby after creating
      setTimeout(() => {
        router.push("/games/lobby");
      }, 100);
    } catch (error) {
      Alert.alert("Error", "Failed to create game");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Game</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Your Name:</Text>
        <TextInput
          style={styles.input}
          value={playerName}
          onChangeText={setPlayerName}
          placeholder="Enter your name"
          maxLength={20}
        />

        <Text style={styles.label}>Game Type:</Text>
        {gameConfigs.map((config) => (
          <TouchableOpacity
            key={config.key}
            style={[
              styles.configOption,
              selectedConfig === config.key && styles.selectedConfig,
            ]}
            onPress={() => setSelectedConfig(config.key)}
          >
            <Text
              style={[
                styles.configName,
                selectedConfig === config.key && styles.selectedText,
              ]}
            >
              {config.name}
            </Text>
            <Text
              style={[
                styles.configDescription,
                selectedConfig === config.key && styles.selectedText,
              ]}
            >
              {config.description}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[
            styles.createButton,
            !playerName.trim() && styles.disabledButton,
          ]}
          onPress={handleCreateGame}
          disabled={!playerName.trim()}
        >
          <Text style={styles.buttonText}>Create Game</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#333",
  },
  form: {
    flex: 1,
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
    marginBottom: 20,
  },
  configOption: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  selectedConfig: {
    borderColor: "#4e8090",
    backgroundColor: "#e8f4f6",
  },
  configName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  configDescription: {
    fontSize: 14,
    color: "#666",
  },
  selectedText: {
    color: "#4e8090",
  },
  createButton: {
    backgroundColor: "#4e8090",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
