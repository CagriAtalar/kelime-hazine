import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const TILE_SIZE = 16;

export default function Board({ boardState, onCellPress }) {
    return (
        <View style={styles.board}>
            {boardState.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.row}>
                    {row.map((cell, colIndex) => {
                        const bgColor = {
                            H2: '#aaf',
                            H3: '#d6a3ff',
                            K2: '#bdf8bd',
                            K3: '#d2b48c',
                            CENTER: '#fcb900',
                            NORMAL: '#ddd',
                        }[cell.type || 'NORMAL'];

                        let content = '';
                        if (typeof cell.harf === 'string' && cell.harf.length > 0) {
                            content = cell.harf.toUpperCase();
                        } else if (cell.type === 'CENTER') {
                            content = '★';
                        } else if (['H2', 'H3', 'K2', 'K3'].includes(cell.type)) {
                            content = cell.type;
                        }

                        return (
                            <TouchableOpacity
                                key={colIndex}
                                style={[styles.cell, { backgroundColor: bgColor }]}
                                onPress={() => onCellPress(rowIndex, colIndex)}
                            >
                                <Text style={styles.text}>{content}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    board: {
        alignSelf: 'center',
        marginTop: 16,
    },
    row: {
        flexDirection: 'row',
    },
    cell: {
        width: TILE_SIZE,
        height: TILE_SIZE,
        borderWidth: 0.5,
        borderColor: '#aaa',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#000', // Görünürlük için siyah renk
    },
});
