import { NextResponse } from "next/server";
import { db } from "@/db/dbClient";
import { users } from "@/db/schema/users";
import { hashPassword } from "@/app/utils/password";
import { createUniqueId } from "@/db/utils";
import { eq } from "drizzle-orm";
export async function POST(request: Request) {
    try {
        const { email, password, username } = await request.json()

        if (!email || !password || !username) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
        }

        const existingUser = await db.select().from(users).where(eq(users.email, email as string)).limit(1).then(rows => rows[0]);

        if (existingUser) {
            return NextResponse.json({ message: "User already exists" }, { status: 400 })
        }

        const hashedPassword = await hashPassword(password);
        const id = createUniqueId();

        await db.insert(users).values({ id, email, password: hashedPassword, username });

        return NextResponse.json({ message: "User created successfully" }, { status: 201 })
        
    } catch (error) {
        return NextResponse.json({ message: "User creation failed" }, { status: 500 })
    }
}
