import { db } from "@/db/dbClient";
import { locations } from "@/db/schema/locations";

export async function getAllLocations() {
  try {
    const allLocations = await db
      .select()
      .from(locations);
    
    return allLocations;
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
} 