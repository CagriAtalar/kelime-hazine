import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../src/api/api';
import { getSocket, initSocket } from '../../src/utils/socket';
import Board from '../../src/components/Board';
import TileRow from '../../src/components/TileRow';
import PlayButton from '../../src/components/PlayButton';

export default function GameScreen() {
    const { gameId } = useLocalSearchParams();
    const router = useRouter();
    const [state, setState] = useState(null);
    const [boardState, setBoardState] = useState([]);
    const [hand, setHand] = useState([]);
    const [selectedTile, setSelectedTile] = useState(null);
    const [placedTiles, setPlacedTiles] = useState([]); // [{ x, y, harf }]

    const loadState = async () => {
        const { data } = await api.get(`/game/${gameId}`);
        setState(data);
        setBoardState(data.boardState);
        setHand(data.playerHand);
        setPlacedTiles([]);
    };

    const onCellPress = (row, col) => {
        if (!selectedTile) return;

        const newBoard = [...boardState];
        if (!newBoard[row][col].harf) {
            newBoard[row][col] = {
                ...newBoard[row][col],
                harf: selectedTile,
            };

            setBoardState(newBoard);

            const updatedHand = [...hand];
            const idx = updatedHand.indexOf(selectedTile);
            if (idx !== -1) updatedHand.splice(idx, 1);
            setHand(updatedHand);

            setPlacedTiles([...placedTiles, { x: col, y: row, harf: selectedTile }]);
            setSelectedTile(null);
        }
    };

    const onTileSelect = (letter) => {
        setSelectedTile(letter);
    };

    const handlePlay = async () => {
        if (placedTiles.length === 0) {
            Alert.alert('Error', 'No tiles placed.');
            return;
        }

        // kelimeyi oluştur
        const word = placedTiles.map(t => t.harf).join('');
        const sorted = [...placedTiles].sort((a, b) => a.x - b.x || a.y - b.y);
        const direction = (sorted[0].y === sorted[1]?.y) ? 'horizontal' : 'vertical';

        try {
            await api.post(`/game/${gameId}/place-word`, {
                word,
                startPosition: { x: sorted[0].x, y: sorted[0].y },
                direction
            });
            await loadState();
        } catch (e) {
            console.error(e);
            Alert.alert('Error', e.response?.data?.error || 'Invalid move');
        }
    };

    const pass = async () => {
        await api.post(`/game/${gameId}/pass`);
        loadState();
    };

    const resign = async () => {
        await api.post(`/game/${gameId}/resign`);
        router.back();
    };

    useEffect(() => {
        const setup = async () => {
            await loadState();
            const socket = await initSocket();
            socket.on('game_state_updated', (payload) => {
                if (payload.gameId === gameId) setState(payload);
            });
        };

        setup();

        return () => {
            const socket = getSocket();
            if (socket) {
                socket.off('game_state_updated');
            }
        };
    }, []);

    if (!state) return <Text>Loading…</Text>;

    return (
        <View style={styles.container}>
            <Text>Score: You {state.playerScore} — Opp {state.opponentScore}</Text>
            <Board boardState={boardState} onCellPress={onCellPress} />
            <TileRow letters={hand} onTileSelect={onTileSelect} />
            <PlayButton onPress={handlePlay} />
            <Text style={{ marginTop: 12, color: 'gray' }}>
                Tap a tile, then tap a board cell to place it.
            </Text>
            <View style={{ marginTop: 8 }}>
                <Text onPress={pass} style={{ color: 'blue' }}>🕓 Pass</Text>
                <Text onPress={resign} style={{ color: 'red', marginTop: 4 }}>❌ Resign</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, alignItems: 'center' }
});
