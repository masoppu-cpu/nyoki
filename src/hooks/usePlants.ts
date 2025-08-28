import { useState, useEffect } from 'react';
import { Plant, UserPlant } from '../types';
import { plantService } from '../services/plants';

export const usePlants = () => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [userPlants, setUserPlants] = useState<UserPlant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAllPlants = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allPlants = await plantService.getAllPlants();
      setPlants(allPlants);
      return allPlants;
    } catch (err) {
      setError('植物データの読み込みに失敗しました');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecommendedPlants = async (lightLevel?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const recommended = await plantService.getRecommendedPlants(lightLevel);
      return recommended;
    } catch (err) {
      setError('おすすめ植物の取得に失敗しました');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const searchPlants = async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await plantService.searchPlants(query);
      return results;
    } catch (err) {
      setError('検索に失敗しました');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const addUserPlant = (plant: Plant, nickname?: string, location: string = 'リビング') => {
    const newUserPlant: UserPlant = {
      id: 'user-plant-' + Date.now(),
      plantId: plant.id,
      name: plant.name,
      nickname,
      location,
      lastWatered: new Date().toISOString().split('T')[0],
      daysUntilWatering: 3,
      health: 'healthy',
      image: plant.image,
      purchaseDate: new Date().toISOString().split('T')[0],
    };
    
    setUserPlants(prev => [...prev, newUserPlant]);
    return newUserPlant;
  };

  const updateUserPlant = (plantId: string, updates: Partial<UserPlant>) => {
    setUserPlants(prev => 
      prev.map(plant => 
        plant.id === plantId ? { ...plant, ...updates } : plant
      )
    );
  };

  const removeUserPlant = (plantId: string) => {
    setUserPlants(prev => prev.filter(plant => plant.id !== plantId));
  };

  const waterPlant = (plantId: string) => {
    const today = new Date().toISOString().split('T')[0];
    updateUserPlant(plantId, {
      lastWatered: today,
      daysUntilWatering: 7, // Reset to weekly watering
      health: 'healthy',
    });
  };

  const getUserPlant = (plantId: string) => {
    return userPlants.find(plant => plant.id === plantId);
  };

  return {
    plants,
    userPlants,
    isLoading,
    error,
    loadAllPlants,
    loadRecommendedPlants,
    searchPlants,
    addUserPlant,
    updateUserPlant,
    removeUserPlant,
    waterPlant,
    getUserPlant,
  };
};