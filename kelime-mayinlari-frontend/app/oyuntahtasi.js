import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import Board from '../src/components/Board';
import TileRow from '../src/components/TileRow';
import PlayButton from '../src/components/PlayButton';
import UndoButton from '../src/components/UndoButton';
import layout from '../src/utils/boardLayout';
import { harfPuani } from '../src/utils/harfler';
import { kelimeSet } from '../src/utils/kelimeSet';

export default function Oyuntahtasi() {
    // 📦 Tahta kurulumu
    const createInitialBoard = () =>
        layout.map(row =>
            row.map(cellType => ({ type: cellType, harf: null }))
        );

    const [boardState, setBoardState] = useState(createInitialBoard());
    const [hand, setHand] = useState(['O', 'T', 'R', 'K', 'N', 'A', 'E']);
    const [selectedTile, setSelectedTile] = useState(null);
    const [placedTiles, setPlacedTiles] = useState([]);
    const [totalLetterCount, setTotalLetterCount] = useState(100);
    const [userScore, setUserScore] = useState(0);
    const [opponentScore, setOpponentScore] = useState(0);
    const [message, setMessage] = useState('');

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

    const onTileSelect = (tile) => {
        setSelectedTile(tile);
    };

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

    const getWordFromPlaced = () => {
        const sorted = [...placedTiles].sort((a, b) => a.col - b.col || a.row - b.row);
        return sorted.map(t => t.harf).join('');
    };

    const calculateScore = () => {
        let kelimeCarpani = 1;
        let skor = 0;

        for (const tile of placedTiles) {
            const cell = boardState[tile.row][tile.col];
            const puan = harfPuani[tile.harf] ?? 0;
            if (cell.type === 'H2') skor += puan * 2;
            else if (cell.type === 'H3') skor += puan * 3;
            else {
                skor += puan;
                if (cell.type === 'K2') kelimeCarpani *= 2;
                if (cell.type === 'K3') kelimeCarpani *= 3;
            }
        }

        return skor * kelimeCarpani;
    };

    const handlePlay = () => {
        if (placedTiles.length === 0) return;

        const word = getWordFromPlaced().toLowerCase();
        const isValid = kelimeSet.has(word.toUpperCase());

        if (!isValid) {
            setMessage(`❌ Geçersiz Kelime: ${word.toUpperCase()}`);
            return;
        }

        const gained = calculateScore();
        setUserScore(userScore + gained);
        setTotalLetterCount(totalLetterCount - placedTiles.length);
        setPlacedTiles([]);
        setMessage(`✅ ${word.toUpperCase()} kelimesinden ${gained} puan aldınız!`);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.topBar}>
                Kalan Harf: {totalLetterCount} | SEN: {userScore} — {opponentScore} :RAKİP
            </Text>

            <Board boardState={boardState} onCellPress={onCellPress} />
            <TileRow letters={hand} onTileSelect={onTileSelect} />
            <UndoButton onPress={handleUndo} />
            <PlayButton onPress={handlePlay} />

            <Text style={styles.scoreText}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', paddingTop: 20 },
    topBar: { fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
    scoreText: { marginTop: 8, fontSize: 14, fontWeight: 'bold' },
});
