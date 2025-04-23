import React, { useState, useContext } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
    const { register } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [err, setErr] = useState('');

    const onSubmit = async () => {
        try {
            await register(username, email, password);
            navigation.goBack();
        } catch (e) {
            setErr(e.response?.data?.error || 'Registration failed');
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
                placeholder="Email"
                onChangeText={setEmail}
                value={email}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                onChangeText={setPassword}
                value={password}
                secureTextEntry
            />
            <Button title="Register" onPress={onSubmit} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 16 },
    input: { borderWidth: 1, marginBottom: 12, padding: 8, borderRadius: 4 },
    err: { color: 'red', marginBottom: 8 }
});
