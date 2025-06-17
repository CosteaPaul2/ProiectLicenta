'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { stripePromise } from '@/utils/stripe-client';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId: string;
  popular?: boolean;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 999, // €9.99 in cents
    interval: 'month',
    stripePriceId: 'price_1RavLHGIHD2AbApd3FezDrza', // Your actual Stripe Basic price ID
    features: [
      'Up to 10 locations',
      'Basic drawing tools',
      'Standard support',
      '1GB storage'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 1999, // €19.99 in cents
    interval: 'month',
    stripePriceId: 'price_1RavLqGIHD2AbApdGVdtMcoG', // Your actual Stripe Pro price ID
    popular: true,
    features: [
      'Unlimited locations',
      'Advanced drawing tools',
      'Priority support',
      '10GB storage',
      'Spatial analysis tools',
      'Export features'
    ]
  }
];

export default function PricingPage() {
  const { data: session } = useSession();
  const { subscription } = useSubscription();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string, planId: string) => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (subscription.hasActiveSubscription) {
      alert('You already have an active subscription!');
      return;
    }

    setLoading(planId);

    try {
      // Create checkout session
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_checkout_session',
          priceId: priceId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: sessionId,
        });

        if (error) {
          console.error('Stripe redirect error:', error);
          alert('Something went wrong. Please try again.');
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    return (price / 100).toFixed(2);
  };

  return (
    <div className="py-12 px-4 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Unlock powerful mapping and spatial analysis tools for your projects
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {pricingPlans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-lg shadow-lg border-2 ${
              plan.popular ? 'border-blue-500' : 'border-gray-200'
            } p-6`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">
                  ${formatPrice(plan.price)}
                </span>
                <span className="text-gray-600">/{plan.interval}</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.stripePriceId, plan.id)}
              disabled={loading !== null || subscription.hasActiveSubscription}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                plan.popular
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              } ${
                loading === plan.id ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                subscription.hasActiveSubscription ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading === plan.id ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : subscription.hasActiveSubscription ? (
                'Already Subscribed'
              ) : (
                `Subscribe to ${plan.name}`
              )}
            </button>
          </div>
        ))}
      </div>

      {subscription.hasActiveSubscription && (
        <div className="mt-8 text-center">
          <p className="text-green-600 font-medium">
            ✓ You have an active subscription
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-2 text-blue-500 hover:text-blue-600 font-medium"
          >
            Go to Dashboard →
          </button>
        </div>
      )}
    </div>
  );
} 