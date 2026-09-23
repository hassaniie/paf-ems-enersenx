"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  createInitialUserStore,
  loadUserStore,
  persistUserStore,
  removeUser,
  saveUser,
  setUserStatus,
  type ManagedUser,
  type UserStore,
} from "@/data/client/user-repository";

interface UserContextValue {
  store: UserStore;
  ready: boolean;
  save: (user: ManagedUser) => void;
  setStatus: (id: string, status: "active" | "suspended") => void;
  remove: (id: string) => void;
}
const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState(createInitialUserStore);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setStore(loadUserStore());
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (ready) persistUserStore(store);
  }, [ready, store]);
  const value = useMemo<UserContextValue>(
    () => ({
      store,
      ready,
      save: (user) => setStore((current) => saveUser(current, user)),
      setStatus: (id, status) =>
        setStore((current) => setUserStatus(current, id, status)),
      remove: (id) => setStore((current) => removeUser(current, id)),
    }),
    [ready, store],
  );
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUsers() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUsers must be used inside UserProvider");
  return context;
}
