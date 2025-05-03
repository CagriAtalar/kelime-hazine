import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

let socket = null;

export const initSocket = async () => {
    if (socket) return socket;  // Eğer zaten bir socket bağlantısı varsa, onu döndür.

    const token = await AsyncStorage.getItem('token');  // Token'ı alıyoruz.

    // Socket.io bağlantısını kuruyoruz.
    socket = io('http://192.168.1.116:5000', {
        auth: { token }
    });

    // Bağlantı durumu kontrolü:
    socket.on('connect', () => {
        console.log('Connected to WebSocket');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket');
    });

    return socket;
};

export const getSocket = () => socket;
