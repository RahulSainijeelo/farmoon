"use client";

import { useMemo } from "react";
import statusData from "@/config/status.json";
import { SystemShell } from "@/components/shell/SystemShell";
import { HonestyPill } from "@/components/common/HonestyPill";
import { ShieldCheck } from "lucide-react";

export default function StatusPage() {
  const counts = useMemo(() => {
    let built = 0;
    let simulated = 0;
    let proposed = 0;
    statusData.rows.forEach((row) => {
      const s = row.status.toUpperCase();
      if (s === "BUILT") built += 1;
      else if (s === "SIMULATED") simulated += 1;
      else if (s === "PROPOSED") proposed += 1;
    });
    return { built, simulated, proposed };
  }, []);

  return (
    <SystemShell>
      <div className="page-heading">
        <div>
          <div className="breadcrumb">
            <span>PLAN</span>
            <span className="breadcrumb-slash">/</span>
            <span>STATUS</span>
          </div>
          <div className="title-row">
            <h1>Build status</h1>
            <HonestyPill status="BUILT" size="sm" />
          </div>
          <p className="page-subtitle">
            Honest accounting of built software versus planned hardware
          </p>
        </div>
        <div className="heading-meta">
          <span className="meta-label">LAST UPDATED</span>
          <strong>{statusData.updated}</strong>
        </div>
      </div>

      {/* Computed Summary Line */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 18px",
          background: "#ffffff",
          border: "1px solid var(--border-std)",
          borderRadius: 8,
          marginBottom: 20,
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        <ShieldCheck size={18} color="var(--accent-primary)" />
        <span>
          Verification tally:{" "}
          <strong style={{ color: "var(--status-normal)" }}>{counts.built} built</strong>,{" "}
          <strong style={{ color: "var(--status-warn)" }}>{counts.simulated} simulated</strong>,{" "}
          <strong style={{ color: "#1d4ed8" }}>{counts.proposed} proposed</strong>.
        </span>
      </div>

      {/* Status Table */}
      <div className="plan-table-container">
        <table className="plan-table">
          <thead>
            <tr>
              <th style={{ width: "32%" }}>System Area</th>
              <th style={{ width: "48%" }}>Scope & Detail</th>
              <th style={{ width: "20%" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {statusData.rows.map((row, index) => (
              <tr key={index}>
                <td>
                  <strong>{row.area}</strong>
                </td>
                <td style={{ color: "var(--text-secondary)" }}>{row.detail}</td>
                <td>
                  <HonestyPill status={row.status} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="output-disclosure" style={{ marginTop: 12 }}>
        <span>Note: No hardware item is marked as built. All sensor nodes and actuators are proposed designs.</span>
      </div>
    </SystemShell>
  );
}
