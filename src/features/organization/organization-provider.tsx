"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  createInitialOrganizationStore,
  createOrganizationEntity,
  deleteOrganizationEntity,
  loadOrganizationStore,
  persistOrganizationStore,
  resetOrganizationStore,
  updateOrganizationEntity,
  type OrganizationMutation,
  type OrganizationStore,
} from "@/data/client/organization-repository";

interface OrganizationContextValue {
  store: OrganizationStore;
  ready: boolean;
  create: (mutation: OrganizationMutation) => void;
  update: (nodeId: string, mutation: OrganizationMutation) => void;
  remove: (nodeId: string) => void;
  reset: () => void;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(
  null,
);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState(createInitialOrganizationStore);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setStore(loadOrganizationStore());
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (ready) persistOrganizationStore(store);
  }, [ready, store]);

  const value = useMemo<OrganizationContextValue>(
    () => ({
      store,
      ready,
      create: (mutation) => setStore(createOrganizationEntity(store, mutation)),
      update: (nodeId, mutation) =>
        setStore(updateOrganizationEntity(store, nodeId, mutation)),
      remove: (nodeId) => setStore(deleteOrganizationEntity(store, nodeId)),
      reset: () => setStore(resetOrganizationStore()),
    }),
    [ready, store],
  );

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context)
    throw new Error("useOrganization must be used inside OrganizationProvider");
  return context;
}
