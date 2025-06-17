'use client';

import React, { useState } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useRouter } from 'next/navigation';

export default function SubscriptionManagement() {
  const { subscription, refreshSubscription } = useSubscription();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCancelSubscription = async () => {
    if (!subscription.stripeSubscriptionId) {
      alert('No active subscription found');
      return;
    }

    const confirmed = confirm(
      'Are you sure you want to cancel your subscription? It will remain active until the end of your current billing period.'
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel_subscription',
        }),
      });

      if (response.ok) {
        alert('Subscription cancelled successfully. You will retain access until the end of your current billing period.');
        await refreshSubscription();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to cancel subscription'}`);
      }
    } catch (error) {
      console.error('Cancel subscription error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (subscription.loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Subscription Status</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Subscription Status</h2>
      
      {subscription.hasActiveSubscription ? (
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <span className="text-green-700 font-medium">Active Subscription</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer ID
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {subscription.stripeCustomerId || 'N/A'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subscription ID
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {subscription.stripeSubscriptionId || 'N/A'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Period Ends
            </label>
            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
              {formatDate(subscription.currentPeriodEnd)}
            </p>
          </div>

          <div className="pt-4 border-t">
            <button
              onClick={handleCancelSubscription}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cancelling...
                </span>
              ) : (
                'Cancel Subscription'
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Your subscription will remain active until the end of your current billing period.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 rounded-full mr-3"></div>
            <span className="text-gray-700 font-medium">No Active Subscription</span>
          </div>
          
          <p className="text-gray-600">
            You don't have an active subscription. Subscribe to unlock all features.
          </p>
          
          <button
            onClick={() => router.push('/pricing')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            View Pricing Plans
          </button>
        </div>
      )}
    </div>
  );
} 