"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { HeroUIProvider } from "@heroui/react";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <HeroUIProvider>
        <div className="dark">
          <SubscriptionProvider>
            {children}
          </SubscriptionProvider>
        </div>
      </HeroUIProvider>
    </SessionProvider>
  );
}