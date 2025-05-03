import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import api from '../../src/api/api';
import { initSocket } from '../../src/utils/socket';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
    const [active, setActive] = useState([]);
    const [completed, setCompleted] = useState([]);
    const [status, setStatus] = useState('');
    const router = useRouter();

    // Oyunları yükle
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
            console.error('Error loading games:', e);
        }
    };

    // Eşleşme kuyruğuna gir
    const joinQueue = async () => {
        setStatus('Bekleniyor...');
        try {
            const { data } = await api.post('/matchmaking', { timeOption: '2min' });
            if (data.status === 'matched') {
                router.push(`/game/${data.gameId}`);
            } else {
                setStatus('Eşleşme bekleniyor...');
            }
        } catch (e) {
            console.error('Eşleşme hatası:', e);
            setStatus('Eşleşme başarısız');
        }
    };

    // Oyuna yönlendir
    const navigateToGame = (gameId) => {
        if (gameId) {
            router.push(`/game/${gameId}`);
        } else {
            Alert.alert('Hata', 'Geçersiz oyun ID');
        }
    };

    // WebSocket ve oyun yükleme
    useEffect(() => {
        const setup = async () => {
            await loadGames();
            const socket = await initSocket();

            socket.on('game_created', ({ gameId }) => {
                router.push(`/game/${gameId}`);
            });

            socket.on('game_state_updated', loadGames);

            return () => {
                socket.off('game_created');
                socket.off('game_state_updated');
            };
        };

        setup();
    }, []);

    return (
        <View style={styles.container}>
            <Button title="Hızlı Eşleşme (2dk)" onPress={joinQueue} />
            <Text>{status}</Text>

            <Text style={styles.heading}>Aktif Oyunlar</Text>
            <FlatList
                data={active}
                keyExtractor={(item) => item.gameId.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.gameItem}
                        onPress={() => navigateToGame(item.gameId)}
                    >
                        <Text>
                            {item.opponentUsername
                                ? `Rakip: ${item.opponentUsername}`
                                : `Oyun: ${item.gameId}`}
                        </Text>
                        <Text>
                            Süre: {item.timeOption} —{' '}
                            {item.isYourTurn ? 'Sıra sende' : 'Rakipte'}
                        </Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text>Aktif oyununuz yok.</Text>}
            />

            <Text style={styles.heading}>Tamamlanan Oyunlar</Text>
            <FlatList
                data={completed}
                keyExtractor={(item) => item.gameId.toString()}
                renderItem={({ item }) => (
                    <View style={styles.gameItem}>
                        <Text>
                            vs {item.opponentUsername} — {item.result}
                        </Text>
                        <Text>
                            Bitiş: {new Date(item.endTime).toLocaleString()}
                        </Text>
                    </View>
                )}
                ListEmptyComponent={<Text>Henüz tamamlanan oyununuz yok.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#fff' },
    heading: { marginTop: 20, fontSize: 18, fontWeight: 'bold' },
    gameItem: {
        padding: 10,
        marginTop: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 8
    }
});
