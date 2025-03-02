// This is a Server Component
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/DashboardClient";

export default async function DashboardPage() {
    const session = await auth();
    
    if (!session) {
        redirect("/login");
    }
    
    // Pass only the necessary data to the client component
    return (
        <DashboardClient 
            username={session.user.username || ""}
            email={session.user.email}
            id={session.user.id}
        />
    );
}