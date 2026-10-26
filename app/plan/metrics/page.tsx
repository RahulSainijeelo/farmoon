"use client";

import { useState } from "react";
import metricsData from "@/config/metrics.json";
import { SystemShell } from "@/components/shell/SystemShell";
import { HonestyPill } from "@/components/common/HonestyPill";
import { Activity, AlertCircle } from "lucide-react";

export default function MetricsPage() {
  const [showSimulated, setShowSimulated] = useState(false);

  return (
    <SystemShell>
      <div className="page-heading">
        <div>
          <div className="breadcrumb">
            <span>PLAN</span>
            <span className="breadcrumb-slash">/</span>
            <span>METRICS</span>
          </div>
          <div className="title-row">
            <h1>Agronomic & operational metrics</h1>
            <HonestyPill status={showSimulated ? "SIMULATED" : "PROPOSED"} size="sm" />
          </div>
          <p className="page-subtitle">
            Measured outcomes across water conservation, chemical reductions, and crop protection
          </p>
        </div>
        <div className="heading-meta">
          <span className="meta-label">DATA TRIAL</span>
          <strong>PHASE 3 PENDING</strong>
        </div>
      </div>

      {/* Honesty Disclosure Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          background: showSimulated ? "#fff8ea" : "#ffffff",
          border: `1px solid ${showSimulated ? "#f1d89e" : "var(--border-std)"}`,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AlertCircle size={18} color={showSimulated ? "#9a5b00" : "var(--text-secondary)"} />
          <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
            {showSimulated
              ? "Showing simulated trial projections. No claims are made until real season trial data is gathered."
              : "No field data yet collected. Cells reflect verified status; trial begins in Phase 3."}
          </span>
        </div>

        <button
          type="button"
          className="demo-toggle-btn"
          onClick={() => setShowSimulated(!showSimulated)}
        >
          <span>SIMULATED example</span>
          <span style={{ fontSize: 9, opacity: 0.8 }}>{showSimulated ? "ON" : "OFF"}</span>
        </button>
      </div>

      {/* Metrics Table */}
      <div className="plan-table-container">
        <table className="plan-table">
          <thead>
            <tr>
              <th style={{ width: "28%" }}>Metric Indicator</th>
              <th style={{ width: "24%" }}>Baseline Farming</th>
              <th style={{ width: "24%" }}>With Soil-to-Sky</th>
              <th style={{ width: "24%" }}>Observed Change</th>
            </tr>
          </thead>
          <tbody>
            {metricsData.indicators.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.indicator}</strong>
                </td>
                <td>
                  {showSimulated ? (
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{item.simulatedBaseline}</span>
                  ) : (
                    <span style={{ color: "var(--text-tertiary)" }}>
                      {item.baseline} <HonestyPill status="PROPOSED" size="sm" />
                    </span>
                  )}
                </td>
                <td>
                  {showSimulated ? (
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-primary)" }}>
                      {item.simulatedWithSystem}
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-tertiary)" }}>
                      {item.withSystem} <HonestyPill status="PROPOSED" size="sm" />
                    </span>
                  )}
                </td>
                <td>
                  {showSimulated ? (
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--status-normal)" }}>
                      {item.simulatedChange}
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-tertiary)", fontSize: 12 }}>
                      {item.change}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="output-disclosure" style={{ marginTop: 14 }}>
        <span>{metricsData.note}</span>
      </div>
    </SystemShell>
  );
}
