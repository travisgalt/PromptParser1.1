"use client";

import * as React from "react";

type DebugState = {
  overridePro: boolean;
  simulateDelay: boolean;
  maintenanceMode: boolean;
  setOverridePro: (v: boolean) => void;
  setSimulateDelay: (v: boolean) => void;
  setMaintenanceMode: (v: boolean) => void;
  resetAll: () => void;
};

const DebugContext = React.createContext<DebugState | null>(null);

const LS_KEYS = {
  pro: "debug:overridePro",
  delay: "debug:simulateDelay",
  maintenance: "debug:maintenanceMode",
};

export const DebugProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [overridePro, setOverrideProState] = React.useState<boolean>(() => {
    const v = localStorage.getItem(LS_KEYS.pro);
    return v === "true";
  });
  const [simulateDelay, setSimulateDelayState] = React.useState<boolean>(() => {
    const v = localStorage.getItem(LS_KEYS.delay);
    return v === "true";
  });
  const [maintenanceMode, setMaintenanceModeState] = React.useState<boolean>(() => {
    const v = localStorage.getItem(LS_KEYS.maintenance);
    return v === "true";
  });

  const setOverridePro = (v: boolean) => {
    setOverrideProState(v);
    localStorage.setItem(LS_KEYS.pro, String(v));
  };
  const setSimulateDelay = (v: boolean) => {
    setSimulateDelayState(v);
    localStorage.setItem(LS_KEYS.delay, String(v));
  };
  const setMaintenanceMode = (v: boolean) => {
    setMaintenanceModeState(v);
    localStorage.setItem(LS_KEYS.maintenance, String(v));
  };
  const resetAll = () => {
    setOverrideProState(false);
    setSimulateDelayState(false);
    setMaintenanceModeState(false);
    localStorage.setItem(LS_KEYS.pro, "false");
    localStorage.setItem(LS_KEYS.delay, "false");
    localStorage.setItem(LS_KEYS.maintenance, "false");
  };

  const value: DebugState = {
    overridePro,
    simulateDelay,
    maintenanceMode,
    setOverridePro,
    setSimulateDelay,
    setMaintenanceMode,
    resetAll,
  };

  return <DebugContext.Provider value={value}>{children}</DebugContext.Provider>;
};

export function useDebug(): DebugState {
  const ctx = React.useContext(DebugContext);
  if (!ctx) throw new Error("useDebug must be used within a DebugProvider");
  return ctx;
}