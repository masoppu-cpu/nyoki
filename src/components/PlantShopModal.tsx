import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '../config/constants';
import { Plant } from '../types';

interface PlantShopModalProps {
  plant: Plant | null;
  visible: boolean;
  onClose: () => void;
  onAddToPurchaseList: (plant: Plant) => void;
  isRecommended?: boolean;
}

const PlantShopModal: React.FC<PlantShopModalProps> = ({
  plant,
  visible,
  onClose,
  onAddToPurchaseList,
  isRecommended = false,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'care' | 'shop'>('info');
  const [isAdding, setIsAdding] = useState(false);

  if (!plant) return null;

  const handleAddToPurchaseList = async () => {
    setIsAdding(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // UIフィードバック用
      onAddToPurchaseList(plant);
      Alert.alert(
        '追加完了',
        `${plant.name}を購入検討リストに追加しました`,
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      Alert.alert('エラー', '追加に失敗しました。もう一度お試しください。');
    } finally {
      setIsAdding(false);
    }
  };

  const stockStatus = plant.stock ? 
    plant.stock > 10 ? '在庫あり' : 
    plant.stock > 0 ? `残り${plant.stock}点` : 
    '在庫切れ' : '要確認';

  const stockColor = plant.stock ? 
    plant.stock > 10 ? COLORS.success : 
    plant.stock > 0 ? COLORS.warning : 
    COLORS.error : COLORS.textSecondary;

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={onClose}
            accessible={true}
            accessibilityLabel="モーダルを閉じる"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={24} color={COLORS.textOnBase} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {plant.name}
          </Text>
          {isRecommended && (
            <View style={styles.recommendedIcon}>
              <Ionicons name="star" size={20} color={COLORS.warning} />
            </View>
          )}
        </View>

        <View style={styles.tabContainer}>
          {(['info', 'care', 'shop'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
              accessible={true}
              accessibilityLabel={
                tab === 'info' ? '基本情報タブ' :
                tab === 'care' ? 'お手入れタブ' : 
                '購入情報タブ'
              }
              accessibilityRole="tab"
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'info' ? '基本情報' : tab === 'care' ? 'お手入れ' : '購入情報'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'info' && (
            <View style={styles.tabContent}>
              <Image source={plant.image} style={styles.plantImage} resizeMode="cover" />
              
              {isRecommended && (
                <View style={styles.recommendedBanner}>
                  <Ionicons name="star" size={16} color={COLORS.warning} />
                  <Text style={styles.recommendedText}>AI推奨の植物です</Text>
                </View>
              )}
              
              <View style={styles.priceContainer}>
                <Text style={styles.price}>¥{plant.price.toLocaleString()}</Text>
                <View style={[styles.stockBadge, { backgroundColor: stockColor }]}>
                  <Text style={styles.stockText}>{stockStatus}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>植物名:</Text>
                <Text style={styles.value}>{plant.name}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>サイズ:</Text>
                <Text style={styles.value}>{plant.size}サイズ</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>難易度:</Text>
                <Text style={styles.value}>{plant.difficulty}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>カテゴリー:</Text>
                <Text style={styles.value}>
                  {plant.category === 'natural' ? 'ナチュラル' :
                   plant.category === 'modern' ? 'モダン' :
                   plant.category === 'cozy' ? 'コージー' :
                   plant.category === 'nordic' ? 'ノルディック' :
                   plant.category === 'tropical' ? 'トロピカル' :
                   plant.category === 'cool' ? 'クール' : plant.category}
                </Text>
              </View>

              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionTitle}>説明</Text>
                <Text style={styles.description}>{plant.description}</Text>
              </View>
            </View>
          )}

          {activeTab === 'care' && (
            <View style={styles.tabContent}>
              <View style={styles.careSection}>
                <View style={styles.careItem}>
                  <View style={styles.careIcon}>
                    <Ionicons name="sunny" size={24} color={COLORS.warning} />
                  </View>
                  <View style={styles.careInfo}>
                    <Text style={styles.careTitle}>日当たり</Text>
                    <Text style={styles.careValue}>{plant.light}</Text>
                  </View>
                </View>

                <View style={styles.careItem}>
                  <View style={styles.careIcon}>
                    <Ionicons name="water" size={24} color={COLORS.primary} />
                  </View>
                  <View style={styles.careInfo}>
                    <Text style={styles.careTitle}>水やり</Text>
                    <Text style={styles.careValue}>{plant.water}</Text>
                  </View>
                </View>

                <View style={styles.careItem}>
                  <View style={styles.careIcon}>
                    <Ionicons name="fitness" size={24} color={COLORS.success} />
                  </View>
                  <View style={styles.careInfo}>
                    <Text style={styles.careTitle}>難易度</Text>
                    <Text style={styles.careValue}>{plant.difficulty}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.careTips}>
                <Text style={styles.careTipsTitle}>お手入れのコツ</Text>
                <Text style={styles.careTipsText}>
                  {plant.difficulty === '初心者向け' ?
                    '水やりの頻度を守り、直射日光を避ければ元気に育ちます。土が乾いてから水をあげるのがポイントです。' :
                    '環境の変化に注意し、定期的な観察が大切です。葉の状態をチェックして、必要に応じて水やりや場所を調整しましょう。'
                  }
                </Text>
              </View>
            </View>
          )}

          {activeTab === 'shop' && (
            <View style={styles.tabContent}>
              <View style={styles.shopInfo}>
                <Text style={styles.shopInfoTitle}>購入について</Text>
                <Text style={styles.shopInfoText}>
                  この商品は外部サイトでの購入となります。購入検討リストに追加して、後でゆっくり検討できます。
                </Text>
              </View>

              <View style={styles.priceBreakdown}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>商品価格</Text>
                  <Text style={styles.priceAmount}>¥{plant.price.toLocaleString()}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>送料</Text>
                  <Text style={styles.priceAmount}>別途</Text>
                </View>
                <View style={[styles.priceRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>参考価格</Text>
                  <Text style={styles.totalAmount}>¥{plant.price.toLocaleString()}〜</Text>
                </View>
              </View>

              <View style={styles.shopNote}>
                <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
                <Text style={styles.shopNoteText}>
                  実際の購入は提携ショップで行います。価格や在庫状況は変動する場合があります。
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[
              styles.addButton, 
              (isAdding || !plant.stock) && styles.addButtonDisabled
            ]}
            onPress={handleAddToPurchaseList}
            disabled={isAdding || !plant.stock}
            accessible={true}
            accessibilityLabel="購入検討リストに追加"
            accessibilityRole="button"
          >
            <Ionicons 
              name={isAdding ? "hourglass" : "bookmark"} 
              size={20} 
              color={COLORS.textOnAccent} 
            />
            <Text style={[
              styles.addButtonText,
              (isAdding || !plant.stock) && styles.addButtonTextDisabled
            ]}>
              {isAdding ? '追加中...' : !plant.stock ? '在庫切れ' : '検討リストに追加'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
    textAlign: 'center',
    marginHorizontal: SPACING.sm,
  },
  recommendedIcon: {
    padding: SPACING.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.base,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
  },
  tabText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: SPACING.md,
  },
  plantImage: {
    width: '100%',
    height: 250,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  recommendedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  recommendedText: {
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textOnBase,
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  price: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
  },
  stockBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  stockText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textOnAccent,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  label: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textOnBase,
    fontWeight: '500',
  },
  descriptionContainer: {
    marginTop: SPACING.lg,
  },
  descriptionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  careSection: {
    marginBottom: SPACING.lg,
  },
  careItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  careIcon: {
    marginRight: SPACING.md,
  },
  careInfo: {
    flex: 1,
  },
  careTitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  careValue: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textOnBase,
    fontWeight: '600',
  },
  careTips: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  careTipsTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
    marginBottom: SPACING.sm,
  },
  careTipsText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  shopInfo: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  shopInfoTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
    marginBottom: SPACING.sm,
  },
  shopInfoText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  priceBreakdown: {
    backgroundColor: COLORS.base,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  priceLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  priceAmount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textOnBase,
  },
  totalLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
  },
  totalAmount: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
  },
  shopNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.sm,
  },
  shopNoteText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    lineHeight: 16,
  },
  actionButtons: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.base,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.inactive,
  },
  addButtonText: {
    color: COLORS.textOnAccent,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  addButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
});

export default PlantShopModal;