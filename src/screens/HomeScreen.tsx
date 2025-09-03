import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';

const { width, height } = Dimensions.get('window');

interface HomeScreenProps {
  onNavigate: (screen: string, data?: any) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  return (
    <ImageBackground
      source={require('../../assets/images/onbording/homeimage-optimized.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)']}
        style={styles.overlay}
      >
        <View style={styles.content}>
          <Text style={styles.title}>
            AIがあなたの部屋に{'\n'}最適な植物を提案します
          </Text>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={() => onNavigate('capture')}
          >
            <Ionicons name="camera" size={24} color={COLORS.background} />
            <Text style={styles.buttonText}>部屋を撮影して始める</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    lineHeight: 38,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default HomeScreen;