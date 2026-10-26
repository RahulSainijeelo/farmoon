"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type DemoContextType = {
  demoMode: boolean;
  setDemoMode: (val: boolean) => void;
  plotId: string;
  setPlotId: (val: string) => void;
  killSwitchActive: boolean;
  setKillSwitchActive: (val: boolean | ((prev: boolean) => boolean)) => void;
};

const DemoContext = createContext<DemoContextType>({
  demoMode: true,
  setDemoMode: () => {},
  plotId: "PLOT-07B",
  setPlotId: () => {},
  killSwitchActive: false,
  setKillSwitchActive: () => {},
});

export function DemoProvider({ children }: { children: ReactNode }) {
  const [demoMode, setDemoModeState] = useState(true);
  const [plotId, setPlotIdState] = useState("PLOT-07B");
  const [killSwitchActive, setKillSwitchActive] = useState(false);

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("soil2sky_demo_mode");
      if (savedMode !== null) setDemoModeState(savedMode === "true");
      const savedPlot = localStorage.getItem("soil2sky_plot_id");
      if (savedPlot) setPlotIdState(savedPlot);
    } catch {
      // storage unavailable
    }
  }, []);

  const setDemoMode = (val: boolean) => {
    setDemoModeState(val);
    try {
      localStorage.setItem("soil2sky_demo_mode", String(val));
    } catch {
      // ignore
    }
  };

  const setPlotId = (val: string) => {
    setPlotIdState(val);
    try {
      localStorage.setItem("soil2sky_plot_id", val);
    } catch {
      // ignore
    }
  };

  return (
    <DemoContext.Provider value={{ demoMode, setDemoMode, plotId, setPlotId, killSwitchActive, setKillSwitchActive }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  return useContext(DemoContext);
}
