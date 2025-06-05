import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/DashboardClient";


export default async function DashboardPage() {
    const session = await auth();
    
    if (!session) {
        redirect("/login");
    }
  
    return (
        <>
          <DashboardClient
            username={session.user.username || ""}
            email={session.user.email}
            id={session.user.id} 
          />
        </>
    );
}
