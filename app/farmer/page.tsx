"use client";

import { useEffect, useState, useMemo } from "react";
import hiStrings from "@/config/i18n/hi.json";
import enStrings from "@/config/i18n/en.json";
import { SystemShell } from "@/components/shell/SystemShell";
import { HonestyPill } from "@/components/common/HonestyPill";
import { localEdgeStore } from "@/core/storage/localEdgeStore";
import { useDemo } from "@/core/context/DemoContext";
import type { Stage2Result, Stage2Zone } from "@/core/types/pipeline";
import { Camera, CheckCircle2, MessageSquare, ShieldAlert } from "lucide-react";

type Lang = "hi" | "en";

export default function FarmerPage() {
  const [lang, setLang] = useState<Lang>("hi");
  const [latestResult, setLatestResult] = useState<Stage2Result | null>(null);
  const [photoSent, setPhotoSent] = useState<Record<string, boolean>>({});
  const { demoMode } = useDemo();

  const strings = lang === "hi" ? hiStrings : enStrings;

  useEffect(() => {
    void localEdgeStore.listResults().then((results) => {
      if (results.length > 0) {
        setLatestResult(results[0]);
      }
    });
  }, []);

  // Fallback demo zones if no run has occurred yet
  const displayZones: Stage2Zone[] = useMemo(() => {
    if (latestResult && latestResult.zones.length > 0) {
      return latestResult.zones;
    }
    return [
      { zoneId: "A1", polygon: [], status: "NORMAL", metricLabel: "Moisture", metricValue: 58, unit: "%", confidence: 0.88, severity: 0.1 },
      { zoneId: "B2", polygon: [], status: "DANGER", metricLabel: "Moisture", metricValue: 18, unit: "%", confidence: 0.86, severity: 0.85 },
      { zoneId: "C4", polygon: [], status: "WARN", metricLabel: "Disease Risk", metricValue: 68, unit: "%", confidence: 0.62, severity: 0.55 },
      { zoneId: "D3", polygon: [], status: "NORMAL", metricLabel: "Moisture", metricValue: 52, unit: "%", confidence: 0.85, severity: 0.1 },
    ];
  }, [latestResult]);

  // Formulate advisory per zone
  const getZoneAdvice = (zone: Stage2Zone) => {
    const isConfident = zone.confidence >= 0.75;

    if (!isConfident) {
      return {
        text: strings.not_sure,
        isConfident: false,
        confidenceLabel: lang === "hi" ? "शायद" : "Low confidence",
        actionType: "inspect",
      };
    }

    if (zone.status === "DANGER" || zone.status === "WARN") {
      if (zone.metricLabel.toLowerCase().includes("disease")) {
        return {
          text: strings.inspect_leaf.replace("{zone}", zone.zoneId),
          isConfident: true,
          confidenceLabel: lang === "hi" ? "पक्का" : "High confidence",
          actionType: "photo",
        };
      }
      if (zone.metricLabel.toLowerCase().includes("weed")) {
        const base = strings.weed_patch.replace("{zone}", zone.zoneId);
        const sprayApproval = strings.spray_needs_approval;
        return {
          text: `${base} ${sprayApproval}`,
          isConfident: true,
          confidenceLabel: lang === "hi" ? "पक्का" : "High confidence",
          actionType: "spray",
        };
      }
      // Moisture / water need default
      const minutes = Math.max(15, Math.round((40 - Number(zone.metricValue || 20)) * 1.5));
      return {
        text: strings.needs_irrigation.replace("{zone}", zone.zoneId).replace("{minutes}", String(minutes)),
        isConfident: true,
        confidenceLabel: lang === "hi" ? "पक्का" : "High confidence",
        actionType: "irrigate",
      };
    }

    return {
      text: strings.all_ok,
      isConfident: true,
      confidenceLabel: lang === "hi" ? "पक्का" : "Optimal",
      actionType: "none",
    };
  };

  // Compile unified SMS message (max 160 chars)
  const smsMessage = useMemo(() => {
    const dry = displayZones.filter((z) => z.status === "DANGER" || z.status === "WARN");
    if (dry.length === 0) {
      return lang === "hi"
        ? "खेत अपडेट: सभी क्षेत्र सामान्य हैं। आज कोई काम नहीं है।"
        : "Field update: All zones are normal. No actions needed today.";
    }
    const target = dry[0];
    const adv = getZoneAdvice(target);
    const full = `${target.zoneId}: ${adv.text}`.slice(0, 160);
    return full;
  }, [displayZones, lang, strings]);

  return (
    <SystemShell>
      <div className="farmer-container">
        <div className="farmer-header">
          <div>
            <div className="breadcrumb">
              <span>FIELD</span>
              <span className="breadcrumb-slash">/</span>
              <span>FARMER SCREEN</span>
            </div>
            <div className="title-row" style={{ marginTop: 4 }}>
              <h1 className="farmer-title">{lang === "hi" ? "किसान परामर्श" : "Farmer Advisory"}</h1>
              {demoMode && <HonestyPill status="SIMULATED" size="sm" />}
            </div>
            <p className="page-subtitle" style={{ fontSize: 13 }}>
              {lang === "hi"
                ? "सरल भाषा में सीधी सलाह · ऑपरेटर मंज़ूरी के साथ"
                : "Simple, direct guidance for field action with safety limits"}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              type="button"
              className="lang-toggle-btn"
              onClick={() => setLang(lang === "hi" ? "en" : "hi")}
            >
              {lang === "hi" ? "English में देखें" : "हिंदी में देखें"}
            </button>
          </div>
        </div>

        {/* Zone Cards (Large Type min 28px) */}
        <div>
          {displayZones.map((zone) => {
            const advice = getZoneAdvice(zone);
            const needsPhoto = !advice.isConfident || advice.actionType === "photo" || advice.actionType === "inspect";

            return (
              <div
                className="farmer-card"
                key={zone.zoneId}
                style={{
                  borderColor:
                    zone.status === "DANGER"
                      ? "var(--status-danger)"
                      : zone.status === "WARN"
                      ? "var(--status-warn)"
                      : "#cce4d6",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="farmer-card-zone">
                    {lang === "hi" ? `क्षेत्र ${zone.zoneId}` : `ZONE ${zone.zoneId}`}
                  </span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: 4,
                        background: advice.isConfident ? "#eaf4ee" : "#fff8ea",
                        color: advice.isConfident ? "#1b4332" : "#9a5b00",
                        border: `1px solid ${advice.isConfident ? "#b7d6c3" : "#f1d89e"}`,
                      }}
                    >
                      {advice.confidenceLabel}
                    </span>
                    <HonestyPill status="SIMULATED" size="sm" />
                  </div>
                </div>

                {/* Big Type Advice sentence (min 28px) */}
                <p className="farmer-card-msg">{advice.text}</p>

                <div className="farmer-card-foot">
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                    {zone.metricLabel}: {zone.metricValue} {zone.unit}
                  </span>

                  {needsPhoto && (
                    <button
                      type="button"
                      className="button button-secondary button-small"
                      onClick={() => setPhotoSent((prev) => ({ ...prev, [zone.zoneId]: true }))}
                    >
                      {photoSent[zone.zoneId] ? <CheckCircle2 size={14} color="var(--status-normal)" /> : <Camera size={14} />}
                      <span>{photoSent[zone.zoneId] ? (lang === "hi" ? "फोटो भेजी गई" : "Photo Sent") : (lang === "hi" ? "पत्ते की फोटो भेजें" : "Upload Leaf Photo")}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* SMS Preview Box (Max 160 characters) */}
        <div className="farmer-sms-box">
          <div className="farmer-sms-header">
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <MessageSquare size={16} />
              <span>{lang === "hi" ? "एसएमएस पूर्वावलोकन (अधिकतम 160 अक्षर)" : "SMS PREVIEW (MAX 160 CHARS)"}</span>
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>
              {smsMessage.length} / 160 CHARS
            </span>
          </div>

          <div className="farmer-sms-text">{smsMessage}</div>

          <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-secondary)", display: "flex", gap: 6, alignItems: "center" }}>
            <ShieldAlert size={14} />
            <span>
              {lang === "hi"
                ? "सुरक्षा नियम: कीटनाशक छिड़काव की सीधी सलाह कभी नहीं भेजी जाती। पहले ऑपरेटर मंज़ूरी आवश्यक है।"
                : "Safety constraint: Direct chemical spray instructions are never transmitted without human operator approval."}
            </span>
          </div>
        </div>
      </div>
    </SystemShell>
  );
}
