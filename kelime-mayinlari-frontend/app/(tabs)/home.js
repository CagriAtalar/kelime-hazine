import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import api from '../../src/api/api';
import { initSocket, getSocket } from '../../src/utils/socket';
import { useRouter } from 'expo-router';
export default function HomeScreen({ navigation }) {
    const [active, setActive] = useState([]);
    const [completed, setCompleted] = useState([]);
    const [status, setStatus] = useState('');
    const router = useRouter();
    const loadGames = async () => {
        try {
            const { data } = await api.get('/game');
            if (data?.activeGames) {
                setActive(data.activeGames);
            }
            if (data?.completedGames) {
                setCompleted(data.completedGames);
            }
        } catch (e) {
            console.error("Error loading games:", e);
        }
    };
    // Join matchmaking
    const joinQueue = async () => {
        setStatus('waiting');
        try {
            const { data } = await api.post('/matchmaking', { timeOption: '2min' });
            if (data.status === 'matched') {
                // Doğrudan game sayfasına yönlendir
                router.push(`/game/${data.gameId}`);
            } else {
                setStatus('waiting for match…');
            }
        } catch (e) {
            console.error('Error in matchmaking:', e);
            setStatus('Error in matchmaking');
        }
    };
    const navigateToGame = (gameId) => {
        if (gameId) {
            router.push(`/game/${gameId}`); // Expo router kullanarak yönlendirme yapıyoruz
        } else {
            Alert.alert('Error', 'Game ID is invalid');
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
                keyExtractor={(item) => item.gameId.toString()}  // gameId'yi string yapıyoruz
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => navigateToGame(item.gameId)}>
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
                keyExtractor={(item) => item.gameId.toString()}
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
