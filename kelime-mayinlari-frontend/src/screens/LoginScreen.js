import React, { useState, useContext } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
    const { login } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [err, setErr] = useState('');

    const onSubmit = async () => {
        try {
            await login(username, password);
        } catch (e) {
            setErr(e.response?.data?.error || 'Login failed');
        }
    };

    return (
        <View style={styles.container}>
            {err ? <Text style={styles.err}>{err}</Text> : null}
            <TextInput
                style={styles.input}
                placeholder="Username"
                onChangeText={setUsername}
                value={username}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                onChangeText={setPassword}
                value={password}
                secureTextEntry
            />
            <Button title="Login" onPress={onSubmit} />
            <Button
                title="Register"
                onPress={() => navigation.navigate('Register')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 16 },
    input: { borderWidth: 1, marginBottom: 12, padding: 8, borderRadius: 4 },
    err: { color: 'red', marginBottom: 8 }
});
