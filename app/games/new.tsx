import { StyleSheet, Text, View } from "react-native";
import Card from "../components/card";

export default function NewGame() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>New Game</Text>
            <Card title="Game Title" description="Game Description" imageUrl="https://via.placeholder.com/150">
                <Text>Additional Content</Text>
            </Card>
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