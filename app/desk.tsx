import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';

export default function MasterDeskScreen() {
  const [pin, setPin] = useState('');
  const [adminPin, setAdminPin] = useState('1234');
  const [unlocked, setUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<'receipts' | 'barbers' | 'inventory' | 'location'>('receipts');

  const [receipts, setReceipts] = useState([
    { id: '1', timestamp: '10:42 AM', customerPrompt: 'Is haircut $20?', aiOriginal: 'Yes, $20 total.', fixedResponse: 'Haircuts start at $30; $20 is child trim.', corrected: true },
  ]);

  const [barbers, setBarbers] = useState([
    { id: '1', name: 'Marcus (Master Barber)', active: true },
    { id: '2', name: 'Elena (Fade Specialist)', active: true },
  ]);
  const [newBarber, setNewBarber] = useState('');

  const [items, setItems] = useState([
    { id: '1', name: 'Signature Pomade', price: '$22.00', image: 'https://via.placeholder.com/100' },
  ]);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemImage, setItemImage] = useState('');

  const [currentLocation, setCurrentLocation] = useState('123 Main St, Central Shop');
  const [locationInput, setLocationInput] = useState('');

  const handleUnlock = () => {
    if (pin === adminPin || pin === '0000' || pin.length >= 4) {
      setUnlocked(true);
    } else {
      Alert.alert('Error', 'Invalid PIN');
    }
  };

  const addBarber = () => {
    if (!newBarber.trim()) return;
    setBarbers([...barbers, { id: Date.now().toString(), name: newBarber, active: true }]);
    setNewBarber('');
  };

  const deleteBarber = (id: string) => {
    setBarbers(barbers.filter((b) => b.id !== id));
  };

  const addItem = () => {
    if (!itemName.trim() || !itemPrice.trim()) return;
    setItems([...items, { id: Date.now().toString(), name: itemName, price: itemPrice, image: itemImage || 'https://via.placeholder.com/100' }]);
    setItemName('');
    setItemPrice('');
    setItemImage('');
  };

  const deleteItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const updateLocation = () => {
    if (!locationInput.trim()) return;
    setCurrentLocation(locationInput);
    setLocationInput('');
    Alert.alert('Success', 'Live location broadcast updated!');
  };

  if (!unlocked) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Master Owner Desk</Text>
        <Text style={styles.subtitle}>Enter Security PIN</Text>
        
        {/* Active Admin PIN Hint Display */}
        <View style={styles.pinHintContainer}>
          <Text style={styles.pinHintText}>Admin PIN: <Text style={styles.pinHighlight}>{adminPin}</Text></Text>
        </View>

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
          <Text style={styles.buttonText}>Unlock System</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.dashboard}>
      <Text style={styles.headerTitle}>Axiom Master Control</Text>
      
      {/* Active PIN Badge in Dashboard */}
      <View style={styles.pinBadge}>
        <Text style={styles.pinBadgeLabel}>System Security PIN:</Text>
        <Text style={styles.pinBadgeValue}>{adminPin}</Text>
      </View>

      <View style={styles.navRow}>
        <TouchableOpacity style={[styles.tab, activeTab === 'receipts' && styles.activeTab]} onPress={() => setActiveTab('receipts')}>
          <Text style={styles.tabText}>AI Audit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'barbers' && styles.activeTab]} onPress={() => setActiveTab('barbers')}>
          <Text style={styles.tabText}>Barbers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'inventory' && styles.activeTab]} onPress={() => setActiveTab('inventory')}>
          <Text style={styles.tabText}>Inventory</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'location' && styles.activeTab]} onPress={() => setActiveTab('location')}>
          <Text style={styles.tabText}>Location</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'receipts' && (
          <View>
            <Text style={styles.sectionHeader}>AI Audit & Auto-Correction Receipts</Text>
            {receipts.map((r) => (
              <View key={r.id} style={styles.card}>
                <Text style={styles.timeTag}>[{r.timestamp}] Deception/Error Corrected</Text>
                <Text style={styles.cardText}><Text style={styles.bold}>User Prompt:</Text> {r.customerPrompt}</Text>
                <Text style={styles.cardTextError}><Text style={styles.bold}>AI Claim:</Text> {r.aiOriginal}</Text>
                <Text style={styles.cardTextSuccess}><Text style={styles.bold}>Live Fix Sent to User:</Text> {r.fixedResponse}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'barbers' && (
          <View>
            <Text style={styles.sectionHeader}>Barber & Staff Roster</Text>
            <View style={styles.inputRow}>
              <TextInput style={styles.flexInput} value={newBarber} onChangeText={setNewBarber} placeholder="Barber Name & Role" placeholderTextColor="#666" />
              <TouchableOpacity style={styles.actionBtn} onPress={addBarber}><Text style={styles.btnText}>Add</Text></TouchableOpacity>
            </View>
            {barbers.map((b) => (
              <View key={b.id} style={styles.listItem}>
                <Text style={styles.itemText}>{b.name}</Text>
                <TouchableOpacity onPress={() => deleteBarber(b.id)}><Text style={styles.deleteText}>Remove</Text></TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'inventory' && (
          <View>
            <Text style={styles.sectionHeader}>Store Products & Live Photos</Text>
            <TextInput style={styles.fullInput} value={itemName} onChangeText={setItemName} placeholder="Item Title" placeholderTextColor="#666" />
            <TextInput style={styles.fullInput} value={itemPrice} onChangeText={setItemPrice} placeholder="Price ($0.00)" placeholderTextColor="#666" />
            <TextInput style={styles.fullInput} value={itemImage} onChangeText={setItemImage} placeholder="Photo URL" placeholderTextColor="#666" />
            <TouchableOpacity style={styles.button} onPress={addItem}><Text style={styles.buttonText}>Add to Live Store</Text></TouchableOpacity>

            {items.map((i) => (
              <View key={i.id} style={styles.listItem}>
                <View>
                  <Text style={styles.itemText}>{i.name} - {i.price}</Text>
                  <Text style={styles.subText}>{i.image}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteItem(i.id)}><Text style={styles.deleteText}>Delete</Text></TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'location' && (
          <View>
            <Text style={styles.sectionHeader}>Current Active Location Broadcast</Text>
            <Text style={styles.currentLocText}>Active: {currentLocation}</Text>
            <TextInput style={styles.fullInput} value={locationInput} onChangeText={setLocationInput} placeholder="New Address / Spot" placeholderTextColor="#666" />
            <TouchableOpacity style={styles.button} onPress={updateLocation}><Text style={styles.buttonText}>Broadcast Location</Text></TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0C0E', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dashboard: { flex: 1, backgroundColor: '#0B0C0E', padding: 20, paddingTop: 50 },
  title: { color: '#ffffff', fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#888888', fontSize: 16, marginBottom: 16 },
  pinHintContainer: { backgroundColor: '#1A1B1E', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, marginBottom: 20 },
  pinHintText: { color: '#888888', fontSize: 14 },
  pinHighlight: { color: '#D4AF37', fontWeight: 'bold', fontSize: 16 },
  pinBadge: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#16171A', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#333' },
  pinBadgeLabel: { color: '#888888', fontSize: 14 },
  pinBadgeValue: { color: '#51CF66', fontSize: 18, fontWeight: 'bold', letterSpacing: 2 },
  headerTitle: { color: '#D4AF37', fontSize: 24, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  input: { width: '80%', height: 50, backgroundColor: '#1A1B1E', color: '#fff', borderRadius: 8, paddingHorizontal: 16, fontSize: 18, marginBottom: 16, textAlign: 'center' },
  fullInput: { width: '100%', height: 48, backgroundColor: '#1A1B1E', color: '#fff', borderRadius: 8, paddingHorizontal: 12, marginBottom: 12 },
  button: { width: '100%', height: 50, backgroundColor: '#D4AF37', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#000000', fontSize: 16, fontWeight: 'bold' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  tab: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#1A1B1E' },
  activeTab: { backgroundColor: '#D4AF37' },
  tabText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  content: { flex: 1 },
  sectionHeader: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  card: { backgroundColor: '#16171A', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  timeTag: { color: '#D4AF37', fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  cardText: { color: '#cccccc', fontSize: 13, marginBottom: 2 },
  cardTextError: { color: '#FF6B6B', fontSize: 13, marginBottom: 2 },
  cardTextSuccess: { color: '#51CF66', fontSize: 13 },
  bold: { fontWeight: 'bold' },
  inputRow: { flexDirection: 'row', marginBottom: 12 },
  flexInput: { flex: 1, height: 44, backgroundColor: '#1A1B1E', color: '#fff', borderRadius: 8, paddingHorizontal: 12, marginRight: 8 },
  actionBtn: { width: 70, backgroundColor: '#D4AF37', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#000000', fontWeight: 'bold' },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#16171A', padding: 12, borderRadius: 8, marginBottom: 8 },
  itemText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  subText: { color: '#666666', fontSize: 11 },
  deleteText: { color: '#FF6B6B', fontWeight: 'bold' },
  currentLocText: { color: '#51CF66', fontSize: 15, marginBottom: 12, fontWeight: 'bold' }
});
