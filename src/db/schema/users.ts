import { pgTable, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: varchar("id", { length: 255 }).primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    username: varchar("username", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull()
}, (table) => [
    uniqueIndex("email_index").on(table.email),
]);

export const userSchema = {
    users: users,
};
