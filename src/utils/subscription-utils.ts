export interface SubscriptionPlan {
  id: string;
  name: string;
  stripePriceId: string;
  features: {
    maxLocations: number;
    maxShapes: number;
    advancedDrawingTools: boolean;
    spatialAnalysis: boolean;
    exportFeatures: boolean;
    prioritySupport: boolean;
    storageGB: number;
  };
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  'price_1RavLHGIHD2AbApd3FezDrza': {
    id: 'basic',
    name: 'Basic',
    stripePriceId: 'price_1RavLHGIHD2AbApd3FezDrza',
    features: {
      maxLocations: 10,
      maxShapes: 50,
      advancedDrawingTools: false,
      spatialAnalysis: false,
      exportFeatures: false,
      prioritySupport: false,
      storageGB: 1
    }
  },
  'price_1RavLqGIHD2AbApdGVdtMcoG': {
    id: 'pro',
    name: 'Pro',
    stripePriceId: 'price_1RavLqGIHD2AbApdGVdtMcoG',
          features: {
        maxLocations: -1,
        maxShapes: -1,
      advancedDrawingTools: true,
      spatialAnalysis: true,
      exportFeatures: true,
      prioritySupport: true,
      storageGB: 10
    }
  }
};

export const FREE_TIER: SubscriptionPlan = {
  id: 'free',
  name: 'Free',
  stripePriceId: '',
  features: {
    maxLocations: 3,
    maxShapes: 10,
    advancedDrawingTools: false,
    spatialAnalysis: false,
    exportFeatures: false,
    prioritySupport: false,
    storageGB: 0.1
  }
};

export function getPlanByPriceId(priceId: string | null): SubscriptionPlan {
  if (!priceId) return FREE_TIER;
  return SUBSCRIPTION_PLANS[priceId] || FREE_TIER;
}

export function getUserPlan(user: { stripePriceId?: string | null; isActive?: boolean }): SubscriptionPlan {
  if (!user.isActive || !user.stripePriceId) {
    return FREE_TIER;
  }
  return getPlanByPriceId(user.stripePriceId);
}

export function canCreateLocation(currentCount: number, plan: SubscriptionPlan): boolean {
  if (plan.features.maxLocations === -1) return true;
  return currentCount < plan.features.maxLocations;
}

export function canCreateShape(currentCount: number, plan: SubscriptionPlan): boolean {
  if (plan.features.maxShapes === -1) return true;
  return currentCount < plan.features.maxShapes;
}

export function hasFeature(feature: keyof SubscriptionPlan['features'], plan: SubscriptionPlan): boolean {
  return Boolean(plan.features[feature]);
}

export function getFeatureLimit(feature: keyof SubscriptionPlan['features'], plan: SubscriptionPlan): number {
  return plan.features[feature] as number;
}

export function formatLimit(limit: number): string {
  return limit === -1 ? 'Unlimited' : limit.toString();
} 