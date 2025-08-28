import { StyleSheet, Text, View } from "react-native";

export default function NewGame() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>New Game</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
    },
})