import { useState, useEffect } from 'react';
import { subscriptionService } from '../services/subscription';
import { SUBSCRIPTION } from '../config/constants';

export const useSubscription = (userId?: string) => {
  const [isPremium, setIsPremium] = useState(false);
  const [plantsCount, setPlantsCount] = useState(0);
  const [canAddPlants, setCanAddPlants] = useState(true);
  const [canUseAIAnalysis, setCanUseAIAnalysis] = useState(true);
  const [canUseAIConsult, setCanUseAIConsult] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      checkStatus();
    }
  }, [userId]);

  const checkStatus = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const status = await subscriptionService.checkSubscriptionStatus(userId);
      setIsPremium(status.isPremium);
      setPlantsCount(status.plantsCount);
      setCanAddPlants(status.canAddMorePlants);
      setCanUseAIAnalysis(status.canAnalyze);
      setCanUseAIConsult(status.canConsult);
    } catch (error) {
      console.error('Failed to check subscription status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const upgradeToPremium = async () => {
    setIsLoading(true);
    try {
      const success = await subscriptionService.upgradeToPremium();
      if (success) {
        setIsPremium(true);
        setCanAddPlants(true);
        setCanUseAIAnalysis(true);
        setCanUseAIConsult(true);
      }
      return success;
    } catch (error) {
      console.error('Failed to upgrade to premium:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = async () => {
    setIsLoading(true);
    try {
      const success = await subscriptionService.cancelSubscription();
      if (success) {
        setIsPremium(false);
        await checkStatus();
      }
      return success;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const addPlant = () => {
    subscriptionService.incrementPlantsCount();
    const status = subscriptionService.getStatus();
    setPlantsCount(status.plantsCount);
    setCanAddPlants(status.canAddMorePlants);
  };

  const removePlant = () => {
    subscriptionService.decrementPlantsCount();
    const status = subscriptionService.getStatus();
    setPlantsCount(status.plantsCount);
    setCanAddPlants(status.canAddMorePlants);
  };

  const useAIAnalysis = () => {
    subscriptionService.incrementAnalysisCount();
    const status = subscriptionService.getStatus();
    setCanUseAIAnalysis(status.canAnalyze);
  };

  const useAIConsult = () => {
    subscriptionService.incrementConsultationCount();
    const status = subscriptionService.getStatus();
    setCanUseAIConsult(status.canConsult);
  };

  return {
    isPremium,
    plantsCount,
    canAddPlants,
    canUseAIAnalysis,
    canUseAIConsult,
    isLoading,
    maxFreePlants: SUBSCRIPTION.MAX_FREE_PLANTS,
    monthlyPrice: SUBSCRIPTION.MONTHLY_PRICE,
    upgradeToPremium,
    cancelSubscription,
    addPlant,
    removePlant,
    useAIAnalysis,
    useAIConsult,
  };
};