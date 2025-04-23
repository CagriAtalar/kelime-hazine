import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, Button, FlatList, StyleSheet, Alert
} from 'react-native';
import api from '../../src/api/api';
import { getSocket } from '../../src/utils/socket';
import Board from '../../src/components/Board';

export default function GameScreen({ route, navigation }) {
    const { gameId } = route.params;
    const [state, setState] = useState(null);
    const [word, setWord] = useState('');
    const [posX, setPosX] = useState('7');
    const [posY, setPosY] = useState('7');
    const [dir, setDir] = useState('horizontal');

    const loadState = async () => {
        const { data } = await api.get(`/game/${gameId}`);
        setState(data);
    };

    const place = async () => {
        try {
            await api.post(`/game/${gameId}/place-word`, {
                word,
                startPosition: { x: Number(posX), y: Number(posY) },
                direction: dir
            });
            setWord('');
            loadState();
        } catch (e) {
            Alert.alert('Error', e.response?.data?.error || 'Invalid move');
        }
    };

    const pass = async () => {
        await api.post(`/game/${gameId}/pass`);
        loadState();
    };

    const resign = async () => {
        await api.post(`/game/${gameId}/resign`);
        navigation.goBack();
    };

    useEffect(() => {
        loadState();
        const socket = getSocket();
        socket.on('game_state_updated', (payload) => {
            if (payload.gameId === gameId) setState(payload);
        });
        return () => socket.off('game_state_updated');
    }, []);

    if (!state) return <Text>Loading…</Text>;

    return (
        <View style={styles.container}>
            <Text>Score: You {state.playerScore} — Opp {state.opponentScore}</Text>
            <Board board={state.boardState} />
            <Text>Your hand: {state.playerHand.join(', ')}</Text>

            <View style={styles.row}>
                <TextInput
                    style={styles.smallInput}
                    value={posX}
                    onChangeText={setPosX}
                    keyboardType="numeric"
                />
                <TextInput
                    style={styles.smallInput}
                    value={posY}
                    onChangeText={setPosY}
                    keyboardType="numeric"
                />
                <TextInput
                    style={styles.input}
                    placeholder="WORD"
                    value={word}
                    onChangeText={setWord}
                />
            </View>
            <Button title="Place Word" onPress={place} />
            <Button title="Pass" onPress={pass} />
            <Button title="Resign" onPress={resign} color="red" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    row: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
    smallInput: { borderWidth: 1, width: 40, marginRight: 8, textAlign: 'center' },
    input: { borderWidth: 1, flex: 1, padding: 8 }
});
