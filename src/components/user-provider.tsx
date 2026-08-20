"use client";

import { createContext, useContext } from "react";
import type { AuthSource } from "@/lib/auth";
import type { AppUser } from "@/lib/types/user";

type SessionContextValue = {
  user: AppUser;
  source: AuthSource;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function UserProvider({
  user,
  source,
  children,
}: {
  user: AppUser;
  source: AuthSource;
  children: React.ReactNode;
}) {
  return (
    <SessionContext.Provider value={{ user, source }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useAppUser(): AppUser {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error("useAppUser must be used within UserProvider");
  }
  return session.user;
}

export function useAuthSource(): AuthSource {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error("useAuthSource must be used within UserProvider");
  }
  return session.source;
}
