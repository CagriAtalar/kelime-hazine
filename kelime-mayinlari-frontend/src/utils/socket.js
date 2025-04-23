import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

let socket = null;

export const initSocket = async () => {
    if (socket) return socket;
    const token = await AsyncStorage.getItem('token');
    socket = io('http://YOUR_SERVER_IP:5000', {
        auth: { token }
    });
    return socket;
};

export const getSocket = () => socket;
