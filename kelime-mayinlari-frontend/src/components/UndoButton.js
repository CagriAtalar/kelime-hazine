import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function UndoButton({ onPress }) {
    return (
        <TouchableOpacity style={styles.button} onPress={onPress}>
            <Text style={styles.text}>⏪ Undo</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#ccc',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 10,
    },
    text: {
        fontWeight: 'bold',
        fontSize: 14,
    },
});
