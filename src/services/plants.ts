import { Plant, UserPlant } from '../types';

class PlantService {
  private plantsDatabase: Plant[] = [
    {
      id: '1',
      name: 'モンステラデリシオーサ',
      price: 3980,
      size: 'M',
      difficulty: '初心者向け',
      light: '明るい日陰',
      water: '週1-2回',
      description: '大きな切れ込みの入った葉が特徴的。育てやすく人気の観葉植物。',
      image: require('../../assets/images/plants/plants_Monstera deliciosa .jpeg'),
      category: 'natural',
      stock: 10,
    },
    {
      id: '2',
      name: 'サンスベリア',
      price: 2980,
      size: 'S',
      difficulty: '初心者向け',
      light: '日陰OK',
      water: '月2-3回',
      description: '空気清浄効果が高く、水やりが少なくて済む。初心者におすすめ。',
      image: require('../../assets/images/plants/plants_SnakePlant.jpeg'),
      category: 'modern',
      stock: 15,
    },
    {
      id: '3',
      name: 'ゴールデンポトス',
      price: 1980,
      size: 'S',
      difficulty: '初心者向け',
      light: '日陰OK',
      water: '週1回',
      description: 'つる性で成長が早く、水栽培も可能。丈夫で育てやすい。',
      image: require('../../assets/images/plants/plants_GoldenPothos.jpeg'),
      category: 'cozy',
      stock: 20,
    },
    {
      id: '4',
      name: 'パキラ（マネーツリー）',
      price: 4980,
      size: 'L',
      difficulty: '初心者向け',
      light: '明るい日陰',
      water: '週1回',
      description: '別名「発財樹」。縁起が良いとされる観葉植物で人気。',
      image: require('../../assets/images/plants/plants_MoneyTree.jpeg'),
      category: 'natural',
      stock: 8,
    },
    {
      id: '5',
      name: 'フィカス・ベンジャミン',
      price: 5980,
      size: 'L',
      difficulty: '中級者向け',
      light: '明るい日陰',
      water: '週1-2回',
      description: '小さな緑の葉が美しく、インテリア性が高い人気の観葉植物。',
      image: require('../../assets/images/plants/plants_Ficusbenjamina.jpeg'),
      category: 'nordic',
      stock: 5,
    },
    {
      id: '6',
      name: 'ラバープラント（ゴムの木）',
      price: 4580,
      size: 'M',
      difficulty: '初心者向け',
      light: '明るい日陰',
      water: '週1-2回',
      description: '厚くて艶やかな葉が特徴。空気清浄効果もあり育てやすい。',
      image: require('../../assets/images/plants/plants_RubberPlant.jpeg'),
      category: 'modern',
      stock: 12,
    },
  ];

  async getAllPlants(): Promise<Plant[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.plantsDatabase;
  }

  async getPlantById(id: string): Promise<Plant | undefined> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.plantsDatabase.find(plant => plant.id === id);
  }

  async getRecommendedPlants(lightLevel?: string): Promise<Plant[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (lightLevel) {
      return this.plantsDatabase.filter(plant => 
        plant.light === lightLevel || plant.light === '日陰OK'
      );
    }
    
    return this.plantsDatabase.slice(0, 3);
  }

  async searchPlants(query: string): Promise<Plant[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const lowerQuery = query.toLowerCase();
    return this.plantsDatabase.filter(plant =>
      plant.name.toLowerCase().includes(lowerQuery) ||
      plant.description.toLowerCase().includes(lowerQuery)
    );
  }

  async getPlantsByCategory(category: string): Promise<Plant[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return this.plantsDatabase.filter(plant => plant.category === category);
  }
}

export const plantService = new PlantService();