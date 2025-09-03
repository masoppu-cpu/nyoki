import { Plant } from '../types';

interface RoomAnalysisResult {
  lightLevel: 'low' | 'medium' | 'high';
  humidity: 'dry' | 'normal' | 'humid';
  temperature: 'cold' | 'normal' | 'warm';
  recommendedCategories: string[];
  suitablePlants: string[];
}

interface ARImageGenerationParams {
  roomImage: string;
  plants: Plant[];
  style: 'natural' | 'modern' | 'minimal';
  placementGuide: string;
}

interface ARImageResult {
  imageUrl: string;
}

class AIService {
  async analyzeRoom(imageUri: string): Promise<RoomAnalysisResult> {
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Mock analysis result
    return {
      lightLevel: 'medium',
      humidity: 'normal',
      temperature: 'normal',
      recommendedCategories: ['natural', 'modern', 'cozy'],
      suitablePlants: ['1', '2', '3'], // Plant IDs
    };
  }

  async generatePlantPlacement(
    roomImage: string,
    plantId: string,
    position: { x: number; y: number }
  ): Promise<string> {
    // Simulate AI image generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Return mock composite image URL
    // In production, this would call Gemini API
    return 'mock://generated-image-' + Date.now();
  }

  async consultPlantCare(plantId: string, question: string): Promise<string> {
    // Simulate AI consultation
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock AI response
    const responses = [
      '水やりは土の表面が乾いてから行うのがベストです。指で土を触って確認しましょう。',
      '葉が黄色くなる場合は、水のやりすぎか日光不足の可能性があります。',
      'この植物は直射日光を避け、明るい日陰で育てるのが理想的です。',
      '月に1回程度、液体肥料を与えると成長が促進されます。',
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  async identifyPlant(imageUri: string): Promise<string> {
    // Simulate plant identification
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock identification result
    return 'モンステラ・デリシオサ';
  }

  async generateARImage(params: ARImageGenerationParams): Promise<ARImageResult> {
    // Mock implementation
    if (process.env.EXPO_PUBLIC_USE_MOCK === 'true' || true) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3秒待機
      
      // スタイルに応じたモック画像を返す
      const mockImages = {
        natural: require('../../assets/images/room-after-natural.jpg'),
        modern: require('../../assets/images/room-after.jpg'),
        minimal: require('../../assets/images/room-after-cool.jpg'),
      };
      
      return {
        imageUrl: mockImages[params.style] || mockImages.natural
      };
    }

    // 実際のGemini API呼び出し（Phase 2で実装）
    const response = await fetch('/api/generate-ar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    
    return response.json();
  }
}

export const aiService = new AIService();