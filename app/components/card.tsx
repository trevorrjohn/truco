import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

type CardProps = {
    title: string;
    description?: string;
    imageUrl?: string;
    children?: React.ReactNode;
};

const Card: React.FC<CardProps> = ({ title, description, imageUrl, children }) => (
    <View style={styles.card}>
        {imageUrl && (
            <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                resizeMode="cover"
            />
        )}
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
        {children}
    </View>
);

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 16,
        backgroundColor: '#fff',
        maxWidth: 320,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 16,
    },
    image: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#555',
        marginBottom: 12,
    },
});

export default Card;