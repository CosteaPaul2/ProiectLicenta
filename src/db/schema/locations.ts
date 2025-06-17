import { pgTable, serial, text, jsonb, varchar } from "drizzle-orm/pg-core";

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  layerType: varchar("layer_type", { length: 50 }).notNull().default("co2"),
  category: varchar("category", { length: 50 }).notNull().default("monitoring_station"),
  properties: jsonb("properties").notNull(),
  geom: jsonb("geom").notNull(), 
});

export type LayerType = 'co2' | 'air_quality' | 'temperature' | 'industrial' | 'traffic';
export type CO2Category = 'industrial' | 'vehicle' | 'natural' | 'monitoring_station';
export type AirQualityCategory = 'pm25' | 'pm10' | 'ozone' | 'no2';
export type TemperatureCategory = 'weather_station' | 'urban_heat' | 'climate_monitoring';
export type IndustrialCategory = 'factory' | 'power_plant' | 'refinery' | 'chemical_plant';
export type TrafficCategory = 'highway' | 'intersection' | 'parking' | 'public_transport';
