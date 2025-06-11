import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Ignore PostGIS system tables
  tablesFilter: ["!spatial_ref_sys", "!geography_columns", "!geometry_columns"],
}); 