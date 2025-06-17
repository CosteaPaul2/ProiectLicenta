import { pgTable, serial, text, jsonb, varchar, timestamp, index } from "drizzle-orm/pg-core";

export const shapes = pgTable("shapes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull().default("environmental"),
  shapeType: varchar("shape_type", { length: 50 }).notNull(), // 'polygon', 'circle', 'rectangle', 'polyline', 'marker'
  properties: jsonb("properties").notNull(), // Contains color, fillColor, fillOpacity, etc.
  geometry: jsonb("geometry").notNull(), // GeoJSON geometry
  bounds: jsonb("bounds"), // Bounding box for quick spatial queries
  userId: varchar("user_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("shapes_user_id_idx").on(table.userId),
  index("shapes_category_idx").on(table.category),
  index("shapes_type_idx").on(table.shapeType),
  index("shapes_created_idx").on(table.createdAt),
]);

export type ShapeType = 'polygon' | 'circle' | 'rectangle' | 'polyline' | 'marker';
export type ShapeCategory = 
  | 'environmental' 
  | 'monitoring' 
  | 'industrial' 
  | 'residential' 
  | 'commercial' 
  | 'research' 
  | 'restricted' 
  | 'other';

export type Shape = typeof shapes.$inferSelect;
export type NewShape = typeof shapes.$inferInsert; 