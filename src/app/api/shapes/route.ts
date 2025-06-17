import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserShapes, createShape } from '@/db/queries/shapes';
import { z } from 'zod';

const createShapeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.enum(['environmental', 'monitoring', 'industrial', 'residential', 'commercial', 'research', 'restricted', 'other']),
  shapeType: z.enum(['polygon', 'circle', 'rectangle', 'polyline', 'marker']),
  properties: z.object({
    color: z.string(),
    fillColor: z.string().optional(),
    fillOpacity: z.number().min(0).max(1).optional(),
  }).passthrough(), 
  geometry: z.object({
    type: z.string(),
    coordinates: z.array(z.any()),
  }).passthrough(), 
  bounds: z.object({
    north: z.number(),
    south: z.number(),
    east: z.number(),
    west: z.number(),
  }).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shapes = await getUserShapes(session.user.id);
    
    return NextResponse.json({ 
      success: true, 
      shapes: shapes.map(shape => ({
        id: shape.id,
        name: shape.name,
        description: shape.description,
        category: shape.category,
        shapeType: shape.shapeType,
        properties: shape.properties,
        geometry: shape.geometry,
        bounds: shape.bounds,
        createdAt: shape.createdAt,
        updatedAt: shape.updatedAt,
      }))
    });
  } catch (error) {
    console.error('Error fetching shapes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shapes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createShapeSchema.parse(body);

    let bounds = validatedData.bounds;
    if (!bounds && validatedData.geometry.coordinates) {
      bounds = calculateBounds(validatedData.geometry);
    }

    const newShape = await createShape({
      name: validatedData.name,
      description: validatedData.description,
      category: validatedData.category,
      shapeType: validatedData.shapeType,
      properties: validatedData.properties,
      geometry: validatedData.geometry,
      bounds: bounds,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      shape: {
        id: newShape.id,
        name: newShape.name,
        description: newShape.description,
        category: newShape.category,
        shapeType: newShape.shapeType,
        properties: newShape.properties,
        geometry: newShape.geometry,
        bounds: newShape.bounds,
        createdAt: newShape.createdAt,
        updatedAt: newShape.updatedAt,
      }
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating shape:', error);
    return NextResponse.json(
      { error: 'Failed to create shape' },
      { status: 500 }
    );
  }
}

function calculateBounds(geometry: any) {
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;

  function processCoordinates(coords: any) {
    if (Array.isArray(coords[0])) {
      coords.forEach(processCoordinates);
    } else {
      const [lng, lat] = coords;
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    }
  }

  processCoordinates(geometry.coordinates);

  return {
    north: maxLat,
    south: minLat,
    east: maxLng,
    west: minLng,
  };
} 