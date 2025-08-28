import { SUBSCRIPTION } from '../config/constants';

interface SubscriptionStatus {
  isPremium: boolean;
  plantsCount: number;
  analysisCount: number;
  consultationCount: number;
  canAddMorePlants: boolean;
  canAnalyze: boolean;
  canConsult: boolean;
}

class SubscriptionService {
  private userStatus: SubscriptionStatus = {
    isPremium: false,
    plantsCount: 0,
    analysisCount: 0,
    consultationCount: 0,
    canAddMorePlants: true,
    canAnalyze: true,
    canConsult: true,
  };

  async checkSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    // Mock subscription check
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update status
    this.userStatus = {
      ...this.userStatus,
      canAddMorePlants: this.userStatus.isPremium || this.userStatus.plantsCount < SUBSCRIPTION.MAX_FREE_PLANTS,
      canAnalyze: this.userStatus.isPremium || this.userStatus.analysisCount < SUBSCRIPTION.MAX_FREE_AI_ANALYSIS,
      canConsult: this.userStatus.isPremium || this.userStatus.consultationCount < SUBSCRIPTION.MAX_FREE_AI_CONSULTATION,
    };

    return this.userStatus;
  }

  async upgradeToPremium(): Promise<boolean> {
    // Mock payment process
    await new Promise(resolve => setTimeout(resolve, 2000));

    this.userStatus = {
      ...this.userStatus,
      isPremium: true,
      canAddMorePlants: true,
      canAnalyze: true,
      canConsult: true,
    };

    return true;
  }

  async cancelSubscription(): Promise<boolean> {
    // Mock cancellation
    await new Promise(resolve => setTimeout(resolve, 1000));

    this.userStatus.isPremium = false;
    return true;
  }

  incrementPlantsCount(): void {
    this.userStatus.plantsCount += 1;
    this.userStatus.canAddMorePlants = 
      this.userStatus.isPremium || this.userStatus.plantsCount < SUBSCRIPTION.MAX_FREE_PLANTS;
  }

  decrementPlantsCount(): void {
    if (this.userStatus.plantsCount > 0) {
      this.userStatus.plantsCount -= 1;
      this.userStatus.canAddMorePlants = 
        this.userStatus.isPremium || this.userStatus.plantsCount < SUBSCRIPTION.MAX_FREE_PLANTS;
    }
  }

  incrementAnalysisCount(): void {
    this.userStatus.analysisCount += 1;
    this.userStatus.canAnalyze = 
      this.userStatus.isPremium || this.userStatus.analysisCount < SUBSCRIPTION.MAX_FREE_AI_ANALYSIS;
  }

  incrementConsultationCount(): void {
    this.userStatus.consultationCount += 1;
    this.userStatus.canConsult = 
      this.userStatus.isPremium || this.userStatus.consultationCount < SUBSCRIPTION.MAX_FREE_AI_CONSULTATION;
  }

  resetMonthlyLimits(): void {
    this.userStatus.analysisCount = 0;
    this.userStatus.consultationCount = 0;
    this.userStatus.canAnalyze = true;
    this.userStatus.canConsult = true;
  }

  getStatus(): SubscriptionStatus {
    return this.userStatus;
  }
}

export const subscriptionService = new SubscriptionService();