import { Plant, UserPlant } from '../types';

class PlantService {
  private plantsDatabase: Plant[] = [
    {
      id: '1',
      name: 'モンステラ',
      price: 3980,
      size: 'M',
      difficulty: '初心者向け',
      light: '明るい日陰',
      water: '週1-2回',
      description: '大きな切れ込みの入った葉が特徴的。育てやすく人気。',
      image: require('../../assets/images/your-room-after-plant1.png'),
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
      description: '空気清浄効果が高く、水やりが少なくて済む。',
      image: require('../../assets/images/your-room-after-plant2.png'),
      category: 'modern',
      stock: 15,
    },
    {
      id: '3',
      name: 'ポトス',
      price: 1980,
      size: 'S',
      difficulty: '初心者向け',
      light: '日陰OK',
      water: '週1回',
      description: 'つる性で成長が早く、水栽培も可能。',
      image: require('../../assets/images/your-room-after-plant3.png'),
      category: 'cozy',
      stock: 20,
    },
    {
      id: '4',
      name: 'パキラ',
      price: 4980,
      size: 'L',
      difficulty: '初心者向け',
      light: '明るい日陰',
      water: '週1回',
      description: '別名「発財樹」。縁起が良いとされる観葉植物。',
      image: require('../../assets/images/plants-collection.jpg'),
      category: 'natural',
      stock: 8,
    },
    {
      id: '5',
      name: 'フィカス・ウンベラータ',
      price: 5980,
      size: 'L',
      difficulty: '中級者向け',
      light: '明るい日陰',
      water: '週1-2回',
      description: 'ハート型の大きな葉が特徴。インテリア性が高い。',
      image: require('../../assets/images/room-after-natural.jpg'),
      category: 'nordic',
      stock: 5,
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