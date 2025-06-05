"use client"

import dynamic from "next/dynamic";
import { SignOutButton } from "./SignOutButton";
import UserCardComponent from "./UserCardComponent";

interface DashboardClientProps {
    username: string;
    email: string;
    id: string;
}

const Map = dynamic(() => import("@/components/Map"), {
    ssr: false,
    loading: () => <p>A map is loading</p>,
    
});

export function DashboardClient({ email }: DashboardClientProps) {
    return (
      <>
        <UserCardComponent email={email} />
        <Map />
      </>
    );
  }