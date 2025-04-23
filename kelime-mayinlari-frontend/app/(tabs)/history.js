import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import api from '../../src/api/api';

export default function HistoryScreen() {
    const [completed, setCompleted] = useState([]);

    useEffect(() => {
        api.get('/game').then(({ data }) => setCompleted(data.completedGames));
    }, []);

    return (
        <View style={styles.container}>
            <FlatList
                data={completed}
                keyExtractor={i => i.gameId}
                renderItem={({ item }) => (
                    <Text style={styles.item}>
                        vs {item.opponentUsername} — {item.result} @{' '}
                        {new Date(item.endTime).toLocaleString()}
                    </Text>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    item: { marginBottom: 12 }
});
