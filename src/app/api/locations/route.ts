import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/dbClient";
import { locations } from "@/db/schema/locations";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const layerType = searchParams.get('layerType');
    const category = searchParams.get('category');

    let allLocations;
    
    if (layerType) {
      allLocations = await db.select()
        .from(locations)
        .where(eq(locations.layerType, layerType));
    } else {
      allLocations = await db.select().from(locations);
    }

    if (category && allLocations) {
      allLocations = allLocations.filter(loc => loc.category === category);
    }
    
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
    const { 
      name, 
      latitude, 
      longitude, 
      layerType = 'co2',
      category = 'monitoring_station',
      co2Level,
      pm25Level,
      pm10Level,
      temperature,
      description, 
      source 
    } = body;

    if (!name || !latitude || !longitude) {
      return NextResponse.json(
        { error: "Missing required fields: name, latitude, longitude" },
        { status: 400 }
      );
    }


    const geometry = {
      type: "Point",
      coordinates: [longitude, latitude]
    };

  
    let properties: any = {
      description: description || "",
      source: source || "Manual Entry",
      createdBy: session.user.id,
      createdAt: new Date().toISOString(),
    };

    
    switch (layerType) {
      case 'co2':
        if (!co2Level) {
          return NextResponse.json(
            { error: "CO2 level is required for CO2 layer" },
            { status: 400 }
          );
        }
        properties = {
          ...properties,
          co2Level: parseFloat(co2Level),
          unit: "ppm"
        };
        break;
      
      case 'air_quality':
        properties = {
          ...properties,
          pm25Level: pm25Level ? parseFloat(pm25Level) : null,
          pm10Level: pm10Level ? parseFloat(pm10Level) : null,
          unit: "μg/m³"
        };
        break;
      
      case 'temperature':
        if (!temperature) {
          return NextResponse.json(
            { error: "Temperature is required for temperature layer" },
            { status: 400 }
          );
        }
        properties = {
          ...properties,
          temperature: parseFloat(temperature),
          unit: "°C"
        };
        break;
      
      case 'industrial':
      case 'traffic':

        break;
    }

    const result = await db.insert(locations).values({
      name,
      layerType,
      category,
      properties,
      geom: geometry,
    }).returning();

    return NextResponse.json({
      location: result[0],
      success: true,
      message: `${layerType} location created successfully`
    });

  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    );
  }
} 