'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  currentPeriodEnd: string | null;
  loading: boolean;
}

interface SubscriptionContextType {
  subscription: SubscriptionStatus;
  refreshSubscription: () => Promise<void>;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    hasActiveSubscription: false,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripePriceId: null,
    currentPeriodEnd: null,
    loading: true
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshSubscription = async () => {
    if (!session?.user?.id) {
      setSubscription(prev => ({ ...prev, loading: false }));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/subscriptions');
      if (response.ok) {
        const data = await response.json();
        setSubscription({
          hasActiveSubscription: data.hasActiveSubscription,
          stripeCustomerId: data.stripeCustomerId,
          stripeSubscriptionId: data.stripeSubscriptionId,
          stripePriceId: data.stripePriceId,
          currentPeriodEnd: data.currentPeriodEnd,
          loading: false
        });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(prev => ({ ...prev, loading: false }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, [session]);

  return (
    <SubscriptionContext.Provider value={{ subscription, refreshSubscription, isLoading }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
} 