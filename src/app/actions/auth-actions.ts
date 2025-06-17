'use server';

import { db } from "@/db/dbClient";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { verifyPassword } from "../utils/password";
import { createUniqueId } from "../utils/createUniqueId";

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

export async function createOrUpdateGoogleUser(googleId: string, email: string, name: string) {
  try {
    // First check if user already exists by email
    const existingUser = await getUserByEmail(email);
    
    if (existingUser) {
      // Return existing user
      return {
        id: existingUser.id,
        email: existingUser.email,
        username: existingUser.username,
      };
    }
    
    // Create new user with our own database ID
    const userId = createUniqueId();
    await db.insert(users).values({
      id: userId,
      email,
      username: name || email.split('@')[0],
      password: '', // Empty password for OAuth users
    });
    
    // Return the newly created user
    return {
      id: userId,
      email,
      username: name || email.split('@')[0],
    };
  } catch (error) {
    console.error("Error creating/updating Google user:", error);
    return null;
  }
} 