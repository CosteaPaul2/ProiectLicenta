import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db/dbClient';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createCustomer, createCheckoutSession, cancelSubscription } from '@/utils/stripe';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const { action, priceId } = body;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'create_checkout_session') {
      let customerId = user.stripeCustomerId;

      if (!customerId) {
        const customer = await createCustomer(user.email, user.username);
        customerId = customer.id;

        await db
          .update(users)
          .set({ stripeCustomerId: customerId })
          .where(eq(users.id, session.user.id));
      }

      const baseUrl = process.env.AUTH_URL || 'http://localhost:3000';
      
      const checkoutSession = await createCheckoutSession(
        priceId,
        customerId,
        `${baseUrl}/dashboard?subscription=success`,
        `${baseUrl}/dashboard?subscription=cancelled`
      );

      return NextResponse.json({ sessionId: checkoutSession.id });
    }

    if (action === 'cancel_subscription') {
      if (!user.stripeSubscriptionId) {
        return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
      }

      await cancelSubscription(user.stripeSubscriptionId);
      
      return NextResponse.json({ 
        message: 'Subscription cancelled successfully'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({
      hasActiveSubscription: user.isActive || false,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      stripePriceId: user.stripePriceId,
      currentPeriodEnd: user.stripeCurrentPeriodEnd
    });

  } catch (error) {
    console.error('Get subscription API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 