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
import ARPreviewScreen from './ARPreviewScreen';
import RecommendationScreen from './RecommendationScreen';

const MainScreen: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [purchaseListItems, setPurchaseListItems] = useState<PurchaseListItem[]>([]);
  const [arPreviewData, setArPreviewData] = useState<{
    roomImage: string;
    selectedPlants: Plant[];
  } | null>(null);
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
        // TODO: カメラ画面への遷移実装
        console.log('Navigate to camera screen');
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
      case 'ar-preview':
        if (data?.roomImage && data?.selectedPlants) {
          setArPreviewData({
            roomImage: data.roomImage,
            selectedPlants: data.selectedPlants
          });
          setCurrentView('ar-preview');
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
              onNavigateToARPreview={(data) => handleNavigate('ar-preview', data)}
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
      case 'ar-preview':
        if (arPreviewData) {
          return (
            <ARPreviewScreen
              roomImage={arPreviewData.roomImage}
              selectedPlants={arPreviewData.selectedPlants}
              onConfirm={() => {
                // Navigate to purchase list with confirmed plants
                arPreviewData.selectedPlants.forEach(plant => {
                  handleAddToPurchaseList(plant);
                });
                setSelectedTab(3);
                setCurrentView('purchase-list');
                setArPreviewData(null);
              }}
              onBack={() => {
                setCurrentView('home');
                setArPreviewData(null);
              }}
            />
          );
        }
        return <HomeScreen onNavigate={handleNavigate} />;
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