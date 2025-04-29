import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';

export default function PlayButton({ onPress }) {
    return (
        <TouchableOpacity onPress={onPress} style={styles.button}>
            <Text style={styles.text}>▶</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#00c853',
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    text: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
    },
});
