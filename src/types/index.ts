export type AppView = 
  | 'home' 
  | 'capture' 
  | 'generating' 
  | 'recommendations' 
  | 'my-plants' 
  | 'shop' 
  | 'purchase-list';

export type PlantCategory = 
  | 'natural' 
  | 'modern' 
  | 'cozy' 
  | 'nordic' 
  | 'tropical' 
  | 'cool';

export type PlantSize = 'S' | 'M' | 'L';

export type DifficultyLevel = '初心者向け' | '中級者向け' | '上級者向け';

export type LightRequirement = '日陰OK' | '明るい日陰' | '半日陰' | '日向';

export type WateringFrequency = '週1回' | '週1-2回' | '週2-3回' | '月2-3回' | '毎日';

export interface Plant {
  id: string;
  name: string;
  price: number;
  size: PlantSize;
  difficulty: DifficultyLevel;
  light: LightRequirement;
  water: WateringFrequency;
  description: string;
  image: any;
  category: PlantCategory;
  stock?: number;
}

export interface PurchaseListItem {
  plant: Plant;
  status: 'considering' | 'purchased';
  externalUrl?: string;
  addedAt?: string;
  purchasedAt?: string;
}

export interface Tool {
  id: string;
  name: string;
  price: number;
  category: 'watering' | 'misting' | 'pruning' | 'soil' | 'fertilizer';
  description?: string;
  image?: any;
  stock?: number;
}

export interface UserPlant {
  id: string;
  plantId: string;
  name: string;
  nickname?: string;
  location: string;
  lastWatered: string;
  daysUntilWatering: number;
  health: 'healthy' | 'warning' | 'critical';
  image: any;
  purchaseDate?: string;
}

export interface RoomAnalysis {
  id: string;
  userId?: string;
  imageUrl: string;
  analysisDate: string;
  roomType: string;
  lightLevel: LightRequirement;
  recommendedPlants: Plant[];
  roomStyle?: PlantCategory;
}
