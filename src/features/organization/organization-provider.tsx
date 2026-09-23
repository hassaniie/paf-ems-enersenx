"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { MeterStatus } from "@/domain";
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
  simulationRunning: boolean;
  setSimulationRunning: (running: boolean) => void;
  setMeterStatus: (meterId: string, status: MeterStatus) => void;
  refreshMeter: (meterId: string) => void;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(
  null,
);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState(createInitialOrganizationStore);
  const [ready, setReady] = useState(false);
  const [simulationRunning, setSimulationRunning] = useState(true);

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

  useEffect(() => {
    if (!ready || !simulationRunning) return;
    const timer = window.setInterval(() => {
      setStore((current) => ({
        ...current,
        liveStates: current.liveStates.map((state) => {
          if (state.status !== "online" || !state.lastReading) return state;
          const drift = 1 + (Math.random() - 0.5) * 0.018;
          return {
            ...state,
            lastReadingAt: new Date().toISOString(),
            lastReading: {
              ...state.lastReading,
              ts: new Date().toISOString(),
              activePowerKw: Number(
                (state.lastReading.activePowerKw * drift).toFixed(1),
              ),
            },
          };
        }),
      }));
    }, 5000);
    return () => window.clearInterval(timer);
  }, [ready, simulationRunning]);

  const value = useMemo<OrganizationContextValue>(
    () => ({
      store,
      ready,
      create: (mutation) => setStore(createOrganizationEntity(store, mutation)),
      update: (nodeId, mutation) =>
        setStore(updateOrganizationEntity(store, nodeId, mutation)),
      remove: (nodeId) => setStore(deleteOrganizationEntity(store, nodeId)),
      reset: () => setStore(resetOrganizationStore()),
      simulationRunning,
      setSimulationRunning,
      setMeterStatus: (meterId, status) =>
        setStore({
          ...store,
          liveStates: store.liveStates.map((state) =>
            state.meterId === meterId ? { ...state, status } : state,
          ),
          revision: store.revision + 1,
        }),
      refreshMeter: (meterId) =>
        setStore({
          ...store,
          liveStates: store.liveStates.map((state) =>
            state.meterId === meterId
              ? {
                  ...state,
                  status: state.lastReading ? "online" : "awaiting-data",
                  lastReadingAt: state.lastReading
                    ? new Date().toISOString()
                    : undefined,
                }
              : state,
          ),
          revision: store.revision + 1,
        }),
    }),
    [ready, simulationRunning, store],
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
