import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../src/api/api';
import { initSocket, getSocket } from '../../src/utils/socket';
import Board from '../../src/components/Board';
import TileRow from '../../src/components/TileRow';
import PlayButton from '../../src/components/PlayButton';
import UndoButton from '../../src/components/UndoButton';
import { harfPuani } from '../../src/utils/harfler';

export default function GameScreen() {
    const { gameId } = useLocalSearchParams();
    const router = useRouter();

    const [state, setState] = useState(null);
    const [boardState, setBoardState] = useState([]);
    const [hand, setHand] = useState([]);
    const [selectedTile, setSelectedTile] = useState(null);
    const [placedTiles, setPlacedTiles] = useState([]);

    // ✅ 1. Oyun durumunu yükle
    const loadState = async () => {
        const { data } = await api.get(`/game/${gameId}`);
        setState(data);
        setBoardState(data.boardState);
        setHand(data.playerHand);
        setPlacedTiles([]);
    };

    // ✅ 2. Hücreye tıklama
    const onCellPress = (row, col) => {
        if (!selectedTile) return;
        if (boardState[row][col].harf) {
            Alert.alert('Zaten harf var!');
            return;
        }

        const newBoard = [...boardState];
        newBoard[row][col] = {
            ...newBoard[row][col],
            harf: selectedTile,
        };
        setBoardState(newBoard);

        const newHand = [...hand];
        const index = newHand.indexOf(selectedTile);
        if (index !== -1) newHand.splice(index, 1);
        setHand(newHand);

        setPlacedTiles([...placedTiles, { row, col, harf: selectedTile }]);
        setSelectedTile(null);
    };

    // ✅ 3. Harf seçimi
    const onTileSelect = (tile) => {
        setSelectedTile(tile);
    };

    // ✅ 4. Geri alma
    const handleUndo = () => {
        if (placedTiles.length === 0) return;

        const last = placedTiles[placedTiles.length - 1];
        const newBoard = [...boardState];
        newBoard[last.row][last.col] = {
            ...newBoard[last.row][last.col],
            harf: null,
        };
        setBoardState(newBoard);
        setHand([...hand, last.harf]);
        setPlacedTiles(placedTiles.slice(0, -1));
    };

    // ✅ 5. Oynama
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
            console.error(e);
            Alert.alert('Error', e.response?.data?.error || 'Geçersiz hamle');
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
                if (payload.gameId === gameId) {
                    setState(payload);
                    setBoardState(payload.boardState);
                    setHand(payload.playerHand);
                }
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

    if (!state) return <Text>Yükleniyor…</Text>;

    return (
        <View style={styles.container}>
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
            <Text style={{ marginTop: 10 }} onPress={pass}>⏩ PASS</Text>
            <Text style={{ color: 'red', marginTop: 4 }} onPress={resign}>❌ RESIGN</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', paddingTop: 20 },
    status: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    score: { fontSize: 14, marginBottom: 10 }
});
