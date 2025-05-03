import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../../src/api/api'; // API'den oyun verilerini alacağız.
import Board from '../../../src/components/Board';
import TileRow from '../../../src/components/TileRow';
import PlayButton from '../../../src/components/PlayButton';
import UndoButton from '../../../src/components/UndoButton';

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
        } else {
            Alert.alert('Error', 'Game ID is missing.');
        }
    }, [gameId]);

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
            <TileRow letters={hand} onTileSelect={setSelectedTile} />
            <UndoButton onPress={() => { }} />
            <PlayButton onPress={handlePlay} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', paddingTop: 20 },
    status: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    score: { fontSize: 14, marginBottom: 10 },
});
