"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  createInitialQuotaStore,
  deleteQuota,
  loadQuotaStore,
  persistQuotaStore,
  quotaHealth,
  saveQuota,
  transitionQuota,
  type EnergyQuota,
  type QuotaApproval,
  type QuotaStore,
} from "@/data/client/quota-repository";
import { useAlarms } from "@/features/alarms/alarm-provider";
import { useOrganization } from "@/features/organization/organization-provider";

interface QuotaContextValue {
  store: QuotaStore;
  ready: boolean;
  save: (quota: EnergyQuota, reason: string) => void;
  transition: (id: string, approval: QuotaApproval, reason?: string) => void;
  remove: (id: string) => void;
}
const QuotaContext = createContext<QuotaContextValue | null>(null);

export function QuotaProvider({ children }: { children: ReactNode }) {
  const { raise } = useAlarms();
  const { store: organization } = useOrganization();
  const [store, setStore] = useState(createInitialQuotaStore);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setStore(loadQuotaStore());
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (ready) persistQuotaStore(store);
  }, [ready, store]);
  useEffect(() => {
    if (!ready) return;
    const risky = store.quotas.filter(
      (quota) =>
        quota.approval === "approved" &&
        ["projected-overrun", "exceeded"].includes(quotaHealth(quota).health),
    );
    const frame = window.requestAnimationFrame(() =>
      risky.forEach((quota) =>
        raise({
          id: `alarm-quota-${quota.id}`,
          meterId: quota.scopeNodeId,
          meterCode: "ENERGY-QUOTA",
          nodeName:
            organization.nodes.find((node) => node.id === quota.scopeNodeId)
              ?.name ?? quota.scopeNodeId,
          ruleId: "over_demand",
          severity:
            quotaHealth(quota).health === "exceeded" ? "critical" : "warning",
          category: "compliance",
          title:
            quotaHealth(quota).health === "exceeded"
              ? "Energy quota exceeded"
              : "Energy quota overrun projected",
          message: `Consumption pacing forecasts ${Math.round(quotaHealth(quota).forecastPct)}% of the approved allocation.`,
          raisedAt: new Date().toISOString(),
        }),
      ),
    );
    return () => window.cancelAnimationFrame(frame);
  }, [organization.nodes, raise, ready, store.quotas]);
  const value = useMemo<QuotaContextValue>(
    () => ({
      store,
      ready,
      save: (quota, reason) =>
        setStore((current) => saveQuota(current, quota, reason)),
      transition: (id, approval, reason) =>
        setStore((current) => transitionQuota(current, id, approval, reason)),
      remove: (id) => setStore((current) => deleteQuota(current, id)),
    }),
    [ready, store],
  );
  return (
    <QuotaContext.Provider value={value}>{children}</QuotaContext.Provider>
  );
}
export function useQuotas() {
  const context = useContext(QuotaContext);
  if (!context) throw new Error("useQuotas must be used inside QuotaProvider");
  return context;
}
