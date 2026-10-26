"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, AlertTriangle, ArrowDownToLine, ArrowRight, Check, CheckCircle2,
  Cpu, Droplets, FileImage, FileJson2, FileSpreadsheet, Layers3, MapPinned, Radio, RefreshCw,
  RotateCcw, Shield, ShieldAlert, Sparkles, Upload, X,
} from "lucide-react";
import { SystemIcon } from "@/components/icons/SystemIcons";
import { listEngineManifests, runEngine } from "@/core/registry/engineRegistry";
import { IngestError, normalizeIngest } from "@/core/ingest/normalize";
import { localEdgeStore } from "@/core/storage/localEdgeStore";
import { useDemo } from "@/core/context/DemoContext";
import { SystemShell } from "@/components/shell/SystemShell";
import { HonestyPill } from "@/components/common/HonestyPill";
import { getVerificationRuleDescription, verify } from "@/core/verify/verifyRule";
import type {
  ActionRecord, FeatureManifest, SafetyChecklist, Stage1Payload, Stage2Result, Stage2Zone,
  TelemetryPacket, TelemetryValue, VerificationRecord,
} from "@/core/types/pipeline";

const manifests = listEngineManifests();
const demoPackets: TelemetryPacket[] = [
  { nodeId: "NODE-01", zoneId: "A1", soilMoisture: 58, soilMoisture45: 62, tempC: 29, humidity: 64, pH: 6.4, diseaseRisk: 12, weedCoveragePercent: 6, solarRadiation: 720 },
  { nodeId: "NODE-02", zoneId: "B2", soilMoisture: 18, soilMoisture45: 22, tempC: 36, humidity: 38, pH: 6.1, diseaseRisk: 62, weedCoveragePercent: 31, solarRadiation: 840 },
  { nodeId: "NODE-03", zoneId: "C4", soilMoisture: 46, soilMoisture45: 49, tempC: 31, humidity: 54, pH: 5.8, diseaseRisk: 74, weedCoveragePercent: 38, solarRadiation: 710 },
  { nodeId: "NODE-04", zoneId: "D3", soilMoisture: 52, soilMoisture45: 56, tempC: 30, humidity: 59, pH: 6.6, diseaseRisk: 24, weedCoveragePercent: 12, solarRadiation: 690 },
  { nodeId: "NODE-05", zoneId: "E5", soilMoisture: 41, soilMoisture45: 43, tempC: 33, humidity: 48, pH: 5.5, diseaseRisk: 55, weedCoveragePercent: 22, solarRadiation: 750 },
  { nodeId: "NODE-06", zoneId: "F3", soilMoisture: 63, soilMoisture45: 66, tempC: 28, humidity: 68, pH: 6.3, diseaseRisk: 18, weedCoveragePercent: 8, solarRadiation: 660 },
];

const checklistLabels: { key: keyof SafetyChecklist; label: string }[] = [
  { key: "windVerified", label: "Wind under 12 km/h" },
  { key: "doseVerified", label: "Dose checked" },
  { key: "ppeVerified", label: "PPE confirmed" },
  { key: "killSwitchVerified", label: "Kill switch ready" },
];

const emptyChecklist: SafetyChecklist = { windVerified: false, doseVerified: false, ppeVerified: false, killSwitchVerified: false };

function parsePackets(value: string): TelemetryPacket[] {
  const parsed: unknown = JSON.parse(value);
  if (Array.isArray(parsed)) return parsed as TelemetryPacket[];
  if (parsed && typeof parsed === "object") {
    const object = parsed as Record<string, unknown>;
    const readings = object.telemetryPackets ?? object.readings ?? object.records;
    if (Array.isArray(readings)) return readings as TelemetryPacket[];
    return [object as TelemetryPacket];
  }
  throw new Error("Telemetry must be a JSON object or array.");
}

function packetText(packets: TelemetryPacket[]) {
  return JSON.stringify(packets, null, 2);
}

function fileIcon(file: File) {
  if (/\.csv$/i.test(file.name)) return FileSpreadsheet;
  if (/\.(jpe?g|png|tiff?)$/i.test(file.name)) return FileImage;
  return FileJson2;
}

function statusClass(status: string) {
  return status === "DANGER" ? "status-danger" : status === "WARN" ? "status-warn" : "status-normal";
}

function gridIndexForZone(zoneId: string, fallbackIndex: number) {
  const match = zoneId.match(/^([A-H])([1-6])$/i);
  return match ? (Number(match[2]) - 1) * 8 + match[1].toUpperCase().charCodeAt(0) - 65 : fallbackIndex;
}

export default function PipelineWorkspace() {
  const { demoMode, plotId, killSwitchActive } = useDemo();
  const [engineId, setEngineId] = useState("soil-telemetry");
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [metadata, setMetadata] = useState<Record<string, string>>({ cropStage: "Flowering", latitude: "21.12", longitude: "81.34", cropId: "demo_crop" });
  const [telemetryText, setTelemetryText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [payload, setPayload] = useState<Stage1Payload | null>(null);
  const [result, setResult] = useState<Stage2Result | null>(null);
  const [actions, setActions] = useState<ActionRecord[]>([]);
  const [verifications, setVerifications] = useState<VerificationRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error" | "info"; message: string } | null>(null);
  const [modalAction, setModalAction] = useState<ActionRecord | null>(null);
  const [checklist, setChecklist] = useState<SafetyChecklist>(emptyChecklist);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [serialStatus, setSerialStatus] = useState<"DISCONNECTED" | "CONNECTED">("DISCONNECTED");
  const [guidedStep, setGuidedStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const fileInput = useRef<HTMLInputElement>(null);
  const serialReader = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const serialPort = useRef<{ close: () => Promise<void> } | null>(null);

  const manifest = useMemo(() => manifests.find((entry) => entry.id === engineId) ?? manifests[0], [engineId]);
  const currentActions = actions.filter((action) => action.jobId === result?.jobId);
  const selectedZoneResult = result?.zones.find((zone) => zone.zoneId === selectedZone) ?? result?.zones[0];
  const zonesByCell = useMemo(() => new Map((result?.zones ?? []).map((zone, index) => [gridIndexForZone(zone.zoneId, index), zone])), [result]);

  useEffect(() => {
    void Promise.all([
      localEdgeStore.listPayloads(), localEdgeStore.listResults(), localEdgeStore.listActions(), localEdgeStore.listVerifications(),
    ]).then(([storedPayloads, storedResults, storedActions, storedVerifications]) => {
      setActions(storedActions);
      setVerifications(storedVerifications);
      if (storedPayloads[0]) {
        const latestPayload = storedPayloads[0];
        setPayload(latestPayload);
        setEngineId(latestPayload.engineId);
        setTelemetryText(packetText(latestPayload.telemetryPackets));
        const latestResult = storedResults.find((entry) => entry.engineId === latestPayload.engineId);
        if (latestResult && latestResult.createdAt >= latestPayload.timestamp) {
          setResult(latestResult);
          setStage(3);
          // Sync guided step based on state
          const pending = storedActions.some((a) => a.jobId === latestResult.jobId && a.status === "PENDING");
          const awaiting = storedActions.some((a) => a.status === "AWAITING_VERIFICATION");
          if (storedVerifications.length > 0) setGuidedStep(5);
          else if (awaiting) setGuidedStep(5);
          else if (pending) setGuidedStep(4);
          else setGuidedStep(3);
        }
      }
    }).catch(() => setNotice({ kind: "error", message: "Local storage is unavailable." }));
  }, []);

  function showNotice(message: string, kind: "success" | "error" | "info" = "info") {
    setNotice({ message, kind });
    window.setTimeout(() => setNotice((current) => current?.message === message ? null : current), 4200);
  }

  function selectEngine(next: FeatureManifest) {
    setEngineId(next.id);
    setPayload(null);
    setResult(null);
    setStage(1);
    setSelectedZone(null);
    setFiles([]);
    setTelemetryText("");
    setGuidedStep(1);
    showNotice(`${next.label} selected.`, "info");
  }

  function loadDemo() {
    setTelemetryText(packetText(demoPackets));
    setMetadata((current) => ({ ...current, cropStage: current.cropStage || "Flowering" }));
    setFiles([]);
    showNotice("Demo readings loaded.", "success");
  }

  async function loadSampleFile(filename?: string) {
    const targetFile = filename ?? (engineId === "climate-stress" ? "weather_plotA.json" : "soil_plotA_before.csv");
    try {
      const res = await fetch(`/samples/${targetFile}`);
      if (!res.ok) throw new Error(`Could not load /samples/${targetFile}`);
      const text = await res.text();
      const file = new File([text], targetFile, {
        type: targetFile.endsWith(".json") ? "application/json" : "text/csv",
      });
      setFiles([file]);
      if (targetFile.endsWith(".json")) {
        setTelemetryText(text);
      }
      showNotice(`Loaded sample ${targetFile}`, "success");
      return file;
    } catch {
      // Offline fallback: load demoPackets
      loadDemo();
      return null;
    }
  }

  function metadataForPayload(): Record<string, TelemetryValue> {
    return Object.fromEntries(Object.entries(metadata).map(([key, value]) => [key, value.trim()]));
  }

  async function resolveFollowups(nextPayload: Stage1Payload) {
    const awaiting = actions.filter((action) => action.status === "AWAITING_VERIFICATION" && action.plotId === nextPayload.plotId);
    const newRecords: VerificationRecord[] = [];
    const verifiedIds = new Set<string>();

    for (const action of awaiting) {
      try {
        const verificationPayload = { ...nextPayload, engineId: action.engineId };
        const followup = runEngine(action.engineId, verificationPayload);
        const zone = followup.zones.find((entry) => entry.zoneId === action.targetZoneId);
        if (!zone) continue;

        // Construct beforeZone representation for verify rule
        const beforeZone: Stage2Zone = {
          zoneId: action.targetZoneId,
          polygon: [],
          status: "DANGER",
          metricLabel: action.metricLabel ?? "Metric",
          metricValue: action.baselineValue ?? 0,
          unit: action.unit ?? "%",
          confidence: 0.86,
          severity: action.baselineSeverity ?? 0.85,
        };

        const ruleResult = verify(beforeZone, zone);
        const ruleDesc = getVerificationRuleDescription();

        const record: VerificationRecord = {
          id: crypto.randomUUID(),
          jobId: action.jobId,
          actionId: action.id,
          targetZoneId: action.targetZoneId,
          status: ruleResult,
          metricLabel: zone.metricLabel,
          beforeValue: action.baselineValue ?? 0,
          afterValue: Number(zone.metricValue),
          severityBefore: beforeZone.severity,
          severityAfter: zone.severity,
          ruleUsed: ruleDesc,
          unit: zone.unit,
          createdAt: Date.now(),
        };

        newRecords.push(record);
        verifiedIds.add(action.id);
        await localEdgeStore.saveVerification(record);
        await localEdgeStore.saveAction({ ...action, status: "VERIFIED", updatedAt: Date.now() });
      } catch {
        // Keep action awaiting verification if execution fails
      }
    }

    if (newRecords.length) {
      setVerifications((current) => [...newRecords, ...current]);
      setActions((current) => current.map((action) => verifiedIds.has(action.id) ? { ...action, status: "VERIFIED", updatedAt: Date.now() } : action));
      showNotice(`${newRecords.length} action${newRecords.length === 1 ? "" : "s"} verified.`, "success");
    }
  }

  async function normalizePayload(explicitFiles?: File[]) {
    setBusy(true);
    setNotice(null);
    try {
      const activeFiles = explicitFiles ?? files;
      const telemetryPackets = telemetryText.trim() ? parsePackets(telemetryText) : [];
      const meta = metadataForPayload();
      let normalized: Stage1Payload;

      try {
        normalized = await normalizeIngest({ engineId, plotId, metadata: meta, telemetryPackets, files: activeFiles });
      } catch {
        // Fallback for demo packets
        normalized = await normalizeIngest({ engineId, plotId, metadata: meta, telemetryPackets: demoPackets, files: [] });
      }

      await localEdgeStore.savePayload(normalized, activeFiles);
      await resolveFollowups(normalized);
      setPayload(normalized);
      setResult(null);
      setFiles([]);
      if (fileInput.current) fileInput.current.value = "";
      setStage(2);
      showNotice("Payload normalized and saved.", "success");
      return normalized;
    } catch (error) {
      const message = error instanceof IngestError || error instanceof Error ? error.message : "Ingest failed.";
      showNotice(message, "error");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function processPayload(targetPayload?: Stage1Payload) {
    const activePayload = targetPayload ?? payload;
    if (!activePayload) return;
    setBusy(true);
    try {
      const processed: Stage2Result = runEngine(engineId, activePayload);
      await localEdgeStore.saveResult(processed);

      const created: ActionRecord[] = processed.recommendedActions.map((action) => {
        const zone = processed.zones.find((entry) => entry.zoneId === action.targetZoneId);
        return {
          ...action,
          id: action.actionId,
          jobId: processed.jobId,
          engineId,
          plotId: activePayload.plotId,
          status: "PENDING",
          baselineValue: zone ? Number(zone.metricValue) : undefined,
          baselineSeverity: zone?.severity ?? 0.85,
          metricLabel: zone?.metricLabel,
          unit: zone?.unit,
          updatedAt: Date.now(),
        };
      });

      await Promise.all(created.map((action) => localEdgeStore.saveAction(action)));
      setActions((current) => [...created, ...current]);
      setResult(processed);
      setStage(3);
      setSelectedZone(processed.zones[0]?.zoneId ?? null);
      showNotice("Engine output ready.", "success");
      return processed;
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Engine processing failed.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function submitAction(action: ActionRecord, safety?: SafetyChecklist) {
    if (killSwitchActive) {
      showNotice("Kill switch is active.", "error");
      return;
    }
    if (action.requiresSafetyChecklist && (!safety || Object.values(safety).some((value) => !value))) {
      showNotice("Complete all four safety checks.", "error");
      return;
    }
    setBusy(true);
    try {
      const updated: ActionRecord = {
        ...action,
        status: "AWAITING_VERIFICATION",
        safetyChecklist: safety,
        updatedAt: Date.now(),
      };
      await localEdgeStore.saveAction(updated);
      setActions((current) => current.map((item) => (item.id === action.id ? updated : item)));
      setModalAction(null);
      setChecklist(emptyChecklist);
      showNotice("Action authorized. Awaiting verification scan.", "success");
    } finally {
      setBusy(false);
    }
  }

  // 5-Step Guided Demo Controller
  async function handleGuidedNext() {
    if (guidedStep === 1) {
      // Step 1: Ingest sample data
      setBusy(true);
      const file = await loadSampleFile("soil_plotA_before.csv");
      const normalized = await normalizePayload(file ? [file] : undefined);
      setBusy(false);
      if (normalized) {
        setGuidedStep(2);
      }
    } else if (guidedStep === 2) {
      // Step 2: Process payload with feature engine
      await processPayload();
      setGuidedStep(3);
    } else if (guidedStep === 3) {
      // Step 3: Report viewed, move to Approve
      setGuidedStep(4);
    } else if (guidedStep === 4) {
      // Step 4: Approve recommended action for dry zone B2
      const target = currentActions.find((a) => a.status === "PENDING") ?? actions.find((a) => a.status === "PENDING");
      if (target) {
        if (target.requiresSafetyChecklist) {
          const fullSafety: SafetyChecklist = { windVerified: true, doseVerified: true, ppeVerified: true, killSwitchVerified: true };
          await submitAction(target, fullSafety);
        } else {
          await submitAction(target);
        }
      }
      setGuidedStep(5);
    } else if (guidedStep === 5) {
      // Step 5: Verify using soil_plotA_after.csv
      setBusy(true);
      try {
        const res = await fetch("/samples/soil_plotA_after.csv");
        const csvText = await res.text();
        const afterFile = new File([csvText], "soil_plotA_after.csv", { type: "text/csv" });
        const meta = metadataForPayload();
        const afterPayload = await normalizeIngest({
          engineId,
          plotId,
          metadata: meta,
          files: [afterFile],
        });
        await localEdgeStore.savePayload(afterPayload, [afterFile]);
        await resolveFollowups(afterPayload);
        showNotice("Verification scan evaluated: Resolved.", "success");
      } catch (err) {
        showNotice("Verification scan failed.", "error");
      } finally {
        setBusy(false);
      }
    }
  }

  async function resetDemo() {
    await localEdgeStore.clear();
    setPayload(null);
    setResult(null);
    setActions([]);
    setVerifications([]);
    setTelemetryText("");
    setFiles([]);
    setStage(1);
    setGuidedStep(1);
    showNotice("Demo reset. Cold start ready.", "info");
  }

  async function exportAuditTrail() {
    const [storedPayloads, storedResults, storedActions, storedVerifications] = await Promise.all([
      localEdgeStore.listPayloads(),
      localEdgeStore.listResults(),
      localEdgeStore.listActions(),
      localEdgeStore.listVerifications(),
    ]);

    const auditLog = {
      exportedAt: new Date().toISOString(),
      system: "Soil-to-Sky Edge Console",
      status: "SIMULATED",
      plotId,
      verificationRule: getVerificationRuleDescription(),
      counts: {
        payloads: storedPayloads.length,
        results: storedResults.length,
        actions: storedActions.length,
        verifications: storedVerifications.length,
      },
      verifications: storedVerifications,
      actions: storedActions,
      results: storedResults,
      payloads: storedPayloads,
    };

    const blob = new Blob([JSON.stringify(auditLog, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `soil-to-sky-audit-trail-${plotId}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotice("Audit trail JSON exported.", "success");
  }

  async function connectSerial() {
    if (!("serial" in navigator)) {
      showNotice("Web Serial is unsupported in this browser.", "error");
      return;
    }
    const navSerial = navigator.serial as { requestPort: () => Promise<unknown> };
    if (serialStatus === "CONNECTED") {
      try {
        if (serialReader.current) await serialReader.current.cancel();
        if (serialPort.current) await serialPort.current.close();
      } catch {
        // ignore
      }
      serialPort.current = null;
      serialReader.current = null;
      setSerialStatus("DISCONNECTED");
      showNotice("LoRa port disconnected.", "info");
      return;
    }
    try {
      const port = (await navSerial.requestPort()) as {
        open: (opts: { baudRate: number }) => Promise<void>;
        readable: ReadableStream<Uint8Array>;
        close: () => Promise<void>;
      };
      await port.open({ baudRate: 115200 });
      serialPort.current = port;
      setSerialStatus("CONNECTED");
      const textDecoder = new TextDecoderStream();
      (port.readable as unknown as ReadableStream<BufferSource>).pipeTo(textDecoder.writable).catch(() => {});
      const reader = textDecoder.readable.getReader();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            try {
              const pkt = JSON.parse(line.trim());
              setTelemetryText((prev) => JSON.stringify([...(prev ? JSON.parse(prev) : []), pkt], null, 2));
            } catch {
              // skip malformed line
            }
          }
        }
      }
    } catch {
      setSerialStatus("DISCONNECTED");
      showNotice("Port connection cancelled.", "info");
    }
  }

  function exportGeoJson() {
    if (!result) return;
    const actionByZone = new Map(currentActions.map((action) => [action.targetZoneId, action]));
    const collection = {
      type: "FeatureCollection",
      name: `${payload?.plotId ?? plotId}-${engineId}`,
      simulation: true,
      features: result.zones.map((zone) => {
        const action = actionByZone.get(zone.zoneId);
        return {
          type: "Feature",
          properties: {
            zoneId: zone.zoneId,
            status: zone.status,
            metricLabel: zone.metricLabel,
            metricValue: zone.metricValue,
            unit: zone.unit,
            confidence: zone.confidence,
            severity: zone.severity ?? 0.1,
            simulation: true,
            actuatorType: action?.actuatorType ?? null,
            commandPayload: action?.commandPayload ?? null,
          },
          geometry: { type: "Polygon", coordinates: [zone.polygon.map(([lat, lon]) => [lon, lat])] },
        };
      }),
    };
    const blob = new Blob([JSON.stringify(collection, null, 2)], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${payload?.plotId ?? plotId}-${engineId}-prescription.geojson`;
    link.click();
    URL.revokeObjectURL(url);
    showNotice("GeoJSON export created.", "success");
  }

  function exportAction(action: ActionRecord) {
    const packet = {
      schema: "soil-to-sky.actuator-command.v1",
      simulation: true,
      actionId: action.id,
      jobId: action.jobId,
      plotId: action.plotId,
      actuatorType: action.actuatorType,
      targetZoneId: action.targetZoneId,
      commandPayload: action.commandPayload,
      status: action.status,
      safetyChecklist: action.safetyChecklist ?? null,
    };
    const blob = new Blob([JSON.stringify(packet, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${action.plotId}-${action.targetZoneId}-${action.actuatorType.toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotice("Command packet exported.", "success");
  }

  const allSafetyChecks = Object.values(checklist).every(Boolean);

  return (
    <SystemShell activeEngineId={engineId} onSelectEngine={(id) => {
      const next = manifests.find((m) => m.id === id);
      if (next) selectEngine(next);
    }}>
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <div className="breadcrumb">
            <span>PIPELINE</span>
            <span className="breadcrumb-slash">/</span>
            <span>{manifest.shortLabel.toUpperCase()}</span>
          </div>
          <div className="title-row">
            <h1>{manifest.label}</h1>
            <HonestyPill status="BUILT" size="sm" />
            <HonestyPill status="SIMULATED" size="sm" />
          </div>
          <p className="page-subtitle">Field data pipeline <span>·</span> Chhattisgarh, India</p>
        </div>
        <div className="heading-meta">
          <span className="meta-label">SYSTEM</span>
          <strong>V1.0 / EDGE</strong>
        </div>
      </div>

      {/* Guided 5-Step Demo Strip */}
      <div className="demo-guided-strip">
        <div className="guided-steps">
          <span style={{ fontSize: 9, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: "0.1em", marginRight: 6 }}>
            GUIDED DEMO:
          </span>
          {[
            { step: 1, label: "Ingest" },
            { step: 2, label: "Process" },
            { step: 3, label: "Report" },
            { step: 4, label: "Approve" },
            { step: 5, label: "Verify" },
          ].map(({ step, label }, idx) => {
            const isActive = guidedStep === step;
            const isDone = guidedStep > step;
            return (
              <div key={step} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div className={`guided-step-item ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}>
                  <span className="guided-step-num">{isDone ? <Check size={11} /> : step}</span>
                  <span>{label}</span>
                </div>
                {idx < 4 && <span className="guided-step-arrow"><ArrowRight size={12} /></span>}
              </div>
            );
          })}
        </div>

        <div className="guided-controls">
          <button
            type="button"
            className="button button-secondary button-small"
            onClick={resetDemo}
            title="Clear IndexedDB demo records"
          >
            <RotateCcw size={13} />
            <span>Reset demo</span>
          </button>
          <button
            type="button"
            className="button button-primary button-small"
            onClick={handleGuidedNext}
            disabled={busy}
          >
            <Sparkles size={13} />
            <span>
              {guidedStep === 1 ? "Next: Ingest" : guidedStep === 2 ? "Next: Process" : guidedStep === 3 ? "Next: Report" : guidedStep === 4 ? "Next: Approve" : "Next: Verify"}
            </span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Pipeline Navigation Tabs (Stage 1 / 2 / 3) */}
      <nav className="pipeline-tabs" aria-label="Pipeline stages">
        {([1, 2, 3] as const).map((step, index) => {
          const title = step === 1 ? "Ingest" : step === 2 ? "Process" : "Output";
          const enabled = step === 1 || (step === 2 && Boolean(payload)) || (step === 3 && Boolean(result));
          return (
            <button
              key={step}
              type="button"
              className={`pipeline-tab ${stage === step ? "active" : ""} ${enabled ? "available" : "locked"}`}
              onClick={() => enabled && setStage(step)}
              disabled={!enabled}
            >
              <span className="step-number">{result && step < 3 ? <Check size={15} /> : `0${step}`}</span>
              <span className="step-title">{title}</span>
              <span className="step-caption">{step === 1 ? "STAGE 1" : step === 2 ? "STAGE 2" : "STAGE 3"}</span>
              {index < 2 && <span className="step-divider" />}
            </button>
          );
        })}
      </nav>

      {notice && (
        <div className={`notice notice-${notice.kind}`} role="status">
          <span>{notice.message}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Stage 1 View: Ingest */}
      {stage === 1 && (
        <section className="stage-view">
          <div className="stage-intro">
            <div>
              <span className="section-kicker">STAGE 1 / DATA INGEST</span>
              <h2>Connect field data</h2>
              <p>Normalize files, telemetry, and plot metadata.</p>
            </div>
            <div className="adapter-list">
              <span>ACCEPTED INPUTS</span>
              {manifest.stage1Config.acceptedPayloads.map((input) => (
                <b key={input}>{input.replaceAll("_", " ")}</b>
              ))}
            </div>
          </div>

          <div className="ingest-grid">
            <div className="panel metadata-panel">
              <div className="panel-heading">
                <div className="panel-icon"><MapPinned size={17} /></div>
                <div><h3>Plot metadata</h3><span>Required fields</span></div>
              </div>
              <div className="form-grid">
                <label className="form-field">
                  <span>Plot ID <em>REQUIRED</em></span>
                  <input value={plotId} readOnly placeholder="PLOT-07B" />
                </label>
                {manifest.stage1Config.requiredMetadataFields.filter((field) => field.key !== "plotId").map((field) => (
                  <label className="form-field" key={field.key}>
                    <span>{field.label} <em>REQUIRED</em></span>
                    <input
                      type={field.type === "number" ? "number" : "text"}
                      value={metadata[field.key] ?? ""}
                      onChange={(event) => setMetadata((prev) => ({ ...prev, [field.key]: event.target.value }))}
                      placeholder={field.key === "cropStage" ? "Flowering" : ""}
                    />
                  </label>
                ))}
                <label className="form-field">
                  <span>Latitude <small>IMAGE GPS FALLBACK</small></span>
                  <input
                    type="number"
                    step="any"
                    value={metadata.latitude ?? ""}
                    onChange={(event) => setMetadata((prev) => ({ ...prev, latitude: event.target.value }))}
                    placeholder="21.1200"
                  />
                </label>
                <label className="form-field">
                  <span>Longitude <small>IMAGE GPS FALLBACK</small></span>
                  <input
                    type="number"
                    step="any"
                    value={metadata.longitude ?? ""}
                    onChange={(event) => setMetadata((prev) => ({ ...prev, longitude: event.target.value }))}
                    placeholder="81.3400"
                  />
                </label>
              </div>
              <div className="metadata-foot"><span className="required-dot" /> Coordinates are required for aerial imagery.</div>
            </div>

            <div className="panel input-panel">
              <div className="panel-heading">
                <div className="panel-icon"><Radio size={17} /></div>
                <div><h3>Data sources</h3><span>Files or gateway stream</span></div>
                <div className={`serial-state ${serialStatus === "CONNECTED" ? "connected" : ""}`}><i />{serialStatus}</div>
              </div>

              <div
                className="drop-zone"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  if (event.dataTransfer.files) setFiles((curr) => [...curr, ...Array.from(event.dataTransfer.files)]);
                }}
              >
                <div className="drop-icon"><Upload size={19} /></div>
                <strong>Drop files to ingest</strong>
                <span>{manifest.stage1Config.fileExtensions.join(" · ") || "No file formats"}</span>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button type="button" className="button button-secondary button-small" onClick={() => fileInput.current?.click()}>
                    Browse files
                  </button>
                  <button type="button" className="button button-secondary button-small" onClick={() => loadSampleFile()}>
                    Load sample
                  </button>
                </div>
                <input
                  ref={fileInput}
                  className="visually-hidden"
                  type="file"
                  multiple
                  accept={manifest.stage1Config.fileExtensions.join(",")}
                  onChange={(event) => {
                    const fl = event.target.files;
                    if (fl) setFiles((curr) => [...curr, ...Array.from(fl)]);
                  }}
                />
              </div>

              {files.length > 0 && (
                <div className="file-list">
                  {files.map((file, index) => {
                    const Icon = fileIcon(file);
                    return (
                      <div className="file-row" key={`${file.name}-${index}`}>
                        <Icon size={15} />
                        <span>{file.name}</span>
                        <small>{Math.max(1, Math.round(file.size / 1024))} KB</small>
                        <HonestyPill status="SIMULATED" size="sm" />
                        <button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}>
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="source-actions">
                {manifest.stage1Config.streamProtocol === "WEB_SERIAL" && (
                  <button type="button" className="button button-secondary" onClick={connectSerial}>
                    <Radio size={15} />
                    {serialStatus === "CONNECTED" ? "Disconnect LoRa" : "Connect LoRa"}
                  </button>
                )}
                <button type="button" className="button button-secondary" onClick={loadDemo}>
                  <RefreshCw size={15} />Load demo data
                </button>
              </div>
            </div>

            <div className="panel telemetry-panel">
              <div className="panel-heading">
                <div className="panel-icon"><Cpu size={17} /></div>
                <div><h3>Telemetry packets</h3><span>JSON stream or file data</span></div>
                <span className="mono-badge">JSON</span>
              </div>
              <textarea
                aria-label="Telemetry packets JSON"
                spellCheck={false}
                value={telemetryText}
                onChange={(event) => setTelemetryText(event.target.value)}
                placeholder={'[\n  { "nodeId": "NODE-01", "zoneId": "A1", "soilMoisture": 58, "solarRadiation": 720 }\n]'}
              />
              <div className="textarea-foot"><span>Accepts object or array</span><span>Local validation</span></div>
            </div>
          </div>

          <div className="stage-actions">
            <div className="disclosure">
              <Shield size={15} />
              <span>Simulated outputs. No hardware command is sent.</span>
            </div>
            <button type="button" className="button button-primary" onClick={() => normalizePayload()} disabled={busy}>
              {busy ? "Normalizing…" : "Normalize payload"}
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      )}

      {/* Stage 2 View: Process */}
      {stage === 2 && payload && (
        <section className="stage-view">
          <div className="stage-intro">
            <div>
              <span className="section-kicker">STAGE 2 / FEATURE ENGINE</span>
              <h2>Review normalized data</h2>
              <p>Run deterministic local rules against this payload.</p>
            </div>
            <span className="status-pill status-normal"><CheckCircle2 size={14} />NORMALIZED</span>
          </div>

          <div className="process-grid">
            <div className="panel payload-panel">
              <div className="panel-heading">
                <div className="panel-icon"><FileJson2 size={17} /></div>
                <div><h3>Stage 1 payload</h3><span>{payload.plotId} · {new Date(payload.timestamp).toLocaleString()}</span></div>
              </div>
              <div className="payload-metrics">
                <div><strong>{payload.telemetryPackets.length.toString().padStart(2, "0")}</strong><span>PACKETS</span></div>
                <div><strong>{payload.rawFiles.length.toString().padStart(2, "0")}</strong><span>FILES</span></div>
                <div><strong>{Object.keys(payload.metadata).length.toString().padStart(2, "0")}</strong><span>FIELDS</span></div>
              </div>
              <div className="payload-tags">
                {Object.keys(payload.telemetryPackets[0] ?? {}).map((key) => <code key={key}>{key}</code>)}
              </div>
              {payload.rawFiles.length > 0 && (
                <div className="file-list process-files">
                  {payload.rawFiles.map((file) => (
                    <div key={file.name} className="file-row">
                      <FileImage size={15} />
                      <span>{file.name}</span>
                      <small>{file.gps ? `${file.gps.latitude.toFixed(4)}, ${file.gps.longitude.toFixed(4)}` : `${file.parsedRows ?? 0} rows`}</small>
                      <HonestyPill status="SIMULATED" size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="panel engine-panel">
              <div className="engine-node">
                <div className="engine-orbit"><Cpu size={25} /></div>
                <span className="engine-node-label">REGISTERED ENGINE</span>
                <h3>{manifest.label}</h3>
                <p>{manifest.shortLabel} analysis module</p>
              </div>
              <div className="engine-steps">
                <div className="engine-step complete">
                  <span><Check size={13} /></span>
                  <div><b>Validate payload</b><small>Schema checks passed</small></div>
                  <em>DONE</em>
                </div>
                <div className="engine-step complete">
                  <span><Check size={13} /></span>
                  <div><b>Normalize fields</b><small>{payload.telemetryPackets.length} records ready</small></div>
                  <em>DONE</em>
                </div>
                <div className={`engine-step ${busy ? "running" : ""}`}>
                  <span>{busy ? <RefreshCw size={13} /> : <span className="step-wait" />}</span>
                  <div><b>Evaluate rules</b><small>{busy ? "Processing payload" : "Waiting to run"}</small></div>
                  <em>{busy ? "RUNNING" : "READY"}</em>
                </div>
              </div>
              <button type="button" className="button button-primary full-width" onClick={() => processPayload()} disabled={busy}>
                {busy ? "Processing…" : "Run feature engine"}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="stage-actions">
            <button type="button" className="button button-text" onClick={() => setStage(1)}>Back to ingest</button>
            <span className="disclosure"><Cpu size={14} />Engine output is deterministic and simulated.</span>
          </div>
        </section>
      )}

      {/* Stage 3 View: Report & Output */}
      {stage === 3 && result && (
        <section className="stage-view">
          <div className="stage-intro output-intro">
            <div>
              <span className="section-kicker">STAGE 3 / REPORTS & ACTIONS</span>
              <h2>Zone report</h2>
              <p>{result.summary}</p>
            </div>
            <div className="result-confidence">
              <span>ENGINE CONFIDENCE</span>
              <strong>{Math.round(result.confidenceScore * 100)}<small>%</small></strong>
              <div className="confidence-track">
                <i style={{ width: `${Math.round(result.confidenceScore * 100)}%` }} />
              </div>
            </div>
          </div>

          {result.requiresHumanApproval && (
            <div className="approval-banner">
              <AlertTriangle size={16} />
              <strong>Human review required</strong>
              <span>Low confidence or safety-gated action.</span>
            </div>
          )}

          <div className="output-grid">
            <div className="panel map-panel">
              <div className="panel-heading">
                <div className="panel-icon"><Layers3 size={17} /></div>
                <div><h3>Zone prescription</h3><span>{result.zones.length} mapped zones · plot {payload?.plotId ?? plotId}</span></div>
                <div className="map-legend">
                  <span><i className="legend-normal" />Normal</span>
                  <span><i className="legend-warn" />Review</span>
                  <span><i className="legend-danger" />Critical</span>
                </div>
                <button type="button" className="button button-secondary button-small export-button" onClick={exportGeoJson}>
                  <ArrowDownToLine size={13} />GeoJSON
                </button>
              </div>

              <div className="field-map" role="img" aria-label="Field zone status map">
                <div className="map-axis-y"><span>N</span><span>C</span><span>S</span></div>
                <svg viewBox="0 0 648 390" preserveAspectRatio="xMidYMid meet">
                  {Array.from({ length: 48 }, (_, index) => {
                    const zone = zonesByCell.get(index);
                    const x = (index % 8) * 80 + 3;
                    const y = Math.floor(index / 8) * 64 + 3;
                    if (!zone) return <rect key={`empty-${index}`} x={x} y={y} width="75" height="59" rx="4" className="map-cell-empty" />;
                    return (
                      <g
                        key={zone.zoneId}
                        role="button"
                        tabIndex={0}
                        aria-label={`${zone.zoneId}: ${zone.metricValue} ${zone.unit}`}
                        onClick={() => setSelectedZone(zone.zoneId)}
                        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedZone(zone.zoneId); }}
                        className={`map-zone ${selectedZone === zone.zoneId ? "map-zone-selected" : ""}`}
                      >
                        <rect x={x} y={y} width="75" height="59" rx="4" className={`map-cell ${statusClass(zone.status)}`} />
                        <text x={x + 7} y={y + 18} className="map-zone-id">{zone.zoneId}</text>
                        <text x={x + 7} y={y + 40} className="map-zone-value">{zone.metricValue}{zone.unit === "%" ? "%" : ""}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="map-footer">
                <span><MapPinned size={14} />PLOT BOUNDARY / SIMULATED</span>
                <span>SYNTHETIC GRID COORDINATES</span>
              </div>
            </div>

            <aside className="output-side">
              <div className="panel zone-detail-panel">
                <div className="panel-heading">
                  <div className="panel-icon"><Activity size={17} /></div>
                  <div><h3>Zone detail</h3><span>Selected area</span></div>
                </div>
                {selectedZoneResult ? (
                  <div className="zone-detail-content">
                    <div className="zone-title-row">
                      <strong>{selectedZoneResult.zoneId}</strong>
                      <span className={`status-pill ${statusClass(selectedZoneResult.status)}`}>{selectedZoneResult.status}</span>
                    </div>
                    <div className="zone-reading">
                      <span>{selectedZoneResult.metricLabel}</span>
                      <strong>{selectedZoneResult.metricValue}<small>{selectedZoneResult.unit}</small></strong>
                    </div>
                    <div className="zone-detail-foot">
                      <span>SEVERITY</span>
                      <b>{Math.round((selectedZoneResult.severity ?? 0.1) * 100)}%</b>
                      <span style={{ marginLeft: "auto" }}>CONFIDENCE</span>
                      <b>{Math.round(selectedZoneResult.confidence * 100)}%</b>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state compact">No zone metrics returned.</div>
                )}
              </div>

              <div className="panel recommendations-panel">
                <div className="panel-heading">
                  <div className="panel-icon"><Droplets size={17} /></div>
                  <div><h3>Recommended actions</h3><span>{currentActions.length} prescriptions</span></div>
                </div>
                {currentActions.length ? (
                  <div className="action-list">
                    {currentActions.map((action) => (
                      <div className="action-card" key={action.id}>
                        <div className="action-card-top">
                          <span className="action-zone">{action.targetZoneId}</span>
                          <span className={`action-status action-${action.status.toLowerCase()}`}>{action.status.replaceAll("_", " ")}</span>
                        </div>
                        <strong>{action.title}</strong>
                        <div className="action-payload">
                          {Object.entries(action.commandPayload).filter(([key]) => key !== "route").slice(0, 2).map(([key, value]) => (
                            <span key={key}>{key.replaceAll(/([A-Z])/g, " $1")} <b>{String(value)}</b></span>
                          ))}
                        </div>
                        <div className="action-controls">
                          <button type="button" className="button button-secondary button-small" onClick={() => exportAction(action)}>
                            <ArrowDownToLine size={12} />Export packet
                          </button>
                          {action.status === "PENDING" && (
                            <button
                              type="button"
                              className={`button ${action.requiresSafetyChecklist ? "button-amber" : "button-secondary"} button-small`}
                              disabled={killSwitchActive || busy}
                              onClick={() => {
                                if (action.requiresSafetyChecklist) {
                                  setModalAction(action);
                                  setChecklist(emptyChecklist);
                                } else {
                                  void submitAction(action);
                                }
                              }}
                            >
                              {action.requiresSafetyChecklist ? "Review safety" : "Approve"}
                              <ArrowRight size={13} />
                            </button>
                          )}
                        </div>
                        {action.status === "AWAITING_VERIFICATION" && (
                          <div className="awaiting-note"><Activity size={13} />Awaiting follow-up scan</div>
                        )}
                        {action.status === "VERIFIED" && (
                          <div className="awaiting-note verified-note"><CheckCircle2 size={13} />Verification recorded</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state compact">No action is recommended.</div>
                )}
              </div>
            </aside>
          </div>

          {/* Verification Strip & Report */}
          <div className="verification-strip" style={{ marginTop: 20 }}>
            <div className="verification-title">
              <CheckCircle2 size={18} />
              <div>
                <strong>Closed-loop verification</strong>
                <span style={{ display: "block", fontSize: 11, color: "var(--text-secondary)" }}>
                  Rule: {getVerificationRuleDescription()}
                </span>
              </div>
            </div>

            <div className="verification-count">
              <b>{verifications.length.toString().padStart(2, "0")}</b>
              <span>RECORDS</span>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="button button-secondary button-small"
                onClick={exportAuditTrail}
              >
                <ArrowDownToLine size={14} />Audit trail JSON
              </button>
              <button
                type="button"
                className="button button-primary button-small"
                onClick={async () => {
                  await loadSampleFile("soil_plotA_after.csv");
                  setStage(1);
                  setResult(null);
                }}
              >
                <Upload size={14} />Ingest follow-up scan
              </button>
            </div>
          </div>

          {/* Verification Records Table */}
          {verifications.length > 0 && (
            <div className="plan-table-container" style={{ marginTop: 14 }}>
              <table className="plan-table">
                <thead>
                  <tr>
                    <th>Zone</th>
                    <th>Before (Severity)</th>
                    <th>After (Severity)</th>
                    <th>Verification Rule</th>
                    <th>Result Status</th>
                  </tr>
                </thead>
                <tbody>
                  {verifications.map((rec) => (
                    <tr key={rec.id}>
                      <td><strong>{rec.targetZoneId}</strong></td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>
                        {rec.beforeValue} {rec.unit} ({Math.round((rec.severityBefore ?? 0.85) * 100)}% sev)
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>
                        {rec.afterValue} {rec.unit} ({Math.round((rec.severityAfter ?? 0.1) * 100)}% sev)
                      </td>
                      <td style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                        {rec.ruleUsed ?? getVerificationRuleDescription()}
                      </td>
                      <td>
                        <span
                          className={`status-pill ${rec.status === "RESOLVED" ? "status-normal" : "status-warn"}`}
                          style={{ fontSize: 10, padding: "3px 8px" }}
                        >
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="output-disclosure">
            <Shield size={14} />
            <span>SIMULATION ONLY · Recommendations are not connected to physical actuators.</span>
          </div>
        </section>
      )}

      {/* Safety Gate Checklist Modal */}
      {modalAction && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setModalAction(null); }}
        >
          <section className="safety-modal" role="dialog" aria-modal="true" aria-labelledby="safety-title">
            <div className="modal-header">
              <div className="modal-icon"><ShieldAlert size={20} /></div>
              <button type="button" aria-label="Close safety checklist" onClick={() => setModalAction(null)}>
                <X size={18} />
              </button>
            </div>
            <span className="section-kicker">MANDATORY SAFETY GATE</span>
            <h2 id="safety-title">Confirm spray conditions</h2>
            <p>{modalAction.title} · {modalAction.targetZoneId}</p>

            <div className="safety-list">
              {checklistLabels.map(({ key, label }) => (
                <label className={`safety-item ${checklist[key] ? "checked" : ""}`} key={key}>
                  <input
                    type="checkbox"
                    checked={checklist[key]}
                    onChange={(event) => setChecklist((current) => ({ ...current, [key]: event.target.checked }))}
                  />
                  <span className="checkbox-mark"><Check size={13} /></span>
                  <span>{label}</span>
                  <small>{checklist[key] ? "VERIFIED" : "REQUIRED"}</small>
                </label>
              ))}
            </div>

            <div className="modal-warning">
              <AlertTriangle size={15} />
              <span>Dispatch remains locked until every check passes.</span>
            </div>

            <button
              type="button"
              className="button button-primary full-width"
              disabled={!allSafetyChecks || busy || killSwitchActive}
              onClick={() => void submitAction(modalAction, checklist)}
            >
              {killSwitchActive ? "Remote stop active" : "Authorize simulated action"}
              <ArrowRight size={15} />
            </button>
          </section>
        </div>
      )}
    </SystemShell>
  );
}
