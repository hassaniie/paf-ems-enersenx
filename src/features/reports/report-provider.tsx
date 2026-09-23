"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  addGeneratedReport,
  createInitialReportStore,
  deleteGeneratedReport,
  duplicateGeneratedReport,
  loadReportStore,
  persistReportStore,
  renameGeneratedReport,
  setReportStatus,
  type GeneratedReport,
  type ReportStatus,
  type ReportStore,
} from "@/data/client/report-repository";

interface ReportContextValue {
  store: ReportStore;
  ready: boolean;
  add: (report: GeneratedReport) => void;
  rename: (reportId: string, title: string) => void;
  duplicate: (reportId: string) => void;
  setStatus: (reportId: string, status: ReportStatus) => void;
  remove: (reportId: string) => void;
}

const ReportContext = createContext<ReportContextValue | null>(null);

export function ReportProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState(createInitialReportStore);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setStore(loadReportStore());
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (ready) persistReportStore(store);
  }, [ready, store]);
  const value = useMemo<ReportContextValue>(
    () => ({
      store,
      ready,
      add: (report) =>
        setStore((current) => addGeneratedReport(current, report)),
      rename: (id, title) =>
        setStore((current) => renameGeneratedReport(current, id, title)),
      duplicate: (id) =>
        setStore((current) => duplicateGeneratedReport(current, id)),
      setStatus: (id, status) =>
        setStore((current) => setReportStatus(current, id, status)),
      remove: (id) => setStore((current) => deleteGeneratedReport(current, id)),
    }),
    [ready, store],
  );
  return (
    <ReportContext.Provider value={value}>{children}</ReportContext.Provider>
  );
}

export function useReports() {
  const context = useContext(ReportContext);
  if (!context)
    throw new Error("useReports must be used inside ReportProvider");
  return context;
}
