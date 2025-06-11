import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/dbClient";
import { locations } from "@/db/schema/locations";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allLocations = await db.select().from(locations);
    
    return NextResponse.json({
      locations: allLocations,
      success: true
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}


export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, latitude, longitude, co2Level, description, source } = body;

    // Validate required fields
    if (!name || !latitude || !longitude || !co2Level) {
      return NextResponse.json(
        { error: "Missing required fields: name, latitude, longitude, co2Level" },
        { status: 400 }
      );
    }

    // Create GeoJSON geometry
    const geometry = {
      type: "Point",
      coordinates: [longitude, latitude]
    };

    // Create properties object with CO2 data
    const properties = {
      co2Level: parseFloat(co2Level),
      description: description || "",
      source: source || "Manual Entry",
      createdBy: session.user.id,
      createdAt: new Date().toISOString(),
      unit: "ppm" // parts per million
    };

    const result = await db.insert(locations).values({
      name,
      properties,
      geom: geometry,
    }).returning();

    return NextResponse.json({
      location: result[0],
      success: true,
      message: "CO2 emission location created successfully"
    });

  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    );
  }
} 