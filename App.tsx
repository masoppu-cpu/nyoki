import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { initMonitoring, track } from './src/lib/monitoring';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');

  useEffect(() => {
    initMonitoring();
    track('app_start');
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>nyoki - Plant Placement App</Text>
      <Text style={styles.subtitle}>AI-powered room visualization for plant lovers</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
  },
});
