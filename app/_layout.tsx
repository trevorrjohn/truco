import { Stack } from "expo-router";
import { GameProvider } from "./game-engine";

export default function RootLayout() {
  return (
    <GameProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#4e8090bf",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      />
    </GameProvider>
  );
}
