import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../config/constants';
import { AppView, PurchaseListItem, Plant } from '../types';
import TabBar from '../components/TabBar';
import HomeScreen from './HomeScreen';
import MyPlantsScreen from './MyPlantsScreen';
import PlantSelectionScreen from './PlantSelectionScreen';
import PurchaseListScreen from './PurchaseListScreen';
import RecommendationScreen from './RecommendationScreen';
import CameraScreen from './CameraScreen';
import AnalysisScreen from './AnalysisScreen';

const MainScreen: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [purchaseListItems, setPurchaseListItems] = useState<PurchaseListItem[]>([]);
  const [recommendationData, setRecommendationData] = useState<{
    recommendedPlants: Plant[];
    roomImage: string;
  } | null>(null);

  const handleTabPress = (index: number, view: AppView) => {
    setSelectedTab(index);
    setCurrentView(view);
  };

  const handleNavigate = (screen: string, data?: any) => {
    switch (screen) {
      case 'capture':
        setCurrentView('camera');
        break;
      case 'analysis':
        setCurrentView('analysis');
        break;
      case 'recommendations':
        if (data?.recommendedPlants) {
          setRecommendationData({
            recommendedPlants: data.recommendedPlants,
            roomImage: data.roomImage || require('../../assets/images/room-before.jpg')
          });
          setCurrentView('recommendations');
        }
        break;
      case 'shop':
        setSelectedTab(2);
        setCurrentView('shop');
        break;
      case 'purchase-list':
        setSelectedTab(3);
        setCurrentView('purchase-list');
        break;
      default:
        break;
    }
  };

  const handleAddToPurchaseList = (plant: any) => {
    const newItem: PurchaseListItem = {
      id: Date.now().toString(),
      plantId: plant.id,
      plantName: plant.name,
      plantImage: plant.image,
      price: plant.price,
      status: 'considering',
      addedAt: new Date(),
    };
    setPurchaseListItems([...purchaseListItems, newItem]);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return <HomeScreen onNavigate={handleNavigate} />;
      case 'camera':
        return (
          <CameraScreen
            onImageCaptured={(imageUri) => {
              // カメラ撮影後、分析画面へ遷移
              handleNavigate('analysis');
              // 3秒後に推奨画面へ（デモ用）
              setTimeout(() => {
                handleNavigate('recommendations', {
                  recommendedPlants: [
                    { id: '1', name: 'モンステラ', price: 3980, size: 'M', difficulty: '初心者向け', light: '明るい日陰', water: '週1回', description: '人気の観葉植物', image: require('../../assets/images/plants/plants_Monstera deliciosa .jpeg'), category: 'natural' },
                    { id: '2', name: 'ゴムの木', price: 2980, size: 'L', difficulty: '初心者向け', light: '明るい日陰', water: '週1回', description: '育てやすい植物', image: require('../../assets/images/plants/plants_RubberPlant.jpeg'), category: 'modern' },
                    { id: '3', name: 'ポトス', price: 1980, size: 'S', difficulty: '初心者向け', light: '日陰OK', water: '週1-2回', description: 'つる性の植物', image: require('../../assets/images/plants/plants_GoldenPothos.jpeg'), category: 'natural' }
                  ],
                  roomImage: imageUri
                });
              }, 3000);
            }}
            onBack={() => setCurrentView('home')}
          />
        );
      case 'analysis':
        return (
          <AnalysisScreen
            onComplete={() => {
              // 分析完了後の処理（自動遷移されるので特に何もしない）
            }}
          />
        );
      case 'my-plants':
        return <MyPlantsScreen />;
      case 'recommendations':
        if (recommendationData) {
          return (
            <RecommendationScreen
              recommendedPlants={recommendationData.recommendedPlants}
              onAddToPurchaseList={handleAddToPurchaseList}
              onBack={() => {
                setCurrentView('home');
                setRecommendationData(null);
              }}
              onNavigateToShop={() => {
                setSelectedTab(2);
                setCurrentView('shop');
              }}
            />
          );
        }
        return <HomeScreen onNavigate={handleNavigate} />;
      case 'shop':
        return (
          <PlantSelectionScreen
            recommendedPlantIds={[]}
            onAddToPurchaseList={handleAddToPurchaseList}
          />
        );
      case 'purchase-list':
        return (
          <PurchaseListScreen
            items={purchaseListItems}
            onUpdateStatus={(id, status) => {
              setPurchaseListItems(
                purchaseListItems.map(item =>
                  item.id === id ? { ...item, status } : item
                )
              );
            }}
            onRemoveItem={(id) => {
              setPurchaseListItems(
                purchaseListItems.filter(item => item.id !== id)
              );
            }}
          />
        );
      default:
        return <HomeScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        {renderContent()}
      </View>
      <TabBar
        selectedTab={selectedTab}
        onTabPress={handleTabPress}
        purchaseListItems={purchaseListItems}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
});

export default MainScreen;