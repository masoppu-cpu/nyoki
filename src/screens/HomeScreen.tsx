import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '../config/constants';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#48BB78', '#38A169']}
        style={styles.hero}
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
      </LinearGradient>

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

      <View style={styles.showcase}>
        <Text style={styles.sectionTitle}>Before & After</Text>
        <Image 
          source={require('../../assets/images/hero-room.jpg')}
          style={styles.showcaseImage}
          resizeMode="cover"
        />
        <Text style={styles.showcaseText}>
          実際の部屋に植物を配置したイメージを{'\n'}事前に確認できます
        </Text>
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
    padding: SPACING.xl,
    paddingTop: 60,
    paddingBottom: 40,
  },
  heroTitle: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: 'bold',
    color: COLORS.background,
    marginBottom: SPACING.sm,
  },
  heroSubtitle: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.background,
    opacity: 0.9,
    marginBottom: SPACING.lg,
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
  showcase: {
    padding: SPACING.lg,
  },
  showcaseImage: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  showcaseText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
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
