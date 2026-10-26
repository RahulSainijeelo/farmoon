"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CloudOff, Shield, ShieldAlert, Sprout, Wifi } from "lucide-react";
import { SystemIcon, type IconName } from "@/components/icons/SystemIcons";
import { listEngineManifests } from "@/core/registry/engineRegistry";
import { listViewManifests } from "@/core/registry/viewRegistry";
import { localEdgeStore } from "@/core/storage/localEdgeStore";
import { useDemo } from "@/core/context/DemoContext";
import { HonestyPill } from "@/components/common/HonestyPill";

const engineManifests = listEngineManifests();
const planManifests = listViewManifests();

export function SystemShell({
  children,
  activeEngineId,
  onSelectEngine,
}: {
  children: ReactNode;
  activeEngineId?: string;
  onSelectEngine?: (id: string) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { demoMode, setDemoMode, plotId, setPlotId, killSwitchActive, setKillSwitchActive } = useDemo();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  const handleClear = async () => {
    if (window.confirm("Clear all locally stored records and cache?")) {
      await localEdgeStore.clear();
      window.location.reload();
    }
  };

  const handleEngineClick = (id: string) => {
    if (pathname === "/") {
      onSelectEngine?.(id);
    } else {
      router.push(`/?engine=${id}`);
    }
  };

  return (
    <div className="system-shell">
      <aside className="sidebar">
        <Link href="/" className="brand-block" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="brand-mark">
            <Sprout size={21} strokeWidth={1.7} />
          </div>
          <div>
            <strong>SOIL TO SKY</strong>
            <span>FIELD SYSTEM</span>
          </div>
        </Link>

        {/* Pipeline Group */}
        <div className="sidebar-group">
          <div className="sidebar-heading">
            <span>PIPELINE</span>
            <span className="count-badge">{engineManifests.length.toString().padStart(2, "0")}</span>
          </div>
          <div className="feature-list">
            {engineManifests.map((item) => {
              const isSelected = pathname === "/" && (activeEngineId ? activeEngineId === item.id : item.id === "soil-telemetry");
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`feature-item ${isSelected ? "selected" : ""}`}
                  onClick={() => handleEngineClick(item.id)}
                >
                  <SystemIcon name={item.iconName} size={17} />
                  <span>{item.label}</span>
                  {isSelected && <span className="feature-active-dot" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Plan Group */}
        <div className="sidebar-group">
          <div className="sidebar-heading">
            <span>PLAN</span>
            <span className="count-badge">{planManifests.length.toString().padStart(2, "0")}</span>
          </div>
          <div className="feature-list">
            {planManifests.map((view) => {
              const isSelected = pathname === view.route;
              return (
                <Link
                  key={view.id}
                  href={view.route}
                  className={`feature-item ${isSelected ? "selected" : ""}`}
                  style={{ textDecoration: "none" }}
                >
                  <SystemIcon name={view.icon as IconName} size={17} />
                  <span>{view.label}</span>
                  {isSelected && <span className="feature-active-dot" />}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Local Storage Block */}
        <div className="sidebar-bottom">
          <div className="store-indicator">
            <span className="store-dot" />
            <span>LOCAL STORE</span>
            <strong>READY</strong>
          </div>
          <div className="sidebar-note">IndexedDB · Edge cache</div>
          <button type="button" className="text-button" onClick={handleClear}>
            Clear local records
          </button>
        </div>
      </aside>

      <main className="workspace">
        <header className="utility-bar">
          <div className="system-state">
            {online ? <Wifi size={15} /> : <CloudOff size={15} />}
            <span>{online ? "EDGE LOCAL" : "OFFLINE MODE"}</span>
            <i className={online ? "signal-dot online" : "signal-dot offline"} />

            <button
              type="button"
              className={`demo-toggle-btn ${demoMode ? "active" : ""}`}
              onClick={() => setDemoMode(!demoMode)}
              style={{ marginLeft: 16 }}
            >
              <span>Demo mode</span>
              <span style={{ fontSize: 9, opacity: 0.8 }}>{demoMode ? "ON" : "OFF"}</span>
            </button>

            {demoMode && (
              <div className="demo-fixed-badge" style={{ marginLeft: 8 }}>
                <span>Sample data</span>
                <HonestyPill status="SIMULATED" size="sm" />
              </div>
            )}
          </div>

          <div className="utility-right">
            <label className="plot-control">
              <span>ACTIVE PLOT</span>
              <input
                aria-label="Active plot"
                value={plotId}
                onChange={(event) => setPlotId(event.target.value)}
              />
            </label>
            <button
              type="button"
              className={`kill-switch ${killSwitchActive ? "engaged" : ""}`}
              onClick={() => setKillSwitchActive((current) => !current)}
            >
              {killSwitchActive ? <ShieldAlert size={16} /> : <Shield size={16} />}
              <span>{killSwitchActive ? "STOP ACTIVE" : "REMOTE STOP"}</span>
            </button>
          </div>
        </header>

        <div className="content-area">{children}</div>

        <footer className="workspace-footer">
          <span>SOIL-TO-SKY / EDGE CONSOLE</span>
          <span>OFFLINE DATA STORED ON THIS DEVICE</span>
          <span>BUILD 1.0.0</span>
        </footer>
      </main>
    </div>
  );
}
