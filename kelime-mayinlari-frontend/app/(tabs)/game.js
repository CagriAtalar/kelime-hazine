import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../src/api/api';
import { initSocket, getSocket } from '../../src/utils/socket';
import Board from '../../src/components/Board';
import TileRow from '../../src/components/TileRow';
import PlayButton from '../../src/components/PlayButton';
import UndoButton from '../../src/components/UndoButton';

export default function GameScreen() {
    const { gameId } = useLocalSearchParams();  // gameId'nin doğru şekilde alındığından emin ol
    const router = useRouter();

    const [state, setState] = useState(null);
    const [boardState, setBoardState] = useState([]);
    const [hand, setHand] = useState([]);
    const [selectedTile, setSelectedTile] = useState(null);
    const [placedTiles, setPlacedTiles] = useState([]);

    // Oyun durumu yükleme
    const loadState = async () => {
        if (!gameId) {
            Alert.alert("Error", "Game ID is missing.");
            return;
        }
        try {
            const { data } = await api.get(`/game/${gameId}`);
            setState(data);
            setBoardState(data.boardState);
            setHand(data.playerHand);
            setPlacedTiles([]);
        } catch (e) {
            console.error('Game load error:', e);
            Alert.alert('Error', 'Unable to load game data');
        }
    };

    useEffect(() => {
        if (gameId) {
            loadState();  // gameId mevcutsa state'i yükle
            const socket = initSocket();
            socket.on('game_state_updated', (payload) => {
                if (payload.gameId === gameId) {
                    setState(payload);
                    setBoardState(payload.boardState);
                    setHand(payload.playerHand);
                }
            });

            return () => {
                socket.off('game_state_updated');
            };
        } else {
            Alert.alert("Error", "Game ID is missing.");
        }
    }, [gameId]);

    // Tile seçim işlemi
    const onCellPress = (row, col) => {
        if (!selectedTile || boardState[row][col].harf) return;
        const newBoard = [...boardState];
        newBoard[row][col] = { ...newBoard[row][col], harf: selectedTile };
        setBoardState(newBoard);

        const newHand = [...hand];
        const index = newHand.indexOf(selectedTile);
        if (index !== -1) newHand.splice(index, 1);
        setHand(newHand);

        setPlacedTiles([...placedTiles, { row, col, harf: selectedTile }]);
        setSelectedTile(null);
    };

    const onTileSelect = (tile) => setSelectedTile(tile);

    const handleUndo = () => {
        if (placedTiles.length === 0) return;
        const last = placedTiles[placedTiles.length - 1];
        const newBoard = [...boardState];
        newBoard[last.row][last.col] = { ...newBoard[last.row][last.col], harf: null };
        setBoardState(newBoard);
        setHand([...hand, last.harf]);
        setPlacedTiles(placedTiles.slice(0, -1));
    };

    const handlePlay = async () => {
        if (placedTiles.length === 0) return;
        const sorted = [...placedTiles].sort((a, b) => a.col - b.col || a.row - b.row);
        const word = sorted.map(t => t.harf).join('');
        const direction = sorted[0].row === sorted[1]?.row ? 'horizontal' : 'vertical';

        try {
            await api.post(`/game/${gameId}/place-word`, {
                word,
                startPosition: { x: sorted[0].col, y: sorted[0].row },
                direction
            });
            await loadState();
        } catch (e) {
            console.error('Place Word Error:', e);
            Alert.alert('Error', e.response?.data?.error || 'Invalid move');
        }
    };

    const pass = async () => {
        try {
            await api.post(`/game/${gameId}/pass`);
            await loadState();
        } catch (e) {
            Alert.alert('Pass error', e.response?.data?.error || 'Error');
        }
    };

    const resign = async () => {
        try {
            await api.post(`/game/${gameId}/resign`);
            router.back();
        } catch (e) {
            Alert.alert('Resign error', e.response?.data?.error || 'Error');
        }
    };

    const useReward = async (rewardId) => {
        try {
            await api.post(`/game/${gameId}/use-reward`, { rewardId });
            await loadState();
        } catch (e) {
            console.error('Reward error:', e);
            Alert.alert('Reward Error', e.response?.data?.error || 'Reward cannot be used');
        }
    };

    if (!state) return <Text>Yükleniyor…</Text>;

    return (
        <View style={styles.container}>
            {state.gameStatus === 'completed' && state.winnerUsername && (
                <Text style={styles.winner}>🎉 Kazanan: {state.winnerUsername}</Text>
            )}

            <Text style={styles.status}>
                {state.isYourTurn ? 'Sıra sizde!' : 'Rakip düşünüyor...'}
            </Text>

            <Text style={styles.score}>
                SEN: {state.playerScore} — {state.opponentScore} :RAKİP
            </Text>

            <Board boardState={boardState} onCellPress={onCellPress} />
            <TileRow letters={hand} onTileSelect={onTileSelect} />
            <UndoButton onPress={handleUndo} />
            <PlayButton onPress={handlePlay} />

            <View style={styles.rewards}>
                <Text style={styles.reward} onPress={() => useReward('add_joker')}>🎁 JOKER AL</Text>
                <Text style={styles.reward} onPress={() => useReward('change_letters')}>🔄 Harfleri Değiştir</Text>
                <Text style={styles.reward} onPress={() => useReward('extra_letter')}>➕ Ekstra Harf Al</Text>
            </View>

            <Text style={styles.action} onPress={pass}>⏩ PASS</Text>
            <Text style={[styles.action, { color: 'red' }]} onPress={resign}>❌ RESIGN</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', paddingTop: 20 },
    status: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    score: { fontSize: 14, marginBottom: 10 },
    winner: { fontSize: 18, fontWeight: 'bold', color: 'green', marginBottom: 10 },
    action: { marginTop: 10, fontSize: 14 },
    rewards: { marginTop: 16, alignItems: 'center' },
    reward: {
        fontSize: 16,
        color: '#007bff',
        fontWeight: 'bold',
        marginVertical: 4
    }
});
