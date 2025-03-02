"use client"

import { SignOutButton } from "./SignOutButton";

interface DashboardClientProps {
    username: string;
    email: string;
    id: string;
}

export function DashboardClient({ username, email, id }: DashboardClientProps) {
    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <SignOutButton />
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Welcome, {username || email}!</h2>
                <div className="space-y-4">
                    <p>You are signed in as: {email}</p>
                    <p>User ID: {id}</p>
                </div>
            </div>
        </div>
    );
} 