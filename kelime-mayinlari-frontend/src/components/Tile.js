import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Tile({ letter }) {
    return (
        <View style={styles.tile}>
            <Text style={styles.letter}>{letter}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    tile: {
        width: 24,
        height: 24,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    letter: { fontSize: 12 }
});
