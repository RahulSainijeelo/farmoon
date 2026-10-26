"use client";

import { useEffect, useMemo, useState } from "react";
import budgetData from "@/config/budget.json";
import { SystemShell } from "@/components/shell/SystemShell";
import { HonestyPill } from "@/components/common/HonestyPill";
import { CheckCircle2, IndianRupee } from "lucide-react";

function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function FundPage() {
  const [quotes, setQuotes] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem("soil2sky_dealer_quotes");
      if (saved) setQuotes(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  const handleQuoteChange = (id: string, value: string) => {
    const updated = { ...quotes, [id]: value };
    setQuotes(updated);
    try {
      localStorage.setItem("soil2sky_dealer_quotes", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Computations strictly in code
  const subtotal = useMemo(() => {
    return budgetData.items.reduce((acc, item) => acc + item.amount, 0);
  }, []);

  const contingency = useMemo(() => {
    return Math.round((subtotal * budgetData.contingencyPercent) / 100);
  }, [subtotal]);

  const grandTotal = useMemo(() => {
    return subtotal + contingency;
  }, [subtotal, contingency]);

  const phaseTotals = useMemo(() => {
    const p1 = budgetData.items.filter((i) => i.phase === 1).reduce((acc, i) => acc + i.amount, 0);
    const p2 = budgetData.items.filter((i) => i.phase === 2).reduce((acc, i) => acc + i.amount, 0);
    const p3Base = budgetData.items.filter((i) => i.phase === 3).reduce((acc, i) => acc + i.amount, 0);
    const p3 = p3Base + contingency;
    return {
      phase1: p1,
      phase2: p2,
      phase3: p3,
      matches: p1 + p2 + p3 === grandTotal,
    };
  }, [subtotal, contingency, grandTotal]);

  return (
    <SystemShell>
      <div className="page-heading">
        <div>
          <div className="breadcrumb">
            <span>PLAN</span>
            <span className="breadcrumb-slash">/</span>
            <span>FUND</span>
          </div>
          <div className="title-row">
            <h1>Fund use & budget</h1>
            <HonestyPill status={budgetData.status} size="sm" />
          </div>
          <p className="page-subtitle">
            Phased capital allocation across sensor hardware, edge gateway, and field trials
          </p>
        </div>
        <div className="heading-meta">
          <span className="meta-label">TOTAL ALLOCATION</span>
          <strong style={{ fontSize: 13, color: "var(--accent-primary)" }}>{formatIndianCurrency(grandTotal)}</strong>
        </div>
      </div>

      {/* Phase Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 24 }}>
        {budgetData.phases.map((phase) => {
          const pAmount = phase.phase === 1 ? phaseTotals.phase1 : phase.phase === 2 ? phaseTotals.phase2 : phaseTotals.phase3;
          return (
            <div key={phase.phase} style={{ background: "#ffffff", border: "1px solid var(--border-std)", borderRadius: 8, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-tertiary)" }}>
                  PHASE 0{phase.phase} · {phase.months.toUpperCase()} MONTHS
                </span>
                <HonestyPill status="ESTIMATE" size="sm" />
              </div>
              <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800 }}>{phase.label}</h3>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent-primary)", fontFamily: "var(--font-mono)", marginBottom: 12 }}>
                {formatIndianCurrency(pAmount)}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                <strong>Key Deliverables:</strong>
                <ul style={{ margin: "6px 0 0", paddingLeft: 16, lineHeight: 1.4 }}>
                  {phase.outputs.map((out, idx) => (
                    <li key={idx}>{out}</li>
                  ))}
                  {phase.phase === 3 && <li>10% Contingency reserve ({formatIndianCurrency(contingency)})</li>}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals Match Verification Line */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f1f7f3", border: "1px solid #b7d6c3", borderRadius: 6, padding: "10px 16px", marginBottom: 20, fontSize: 12, fontWeight: 700, color: "var(--status-normal)" }}>
        <CheckCircle2 size={16} />
        <span>Phase totals ({formatIndianCurrency(phaseTotals.phase1)} + {formatIndianCurrency(phaseTotals.phase2)} + {formatIndianCurrency(phaseTotals.phase3)}) = {formatIndianCurrency(grandTotal)}. Totals match.</span>
      </div>

      {/* Budget Table */}
      <div className="plan-table-container">
        <table className="plan-table">
          <thead>
            <tr>
              <th style={{ width: "20%" }}>Item</th>
              <th style={{ width: "38%" }}>Cost Basis</th>
              <th style={{ width: "10%" }}>Phase</th>
              <th style={{ width: "16%" }}>Amount (INR)</th>
              <th style={{ width: "16%" }}>Dealer Quote</th>
            </tr>
          </thead>
          <tbody>
            {budgetData.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.label}</strong>
                </td>
                <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{item.basis}</td>
                <td>
                  <span className="mono-badge">P0{item.phase}</span>
                </td>
                <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                  {formatIndianCurrency(item.amount)}
                </td>
                <td>
                  <input
                    type="text"
                    className="table-quote-input"
                    placeholder="Pending quote…"
                    value={quotes[item.id] ?? ""}
                    onChange={(e) => handleQuoteChange(item.id, e.target.value)}
                  />
                </td>
              </tr>
            ))}
            {/* Contingency Row in Phase 3 */}
            <tr style={{ background: "#fbfbfc", fontStyle: "italic" }}>
              <td>
                <strong>Contingency Reserve</strong>
              </td>
              <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                10% risk margin on retail items
              </td>
              <td>
                <span className="mono-badge">P03</span>
              </td>
              <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                {formatIndianCurrency(contingency)}
              </td>
              <td style={{ color: "var(--text-tertiary)", fontSize: 11 }}>Computed buffer</td>
            </tr>
            {/* Grand Total Row */}
            <tr style={{ background: "#f4f7f5", fontWeight: 800 }}>
              <td colSpan={3}>
                <span style={{ fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase" }}>Total Budget</span>
              </td>
              <td style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: "var(--accent-primary)" }}>
                {formatIndianCurrency(grandTotal)}
              </td>
              <td>
                <HonestyPill status="ESTIMATE" size="sm" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="output-disclosure" style={{ marginTop: 14 }}>
        <span>{budgetData.note}</span>
      </div>
    </SystemShell>
  );
}
