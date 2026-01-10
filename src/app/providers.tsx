'use client';

import { SessionProvider, useSession } from "next-auth/react";
import { StorageProvider } from "@/context/StorageContext";

function StorageWrapper({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  // Using user.id as a key forces the StorageProvider to completely 
  // reset/remount when a new user logs in or out.
  return (
    <StorageProvider key={session?.user?.id || 'anonymous'}>
      {children}
    </StorageProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <StorageWrapper>
        {children}
      </StorageWrapper>
    </SessionProvider>
  );
}
