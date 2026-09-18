import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function DeskScreen() {
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);

  const handleUnlock = () => {
    if (pin === '1234' || pin === '0000' || pin.length >= 4) {
      setUnlocked(true);
    } else {
      Alert.alert('Error', 'Invalid PIN');
    }
  };

  if (unlocked) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Barbershop Owner Desk</Text>
        <Text style={styles.subtitle}>Staff & Management Controls Active</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Owner Admin Desk</Text>
      <Text style={styles.subtitle}>Enter Security PIN to Access</Text>
      <TextInput
        style={styles.input}
        value={pin}
        onChangeText={setPin}
        placeholder="Enter PIN"
        placeholderTextColor="#666"
        keyboardType="numeric"
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleUnlock}>
        <Text style={styles.buttonText}>Unlock Desk</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0C0E', justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { color: '#ffffff', fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#888888', fontSize: 16, marginBottom: 24 },
  input: { width: '80%', height: 50, backgroundColor: '#1A1B1E', color: '#fff', borderRadius: 8, paddingHorizontal: 16, fontSize: 18, marginBottom: 16, textAlign: 'center' },
  button: { width: '80%', height: 50, backgroundColor: '#D4AF37', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#000000', fontSize: 16, fontWeight: 'bold' },
});
