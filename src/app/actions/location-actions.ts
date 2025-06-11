'use server';

import { db } from "@/db/dbClient";
import { locations } from "@/db/schema/locations";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";

export interface CO2Location {
  id: number;
  name: string;
  properties: {
    co2Level: number;
    description: string;
    source: string;
    createdBy: string;
    createdAt: string;
    unit: string;
  };
  geom: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export async function getAllCO2Locations(): Promise<CO2Location[]> {
  try {
    const session = await auth();
    
    if (!session) {
      throw new Error("Unauthorized");
    }

    const result = await db.select().from(locations);
    return result as CO2Location[];
  } catch (error) {
    console.error("Error fetching CO2 locations:", error);
    throw new Error("Failed to fetch locations");
  }
}

export async function createCO2Location(data: {
  name: string;
  latitude: number;
  longitude: number;
  co2Level: number;
  description?: string;
  source?: string;
}) {
  try {
    const session = await auth();
    
    if (!session) {
      throw new Error("Unauthorized");
    }

    const { name, latitude, longitude, co2Level, description, source } = data;

    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
      throw new Error("Invalid latitude: must be between -90 and 90");
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error("Invalid longitude: must be between -180 and 180");
    }

    // Validate CO2 level (typical atmospheric CO2 is 400-500 ppm)
    if (co2Level < 0 || co2Level > 10000) {
      throw new Error("Invalid CO2 level: must be between 0 and 10000 ppm");
    }

    const geometry = {
      type: "Point" as const,
      coordinates: [longitude, latitude] as [number, number]
    };

    const properties = {
      co2Level,
      description: description || "",
      source: source || "Manual Entry",
      createdBy: session.user.id,
      createdAt: new Date().toISOString(),
      unit: "ppm"
    };

    const result = await db.insert(locations).values({
      name,
      properties,
      geom: geometry,
    }).returning();

    return {
      success: true,
      location: result[0] as CO2Location,
      message: "CO2 emission location created successfully"
    };

  } catch (error) {
    console.error("Error creating CO2 location:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create location"
    };
  }
}

export async function deleteCO2Location(locationId: number) {
  try {
    const session = await auth();
    
    if (!session) {
      throw new Error("Unauthorized");
    }

    await db.delete(locations).where(eq(locations.id, locationId));

    return {
      success: true,
      message: "Location deleted successfully"
    };

  } catch (error) {
    console.error("Error deleting location:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete location"
    };
  }
} 