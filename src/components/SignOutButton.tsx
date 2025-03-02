"use client";

import { signOut } from "@/auth";
import { useState } from "react";

export function SignOutButton() {
    const [isLoading, setIsLoading] = useState(false);
    
    const handleSignOut = async () => {
        setIsLoading(true);
        try {
            await signOut();
        } catch (error) {
            console.error("Sign out error:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <button
            onClick={handleSignOut}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:bg-red-400"
        >
            {isLoading ? "Signing out..." : "Sign out"}
        </button>
    );
} 