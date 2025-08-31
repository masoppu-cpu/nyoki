import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../config/constants';
import { AppView, PurchaseListItem } from '../types';
import TabBar from '../components/TabBar';
import HomeScreen from './HomeScreen';
import MyPlantsScreen from './MyPlantsScreen';
import PlantSelectionScreen from './PlantSelectionScreen';
import PurchaseListScreen from './PurchaseListScreen';

const MainScreen: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [purchaseListItems, setPurchaseListItems] = useState<PurchaseListItem[]>([]);

  const handleTabPress = (index: number, view: AppView) => {
    setSelectedTab(index);
    setCurrentView(view);
  };

  const handleNavigate = (screen: string) => {
    switch (screen) {
      case 'capture':
        // TODO: カメラ画面への遷移実装
        console.log('Navigate to camera screen');
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