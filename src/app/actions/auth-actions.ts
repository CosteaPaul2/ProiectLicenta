'use server';

import { db } from "@/db/dbClient";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { verifyPassword } from "../utils/password";

export async function getUserByEmail(email: string) {
  try {
    return await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then(rows => rows[0] || null);
  } catch (error) {
    console.error("Error getting user by email:", error);
    return null;
  }
}

export async function verifyCredentials(email: string, password: string) {
  try {
    const user = await getUserByEmail(email);
    
    if (!user) {
      return null;
    }
    
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }
    
    return {
      id: user.id,
      email: user.email,
      username: user.username,
    };
  } catch (error) {
    console.error("Error verifying credentials:", error);
    return null;
  }
}

export async function createOrUpdateGoogleUser(id: string, email: string, name: string) {
  try {
    const existingUser = await getUserByEmail(email);
    
    if (!existingUser) {
      await db.insert(users).values({
        id,
        email,
        username: name || email.split('@')[0],
        password: '',
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error creating/updating Google user:", error);
    return false;
  }
} 