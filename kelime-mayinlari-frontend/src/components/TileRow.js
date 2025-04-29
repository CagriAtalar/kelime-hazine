import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const harfPuani = {
    A: 1, B: 3, C: 4, Ç: 4, D: 3, E: 1, F: 7, G: 5, Ğ: 8, H: 5,
    I: 2, İ: 1, J: 10, K: 1, L: 1, M: 2, N: 1, O: 2, Ö: 7, P: 5,
    R: 1, S: 2, Ş: 4, T: 1, U: 2, Ü: 3, V: 7, Y: 3, Z: 4, JOKER: 0
};

export default function TileRow({ letters, onTileSelect }) {
    return (
        <View style={styles.container}>
            {letters.map((letter, idx) => (
                <TouchableOpacity key={idx} style={styles.tile} onPress={() => onTileSelect(letter)}>
                    <Text style={styles.char}>{letter.toUpperCase()}</Text>
                    <Text style={styles.point}>{harfPuani[letter] ?? 1}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 8,
        flexWrap: 'wrap'
    },
    tile: {
        backgroundColor: '#ffd700',
        borderWidth: 1,
        borderColor: '#000',
        width: 32,
        height: 40,
        margin: 4,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    char: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    point: {
        position: 'absolute',
        bottom: 2,
        right: 4,
        fontSize: 10,
    },
});
