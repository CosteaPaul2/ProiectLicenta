import { pgTable, uniqueIndex, varchar, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: varchar("id", { length: 255 }).primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    username: varchar("username", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    // Stripe subscription fields
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
    stripePriceId: varchar("stripe_price_id", { length: 255 }),
    stripeCurrentPeriodEnd: timestamp("stripe_current_period_end"),
    isActive: boolean("is_active").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
}, (table) => [
    uniqueIndex("email_index").on(table.email),
]);

export const userSchema = {
    users: users,
};
