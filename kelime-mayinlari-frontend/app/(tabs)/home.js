import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import api from '../../src/api/api';
import { initSocket, getSocket } from '../../src/utils/socket';

export default function HomeScreen({ navigation }) {
    const [active, setActive] = useState([]);
    const [completed, setCompleted] = useState([]);
    const [status, setStatus] = useState('');

    const loadGames = async () => {
        const { data } = await api.get('/game');
        setActive(data.activeGames);
        setCompleted(data.completedGames);
    };

    const joinQueue = async () => {
        setStatus('waiting');
        const { data } = await api.post('/matchmaking', { timeOption: '2min' });
        if (data.status === 'matched') {
            navigation.navigate('Game', { gameId: data.gameId });
        } else {
            setStatus('waiting for match…');
        }
    };

    useEffect(() => {
        loadGames();
        initSocket().then(socket => {
            socket.on('game_created', ({ gameId }) => {
                navigation.navigate('Game', { gameId });
            });
            socket.on('game_state_updated', () => loadGames());
        });
    }, []);

    return (
        <View style={styles.container}>
            <Button title="Quick Match (2min)" onPress={joinQueue} />
            <Text>{status}</Text>

            <Text style={styles.heading}>Active Games</Text>
            <FlatList
                data={active}
                keyExtractor={i => i.gameId}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Game', { gameId: item.gameId })}
                    >
                        <Text>
                            vs {item.opponentUsername} — {item.timeOption} —{' '}
                            {item.isYourTurn ? 'Your turn' : "Opp's turn"}
                        </Text>
                    </TouchableOpacity>
                )}
            />

            <Text style={styles.heading}>Completed Games</Text>
            <FlatList
                data={completed}
                keyExtractor={i => i.gameId}
                renderItem={({ item }) => (
                    <Text>
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
    heading: { marginTop: 16, fontWeight: 'bold' }
});
