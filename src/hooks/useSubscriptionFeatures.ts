'use client';

import { useSession } from 'next-auth/react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getUserPlan, canCreateLocation, canCreateShape, hasFeature, formatLimit, SubscriptionPlan } from '@/utils/subscription-utils';
import { useState, useEffect } from 'react';

interface UseSubscriptionFeaturesReturn {
  plan: SubscriptionPlan;
  canCreateLocation: (currentCount: number) => boolean;
  canCreateShape: (currentCount: number) => boolean;
  hasAdvancedDrawingTools: boolean;
  hasSpatialAnalysis: boolean;
  hasExportFeatures: boolean;
  hasPrioritySupport: boolean;
  maxLocations: string;
  maxShapes: string;
  storageGB: number;
  isLoading: boolean;
}

export function useSubscriptionFeatures(): UseSubscriptionFeaturesReturn {
  const { data: session } = useSession();
  const { subscription, isLoading } = useSubscription();
  const [plan, setPlan] = useState<SubscriptionPlan>({ 
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
  });

  useEffect(() => {
    if (!isLoading && session?.user) {
      const userPlan = getUserPlan({
        stripePriceId: subscription.stripePriceId,
        isActive: subscription.hasActiveSubscription
      });
      setPlan(userPlan);
    }
  }, [session, subscription, isLoading]);

  return {
    plan,
    canCreateLocation: (currentCount: number) => canCreateLocation(currentCount, plan),
    canCreateShape: (currentCount: number) => canCreateShape(currentCount, plan),
    hasAdvancedDrawingTools: hasFeature('advancedDrawingTools', plan),
    hasSpatialAnalysis: hasFeature('spatialAnalysis', plan),
    hasExportFeatures: hasFeature('exportFeatures', plan),
    hasPrioritySupport: hasFeature('prioritySupport', plan),
    maxLocations: formatLimit(plan.features.maxLocations),
    maxShapes: formatLimit(plan.features.maxShapes),
    storageGB: plan.features.storageGB,
    isLoading
  };
} 