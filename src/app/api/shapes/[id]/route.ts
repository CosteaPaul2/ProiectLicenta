import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getShape, updateShape, deleteShape } from '@/db/queries/shapes';
import { z } from 'zod';

const updateShapeSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  category: z.enum(['environmental', 'monitoring', 'industrial', 'residential', 'commercial', 'research', 'restricted', 'other']).optional(),
  properties: z.object({
    color: z.string(),
    fillColor: z.string().optional(),
    fillOpacity: z.number().min(0).max(1).optional(),
  }).passthrough().optional(),
  geometry: z.object({
    type: z.string(),
    coordinates: z.array(z.any()),
  }).passthrough().optional(),
  bounds: z.object({
    north: z.number(),
    south: z.number(),
    east: z.number(),
    west: z.number(),
  }).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid shape ID' }, { status: 400 });
    }

    const shape = await getShape(id, session.user.id);
    if (!shape) {
      return NextResponse.json({ error: 'Shape not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      shape: {
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
      }
    });
  } catch (error: any) {
    console.error('Error fetching shape:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shape' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid shape ID' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateShapeSchema.parse(body);

    const updatedShape = await updateShape(id, session.user.id, validatedData);
    if (!updatedShape) {
      return NextResponse.json({ error: 'Shape not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      shape: {
        id: updatedShape.id,
        name: updatedShape.name,
        description: updatedShape.description,
        category: updatedShape.category,
        shapeType: updatedShape.shapeType,
        properties: updatedShape.properties,
        geometry: updatedShape.geometry,
        bounds: updatedShape.bounds,
        createdAt: updatedShape.createdAt,
        updatedAt: updatedShape.updatedAt,
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating shape:', error);
    return NextResponse.json(
      { error: 'Failed to update shape' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a shape
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid shape ID' }, { status: 400 });
    }

    const deleted = await deleteShape(id, session.user.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Shape not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Shape deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting shape:', error);
    return NextResponse.json(
      { error: 'Failed to delete shape' },
      { status: 500 }
    );
  }
} 