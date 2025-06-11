import { pgTable, serial, text, jsonb } from "drizzle-orm/pg-core";

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  properties: jsonb("properties").notNull(),
  geom: jsonb("geom").notNull(), 
});
