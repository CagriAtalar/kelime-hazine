import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import api from '../../src/api/api';
import { initSocket } from '../../src/utils/socket';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
    const [active, setActive] = useState([]);
    const [completed, setCompleted] = useState([]);
    const [status, setStatus] = useState('');
    const router = useRouter();

    const loadGames = async () => {
        try {
            const { data } = await api.get('/game');
            if (data?.activeGames) setActive(data.activeGames);
            if (data?.completedGames) setCompleted(data.completedGames);
        } catch (e) {
            console.error('Oyunlar yüklenemedi:', e);
        }
    };

    const joinQueue = async (timeOption = '2min') => {
        setStatus(`Eşleşme bekleniyor... (${timeOption})`);
        try {
            const { data } = await api.post('/matchmaking', { timeOption });
            if (data.status === 'matched') {
                router.push(`/game/${data.gameId}`);
            } else {
                setStatus('Henüz eşleşme sağlanamadı');
            }
        } catch (e) {
            console.error('Eşleşme hatası:', e);
            setStatus('Eşleşme başarısız');
        }
    };

    const navigateToGame = (gameId) => {
        if (gameId) {
            router.push(`/game/${gameId}`);
        } else {
            Alert.alert('Hata', 'Geçersiz oyun ID');
        }
    };

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
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>⏱ Hızlı Oyun Eşleşmesi</Text>
            <View style={styles.buttonGroup}>
                <Button title="Eşleş (2dk)" onPress={() => joinQueue('2min')} />
                <Button title="Eşleş (5dk)" onPress={() => joinQueue('5min')} />
                <Button title="Eşleş (12 saat)" onPress={() => joinQueue('12hr')} />
                <Button title="Eşleş (24 saat)" onPress={() => joinQueue('24hr')} />
            </View>
            <Text style={styles.status}>{status}</Text>

            <Text style={styles.heading}>🟢 Aktif Oyunlar</Text>
            <FlatList
                data={active}
                keyExtractor={(item) => item.gameId.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.gameItem}
                        onPress={() => navigateToGame(item.gameId)}
                    >
                        <Text style={styles.gameText}>
                            Rakip: {item.opponentUsername || 'Bilinmiyor'}
                        </Text>
                        <Text style={styles.gameText}>
                            Süre: {item.timeOption} — {item.isYourTurn ? 'Senin sıran' : 'Rakipte'}
                        </Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text>Aktif oyununuz yok.</Text>}
            />

            <Text style={styles.heading}>⚪ Tamamlanan Oyunlar</Text>
            <FlatList
                data={completed}
                keyExtractor={(item) => item.gameId.toString()}
                renderItem={({ item }) => (
                    <View style={styles.gameItem}>
                        <Text style={styles.gameText}>
                            vs {item.opponentUsername} — {item.result}
                        </Text>
                        <Text style={styles.gameText}>
                            Bitiş: {new Date(item.endTime).toLocaleString()}
                        </Text>
                    </View>
                )}
                ListEmptyComponent={<Text>Henüz tamamlanan oyununuz yok.</Text>}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#fff',
        flexGrow: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    heading: {
        marginTop: 20,
        fontSize: 18,
        fontWeight: 'bold',
        borderBottomWidth: 1,
        borderColor: '#ccc',
        paddingBottom: 4,
    },
    status: {
        marginTop: 10,
        fontStyle: 'italic',
        textAlign: 'center',
        color: '#555',
    },
    buttonGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        marginBottom: 10,
        gap: 8
    },
    gameItem: {
        padding: 12,
        marginTop: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
    },
    gameText: {
        fontSize: 14,
    },
});
