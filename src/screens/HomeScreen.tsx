import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, ImageBackground, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '../config/constants';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  onNavigate: (screen: string, data?: any) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ImageBackground
        source={require('../../assets/images/onbording/roomAfterNordic-optimized.jpg')}
        style={styles.hero}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)']}
          style={styles.heroOverlay}
        >
          <Text style={styles.heroTitle}>あなたの部屋に{'\n'}緑の癒しを</Text>
          <Text style={styles.heroSubtitle}>
            AIが最適な植物をご提案
          </Text>
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => onNavigate('capture')}
          >
            <Ionicons name="camera" size={24} color={COLORS.background} />
            <Text style={styles.ctaButtonText}>部屋を撮影して始める</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.ctaButton, { backgroundColor: COLORS.primary, marginTop: 12 }]}
            onPress={() => onNavigate('recommendations', {
              recommendedPlants: [
                { id: '1', name: 'モンステラ', price: 3980, size: 'M', difficulty: '初心者向け', light: '明るい日陰', water: '週1回', description: '人気の観葉植物', image: require('../../assets/images/plants/plants_Monstera deliciosa .jpeg'), category: 'natural' },
                { id: '2', name: 'ゴムの木', price: 2980, size: 'L', difficulty: '初心者向け', light: '明るい日陰', water: '週1回', description: '育てやすい植物', image: require('../../assets/images/plants/plants_RubberPlant.jpeg'), category: 'modern' },
                { id: '3', name: 'ポトス', price: 1980, size: 'S', difficulty: '初心者向け', light: '日陰OK', water: '週1-2回', description: 'つる性の植物', image: require('../../assets/images/plants/plants_GoldenPothos.jpeg'), category: 'natural' }
              ]
            })}
          >
            <Ionicons name="sparkles" size={24} color={COLORS.background} />
            <Text style={styles.ctaButtonText}>デモ: おすすめを見る</Text>
          </TouchableOpacity>
        </LinearGradient>
      </ImageBackground>

      <View style={styles.features}>
        <Text style={styles.sectionTitle}>3つのステップで簡単</Text>
        
        <View style={styles.featureCard}>
          <Ionicons name="camera-outline" size={32} color={COLORS.primary} />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>1. 撮影</Text>
            <Text style={styles.featureDescription}>お部屋を撮影するだけ</Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <Ionicons name="bulb-outline" size={32} color={COLORS.primary} />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>2. AI分析</Text>
            <Text style={styles.featureDescription}>AIが環境を分析して提案</Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <Ionicons name="leaf-outline" size={32} color={COLORS.primary} />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>3. 配置確認</Text>
            <Text style={styles.featureDescription}>実際の配置イメージを確認</Text>
          </View>
        </View>
      </View>

      <View style={styles.benefits}>
        <Text style={styles.sectionTitle}>nyokiの特徴</Text>
        
        <View style={styles.benefitItem}>
          <Ionicons name="sparkles" size={20} color={COLORS.primary} />
          <Text style={styles.benefitText}>AIが部屋の環境を自動分析</Text>
        </View>
        
        <View style={styles.benefitItem}>
          <Ionicons name="image" size={20} color={COLORS.primary} />
          <Text style={styles.benefitText}>購入前に配置イメージを確認</Text>
        </View>
        
        <View style={styles.benefitItem}>
          <Ionicons name="notifications" size={20} color={COLORS.primary} />
          <Text style={styles.benefitText}>水やりリマインダー機能</Text>
        </View>
        
        <View style={styles.benefitItem}>
          <Ionicons name="bookmark" size={20} color={COLORS.primary} />
          <Text style={styles.benefitText}>検討リストに追加して外部リンクで購入</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.startButton}
        onPress={() => onNavigate('capture')}
      >
        <Text style={styles.startButtonText}>今すぐ始める</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  hero: {
    width: width,
    height: 280,
  },
  heroOverlay: {
    flex: 1,
    padding: SPACING.xl,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: SPACING.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: FONT_SIZE.lg,
    color: '#FFFFFF',
    marginBottom: SPACING.lg,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ctaButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  features: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  featureContent: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  featureTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  featureDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  benefits: {
    padding: SPACING.lg,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  benefitText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  startButton: {
    margin: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.background,
  },
});

export default HomeScreen;
