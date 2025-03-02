import { db } from "@/db/dbClient";
import { users } from "@/db/schema";
import { createUniqueId } from "@/db/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    const users = await db.query.users.findMany();

    return NextResponse.json({
        users,

    })
}

export async function POST(request: NextRequest) {
    const {username, email, password} = await request.json();

    const result = await db.insert(users).values({
        id: createUniqueId(),
        username,
        email,
        password,
    })
    .returning();

    return NextResponse.json({
        user: result,
    });
}
