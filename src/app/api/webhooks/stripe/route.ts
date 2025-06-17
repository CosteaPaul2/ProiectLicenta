import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/utils/stripe';
import { db } from '@/db/dbClient';
import { users, subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === 'subscription') {
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;

          // Get the subscription details from Stripe
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price.id;

          // Find user by Stripe customer ID
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.stripeCustomerId, customerId))
            .limit(1);

          if (user && priceId) {
            // Update user table
            await db
              .update(users)
              .set({
                stripeSubscriptionId: subscriptionId,
                stripePriceId: priceId,
                stripeCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                isActive: true,
                updatedAt: new Date()
              })
              .where(eq(users.id, user.id));

            // Create subscription record
            await db
              .insert(subscriptions)
              .values({
                id: `sub_${Date.now()}_${user.id}`,
                userId: user.id,
                stripeSubscriptionId: subscriptionId,
                stripeCustomerId: customerId,
                stripePriceId: priceId,
                status: subscription.status,
                currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
                currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
                createdAt: new Date(),
                updatedAt: new Date()
              })
              .onConflictDoUpdate({
                target: subscriptions.stripeSubscriptionId,
                set: {
                  status: subscription.status,
                  stripePriceId: priceId,
                  currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
                  currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                  cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
                  updatedAt: new Date()
                }
              });

          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0]?.price.id;
        
        // Find user by Stripe customer ID
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.stripeCustomerId, subscription.customer as string))
          .limit(1);

        if (user && priceId) {
          // Update user table
          await db
            .update(users)
            .set({
              stripePriceId: priceId,
              stripeCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
              isActive: subscription.status === 'active',
              updatedAt: new Date()
            })
            .where(eq(users.id, user.id));

          // Update subscription record
          await db
            .update(subscriptions)
            .set({
              status: subscription.status,
              stripePriceId: priceId,
              currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
              currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
              cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
              updatedAt: new Date()
            })
            .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find user by Stripe customer ID
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.stripeCustomerId, subscription.customer as string))
          .limit(1);

        if (user) {
          // Update user table
          await db
            .update(users)
            .set({
              stripeSubscriptionId: null,
              stripePriceId: null,
              stripeCurrentPeriodEnd: null,
              isActive: false,
              updatedAt: new Date()
            })
            .where(eq(users.id, user.id));

          // Update subscription record status
          await db
            .update(subscriptions)
            .set({
              status: 'canceled',
              updatedAt: new Date()
            })
            .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        
        if (invoice.subscription && typeof invoice.subscription === 'string') {
          // Find user by subscription ID
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.stripeSubscriptionId, invoice.subscription))
            .limit(1);

          if (user) {
            // Update user table
            await db
              .update(users)
              .set({
                isActive: false,
                updatedAt: new Date()
              })
              .where(eq(users.id, user.id));

            // Update subscription record
            await db
              .update(subscriptions)
              .set({
                status: 'past_due',
                updatedAt: new Date()
              })
              .where(eq(subscriptions.stripeSubscriptionId, invoice.subscription));
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        
        if (invoice.subscription && typeof invoice.subscription === 'string') {
          // Find user by subscription ID
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.stripeSubscriptionId, invoice.subscription))
            .limit(1);

          if (user) {
            // Update user table
            await db
              .update(users)
              .set({
                isActive: true,
                updatedAt: new Date()
              })
              .where(eq(users.id, user.id));

            // Update subscription record
            await db
              .update(subscriptions)
              .set({
                status: 'active',
                updatedAt: new Date()
              })
              .where(eq(subscriptions.stripeSubscriptionId, invoice.subscription));
          }
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
} 