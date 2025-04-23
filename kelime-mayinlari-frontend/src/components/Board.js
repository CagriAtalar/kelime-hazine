import React from 'react';
import { View, StyleSheet } from 'react-native';
import Tile from './Tile';

export default function Board({ board }) {
    return (
        <View style={styles.board}>
            {board.map((row, i) => (
                <View key={i} style={styles.row}>
                    {row.map((cell, j) => (
                        <Tile key={j} letter={cell || ''} />
                    ))}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    board: { flexDirection: 'column' },
    row: { flexDirection: 'row' }
});
