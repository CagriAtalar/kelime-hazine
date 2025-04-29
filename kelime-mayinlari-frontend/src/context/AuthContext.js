import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const login = async (username, password) => {
        const { data } = await api.post('/auth/login', { username, password });
        await AsyncStorage.setItem('token', data.token);
        setUser(data.user);
    };

    const register = async (username, email, password) => {
        try {
            const response = await api.post('/auth/register', { username, email, password });
            return response.data;
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        await api.post('/auth/logout');
        await AsyncStorage.removeItem('token');
        setUser(null);
    };

    useEffect(() => {
        const load = async () => {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                // örnek: kullanıcı bilgilerini çek
                try {
                    const { data } = await api.get('/auth/me'); // profil bilgisi dönen endpoint
                    setUser(data.user);
                } catch (err) {
                    console.error("Profil yüklenemedi:", err);
                    await AsyncStorage.removeItem('token');
                }
            }
        };
        load();
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
