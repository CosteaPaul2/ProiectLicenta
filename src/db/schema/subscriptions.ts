import { pgTable, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const subscriptions = pgTable("subscriptions", {
    id: varchar("id", { length: 255 }).primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).notNull().unique(),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull(),
    stripePriceId: varchar("stripe_price_id", { length: 255 }).notNull(),
    status: varchar("status", { length: 50 }).notNull(), // active, canceled, past_due, etc.
    currentPeriodStart: timestamp("current_period_start").notNull(),
    currentPeriodEnd: timestamp("current_period_end").notNull(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
});

export const subscriptionSchema = {
    subscriptions
}; 