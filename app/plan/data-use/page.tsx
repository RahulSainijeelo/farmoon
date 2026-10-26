"use client";

import dataUseConfig from "@/config/data-use.json";
import { SystemShell } from "@/components/shell/SystemShell";
import { HonestyPill } from "@/components/common/HonestyPill";
import { Lock, Scale, ShieldCheck } from "lucide-react";

export default function DataUsePage() {
  return (
    <SystemShell>
      <div className="page-heading">
        <div>
          <div className="breadcrumb">
            <span>PLAN</span>
            <span className="breadcrumb-slash">/</span>
            <span>DATA USE</span>
          </div>
          <div className="title-row">
            <h1>{dataUseConfig.title}</h1>
            <HonestyPill status={dataUseConfig.status} size="sm" />
          </div>
          <p className="page-subtitle">
            Edge-first telemetry management, farmer privacy protections, and DPDP compliance
          </p>
        </div>
        <div className="heading-meta">
          <span className="meta-label">LEGAL STANDARD</span>
          <strong>DPDP ACT 2023</strong>
        </div>
      </div>

      <div style={{ maxWidth: 840, background: "#ffffff", border: "1px solid var(--border-std)", borderRadius: 8, padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <ShieldCheck size={20} color="var(--accent-primary)" />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Core Privacy & Governance Principles</h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {dataUseConfig.points.map((pt, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 16, paddingBottom: 14, borderBottom: "1px solid var(--border-light)" }}>
              <strong style={{ fontSize: 12, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.04em" }}>
                {pt.key}
              </strong>
              <span style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5 }}>
                {pt.detail}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          maxWidth: 840,
          background: "#f8f9fa",
          border: "1px solid #d1d5db",
          borderRadius: 8,
          padding: 16,
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          fontSize: 12,
          color: "var(--text-secondary)",
          lineHeight: 1.5,
        }}
      >
        <Scale size={18} style={{ flexShrink: 0, marginTop: 2, color: "var(--text-primary)" }} />
        <span>{dataUseConfig.legalNote}</span>
      </div>
    </SystemShell>
  );
}
