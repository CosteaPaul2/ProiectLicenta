import { db } from "@/db/dbClient";
import { shapes, type NewShape, type Shape } from "@/db/schema/shapes";
import { eq, and, desc } from "drizzle-orm";

export async function getUserShapes(userId: string): Promise<Shape[]> {
  try {
    const userShapes = await db
      .select()
      .from(shapes)
      .where(eq(shapes.userId, userId))
      .orderBy(desc(shapes.createdAt));
    
    return userShapes;
  } catch (error) {
    console.error("Error fetching user shapes:", error);
    throw new Error("Failed to fetch shapes");
  }
}

export async function createShape(shapeData: Omit<NewShape, 'id' | 'createdAt' | 'updatedAt'>): Promise<Shape> {
  try {
    const [newShape] = await db
      .insert(shapes)
      .values({
        ...shapeData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    if (!newShape) {
      throw new Error("Failed to create shape");
    }
    
    return newShape;
  } catch (error) {
    console.error("Error creating shape:", error);
    throw new Error("Failed to create shape");
  }
}

export async function updateShape(
  id: number, 
  userId: string, 
  updates: Partial<Omit<NewShape, 'id' | 'userId' | 'createdAt'>>
): Promise<Shape | null> {
  try {
    const [updatedShape] = await db
      .update(shapes)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(eq(shapes.id, id), eq(shapes.userId, userId)))
      .returning();
    
    return updatedShape || null;
  } catch (error) {
    console.error("Error updating shape:", error);
    throw new Error("Failed to update shape");
  }
}

export async function deleteShape(id: number, userId: string): Promise<boolean> {
  try {
    const result = await db
      .delete(shapes)
      .where(and(eq(shapes.id, id), eq(shapes.userId, userId)))
      .returning();
    
    return result.length > 0;
  } catch (error) {
    console.error("Error deleting shape:", error);
    throw new Error("Failed to delete shape");
  }
}

export async function getShape(id: number, userId: string): Promise<Shape | null> {
  try {
    const [shape] = await db
      .select()
      .from(shapes)
      .where(and(eq(shapes.id, id), eq(shapes.userId, userId)));
    
    return shape || null;
  } catch (error) {
    console.error("Error fetching shape:", error);
    throw new Error("Failed to fetch shape");
  }
}

export async function getUserShapesByCategory(userId: string, category: string): Promise<Shape[]> {
  try {
    const categoryShapes = await db
      .select()
      .from(shapes)
      .where(and(eq(shapes.userId, userId), eq(shapes.category, category)))
      .orderBy(desc(shapes.createdAt));
    
    return categoryShapes;
  } catch (error) {
    console.error("Error fetching shapes by category:", error);
    throw new Error("Failed to fetch shapes by category");
  }
}

export async function deleteMultipleShapes(ids: number[], userId: string): Promise<number> {
  try {
    const deletePromises = ids.map(id => 
      db.delete(shapes).where(and(eq(shapes.id, id), eq(shapes.userId, userId)))
    );
    
    const results = await Promise.all(deletePromises);
    return results.filter(result => result.rowCount && result.rowCount > 0).length;
  } catch (error) {
    console.error("Error deleting multiple shapes:", error);
    throw new Error("Failed to delete shapes");
  }
} 