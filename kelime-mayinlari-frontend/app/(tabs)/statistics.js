import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import api from '../../src/api/api';

export default function StatisticsScreen() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        api.get('/game/statistics').then(({ data }) => setStats(data));
    }, []);

    if (!stats) return <Text>Loading…</Text>;

    return (
        <View style={styles.container}>
            <Text>Games Played: {stats.gamesPlayed}</Text>
            <Text>Won: {stats.gamesWon}</Text>
            <Text>Lost: {stats.gamesLost}</Text>
            <Text>Drawn: {stats.gamesDrawn}</Text>
            <Text>Win %: {stats.winPercentage}%</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 }
});
