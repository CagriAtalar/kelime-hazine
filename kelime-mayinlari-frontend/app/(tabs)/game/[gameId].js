import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Button } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../../src/api/api';

import Board from '../../../src/components/Board';
import TileRow from '../../../src/components/TileRow';
import PlayButton from '../../../src/components/PlayButton';
import UndoButton from '../../../src/components/UndoButton';

import { harfPuani } from '../../../src/utils/harfler';
import layout from '../../../src/utils/boardLayout';

export default function GameScreen() {
    const { gameId } = useLocalSearchParams();
    const router = useRouter();

    const [state, setState] = useState(null);
    const [boardState, setBoardState] = useState([]);
    const [hand, setHand] = useState([]);
    const [selectedTile, setSelectedTile] = useState(null);
    const [placedTiles, setPlacedTiles] = useState([]);
    const [message, setMessage] = useState('');

    const initializeBoard = (rawBoardState) =>
        layout.map((row, i) =>
            row.map((type, j) => ({
                type,
                harf: rawBoardState[i]?.[j] || null
            }))
        );

    const loadState = async () => {
        if (!gameId) return;
        try {
            const { data } = await api.get(`/game/${gameId}`);
            setState(data);
            setBoardState(initializeBoard(data.boardState));
            setHand(data.playerHand);
            setPlacedTiles([]);
            setMessage('');
        } catch (e) {
            console.error('Game load error:', e);
            Alert.alert('Hata', 'Oyun verisi alınamadı');
        }
    };

    useEffect(() => {
        loadState();
        const interval = setInterval(() => {
            if (state?.isYourTurn && state?.turnStartTime) {
                const elapsed = (Date.now() - new Date(state.turnStartTime).getTime()) / 1000;
                if (elapsed >= 120) handlePass(); // 2dk geçtiyse otomatik pas
            }
        }, 10000); // Her 10 saniyede bir kontrol et
        return () => clearInterval(interval);
    }, [state]);

    const onCellPress = (row, col) => {
        if (!selectedTile || boardState[row][col].harf) return;

        const updatedBoard = [...boardState];
        updatedBoard[row][col] = { ...updatedBoard[row][col], harf: selectedTile };
        setBoardState(updatedBoard);

        const updatedHand = [...hand];
        const idx = updatedHand.indexOf(selectedTile);
        if (idx !== -1) updatedHand.splice(idx, 1);
        setHand(updatedHand);

        setPlacedTiles([...placedTiles, { row, col, harf: selectedTile }]);
        setSelectedTile(null);
    };

    const handleUndo = () => {
        if (placedTiles.length === 0) return;
        const last = placedTiles[placedTiles.length - 1];
        const updatedBoard = [...boardState];
        updatedBoard[last.row][last.col] = {
            ...updatedBoard[last.row][last.col],
            harf: null
        };
        setBoardState(updatedBoard);
        setHand([...hand, last.harf]);
        setPlacedTiles(placedTiles.slice(0, -1));
    };

    const handlePlay = async () => {
        if (placedTiles.length === 0) return;

        const sorted = [...placedTiles].sort((a, b) => a.col - b.col || a.row - b.row);
        const word = sorted.map(t => t.harf).join('');
        const direction = sorted[0].row === sorted[1]?.row ? 'horizontal' : 'vertical';

        try {
            const res = await api.post(`/game/${gameId}/place-word`, {
                word,
                startPosition: { x: sorted[0].col, y: sorted[0].row },
                direction
            });
            setMessage(`✅ ${word} kelimesi için ${res.data.gainedPoints} puan!`);
            await loadState();
        } catch (e) {
            const msg = e.response?.data?.error || 'Hatalı hamle';
            Alert.alert('Hata', msg);
            setMessage(`❌ ${msg}`);
        }
    };

    const handlePass = async () => {
        try {
            const res = await api.post(`/game/${gameId}/pass`);
            if (res.data.gameOver) {
                Alert.alert("Oyun Bitti", "Oyun 4 pas sonrası sona erdi");
                router.replace("/home");
            } else {
                await loadState();
            }
        } catch (e) {
            console.error('Pass error:', e);
            Alert.alert("Hata", "Pas geçilemedi");
        }
    };

    const handleResign = async () => {
        Alert.alert('Teslim Ol', 'Oyunu teslim etmek istiyor musunuz?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Evet',
                onPress: async () => {
                    try {
                        await api.post(`/game/${gameId}/resign`);
                        Alert.alert('Teslim oldunuz');
                        router.replace('/home');
                    } catch (e) {
                        console.error('Resign error:', e);
                        Alert.alert("Hata", "Teslim olunamadı");
                    }
                }
            }
        ]);
    };

    if (!state) return <Text>Yükleniyor…</Text>;

    return (
        <View style={styles.container}>
            <Text style={styles.status}>
                {state.isYourTurn ? 'Sıra sizde!' : 'Rakip düşünüyor...'}
            </Text>

            <Text style={styles.score}>
                Kalan Harf: {state.letterPoolSize} | SEN: {state.playerScore} — {state.opponentScore} :RAKİP
            </Text>

            <Board boardState={boardState} onCellPress={onCellPress} />
            <TileRow letters={hand} onTileSelect={setSelectedTile} />
            <UndoButton onPress={handleUndo} />
            <PlayButton onPress={handlePlay} />

            <View style={styles.actions}>
                <Button title="⏭ Pas Geç" onPress={handlePass} />
                <Button title="🏳️ Teslim Ol" onPress={handleResign} color="#d32f2f" />
            </View>

            <Text style={styles.message}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', paddingTop: 20 },
    status: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    score: { fontSize: 14, marginBottom: 10 },
    message: { marginTop: 10, fontSize: 14, fontWeight: 'bold' },
    actions: { marginTop: 10, flexDirection: 'row', gap: 12 }
});
