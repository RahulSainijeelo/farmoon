"use client";

import { useState } from "react";
import hardwareData from "@/config/hardware.json";
import { SystemShell } from "@/components/shell/SystemShell";
import { HonestyPill } from "@/components/common/HonestyPill";
import { SystemIcon, type IconName } from "@/components/icons/SystemIcons";
import { ArrowRight, ChevronDown, ChevronUp, Cpu, Radio, Shield, Wrench, Zap, Cable } from "lucide-react";

export default function HardwarePlanPage() {
  const [expandedLayer, setExpandedLayer] = useState<string | null>("ground");
  const [activeTab, setActiveTab] = useState<"layers" | "topology" | "integration" | "packet">("integration");

  return (
    <SystemShell>
      <div className="page-heading">
        <div>
          <div className="breadcrumb">
            <span>PLAN</span>
            <span className="breadcrumb-slash">/</span>
            <span>HARDWARE</span>
          </div>
          <div className="title-row">
            <h1>Hardware plan & system design</h1>
            <HonestyPill status={hardwareData.status} size="sm" />
          </div>
          <p className="page-subtitle">
            Physical schematics, connection workflows, and end-to-end edge engineering
          </p>
        </div>
        <div className="heading-meta">
          <span className="meta-label">ARCHITECTURE</span>
          <strong>4-LAYER PROPOSED</strong>
        </div>
      </div>

      {/* Flat Data Flow SVG Chain */}
      <div className="dataflow-chain-container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: "var(--text-secondary)" }}>
            END-TO-END DATA FLOW PIPELINE
          </span>
          <HonestyPill status="PROPOSED" size="sm" />
        </div>

        <div className="dataflow-chain">
          {hardwareData.dataFlow.map((step, idx) => (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="dataflow-node">
                <span style={{ color: "var(--text-tertiary)", fontSize: 9, marginRight: 6 }}>0{idx + 1}</span>
                {step}
              </div>
              {idx < hardwareData.dataFlow.length - 1 && (
                <div className="dataflow-arrow">
                  <ArrowRight size={14} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setActiveTab("integration")}
          className={`button ${activeTab === "integration" ? "button-primary" : "button-secondary"} button-small`}
        >
          <Cable size={14} />
          <span>How Hardware Connects & Operates</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("topology")}
          className={`button ${activeTab === "topology" ? "button-primary" : "button-secondary"} button-small`}
        >
          <Cpu size={14} />
          <span>Complete System Architecture</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("layers")}
          className={`button ${activeTab === "layers" ? "button-primary" : "button-secondary"} button-small`}
        >
          <Wrench size={14} />
          <span>Layer Cards & Builds</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("packet")}
          className={`button ${activeTab === "packet" ? "button-primary" : "button-secondary"} button-small`}
        >
          <Radio size={14} />
          <span>LoRa Packet & Pinouts</span>
        </button>
      </div>

      {/* NEW TAB: How Hardware Connects & Operates */}
      {activeTab === "integration" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Section 1: Overview Explanation */}
          <div className="system-design-block">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Physical Integration: How Hardware Connects to Software</h3>
              <HonestyPill status="PROPOSED" size="sm" />
            </div>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.5 }}>
              The Soil-to-Sky hardware connects to this web platform through two physical pathways:
              (1) an autonomous **Raspberry Pi Edge Gateway** running this local Next.js server over offline field Wi-Fi, and
              (2) a direct **USB Web Serial link** for laptop field operators. Below is the step-by-step schematic of how data travels from soil probes to the screen, and how action pulses reach the irrigation valves.
            </p>
          </div>

          {/* Section 2: Visual Circuit Schematics (SVG) */}
          <div className="system-design-block">
            <h4 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 800 }}>
              1. Ground Sensor Node Circuit Schematic (ESP32 + LoRa + Sensors)
            </h4>
            <div style={{ background: "#fafbfc", border: "1px solid var(--border-std)", borderRadius: 8, padding: 18, overflowX: "auto" }}>
              <svg viewBox="0 0 820 280" style={{ width: "100%", minWidth: 720, height: "auto" }}>
                {/* Solar & Power Block */}
                <rect x="20" y="30" width="160" height="90" rx="6" fill="#ffffff" stroke="#1b4332" strokeWidth="1.5" />
                <text x="35" y="55" fill="#1b4332" fontSize="11" fontWeight="800" fontFamily="sans-serif">POWER UNIT</text>
                <text x="35" y="75" fill="#4b5563" fontSize="10" fontFamily="sans-serif">6V 2W Solar Panel</text>
                <text x="35" y="93" fill="#4b5563" fontSize="10" fontFamily="sans-serif">TP4056 + 18650 Cell</text>
                <text x="35" y="110" fill="#0d6e5e" fontSize="9" fontFamily="monospace">3.7V - 4.2V VCC Out</text>

                {/* ESP32 Core MCU */}
                <rect x="240" y="30" width="280" height="220" rx="6" fill="#ffffff" stroke="#1b4332" strokeWidth="2" />
                <rect x="240" y="30" width="280" height="28" rx="6" fill="#1b4332" />
                <text x="255" y="49" fill="#ffffff" fontSize="11" fontWeight="800" fontFamily="sans-serif">ESP32-WROOM-32U MCU (DEEP SLEEP)</text>
                
                {/* Pin callouts inside ESP32 */}
                <text x="255" y="80" fill="#111827" fontSize="11" fontWeight="700" fontFamily="monospace">GPIO 34 (ADC1_CH6)</text>
                <text x="255" y="115" fill="#111827" fontSize="11" fontWeight="700" fontFamily="monospace">GPIO 21 (SDA) / 22 (SCL)</text>
                <text x="255" y="150" fill="#111827" fontSize="11" fontWeight="700" fontFamily="monospace">SPI (MISO, MOSI, SCK, CS)</text>
                <text x="255" y="185" fill="#111827" fontSize="11" fontWeight="700" fontFamily="monospace">VIN / GND</text>
                <text x="255" y="225" fill="#9a5b00" fontSize="10" fontWeight="700" fontFamily="monospace">15-min wake cycle (3s wake, 897s sleep)</text>

                {/* Sensor 1: Soil Probe */}
                <rect x="580" y="30" width="210" height="60" rx="6" fill="#ffffff" stroke="#1b4332" strokeWidth="1.5" />
                <text x="595" y="52" fill="#1b4332" fontSize="11" fontWeight="800" fontFamily="sans-serif">CAPACITIVE SOIL v1.2</text>
                <text x="595" y="72" fill="#4b5563" fontSize="10" fontFamily="sans-serif">Analog voltage (0 - 3.0V)</text>

                {/* Sensor 2: SHT31 */}
                <rect x="580" y="105" width="210" height="60" rx="6" fill="#ffffff" stroke="#1b4332" strokeWidth="1.5" />
                <text x="595" y="127" fill="#1b4332" fontSize="11" fontWeight="800" fontFamily="sans-serif">SHT31 TEMP & HUMIDITY</text>
                <text x="595" y="147" fill="#4b5563" fontSize="10" fontFamily="sans-serif">I2C Digital Bus (Addr 0x44)</text>

                {/* LoRa Module SX1276 */}
                <rect x="580" y="180" width="210" height="70" rx="6" fill="#ffffff" stroke="#0d6e5e" strokeWidth="1.5" />
                <text x="595" y="202" fill="#0d6e5e" fontSize="11" fontWeight="800" fontFamily="sans-serif">SX1276 LORA TRANSCEIVER</text>
                <text x="595" y="222" fill="#4b5563" fontSize="10" fontFamily="sans-serif">IN865 Band (865-867 MHz)</text>
                <text x="595" y="238" fill="#4b5563" fontSize="9" fontFamily="monospace">+14 dBm transmit power</text>

                {/* Wiring lines */}
                <line x1="180" y1="75" x2="240" y2="185" stroke="#dc2626" strokeWidth="2" />
                <line x1="520" y1="75" x2="580" y2="60" stroke="#1b4332" strokeWidth="1.5" />
                <line x1="520" y1="110" x2="580" y2="135" stroke="#1b4332" strokeWidth="1.5" />
                <line x1="520" y1="145" x2="580" y2="210" stroke="#0d6e5e" strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          {/* Section 3: How Edge Gateway and Laptop Receive the Data */}
          <div className="system-design-block">
            <h4 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 800 }}>
              2. Data Ingestion Architecture: How It Lands In This Software
            </h4>
            <div style={{ background: "#fafbfc", border: "1px solid var(--border-std)", borderRadius: 8, padding: 18, overflowX: "auto" }}>
              <svg viewBox="0 0 820 220" style={{ width: "100%", minWidth: 720, height: "auto" }}>
                {/* LoRa Signal In The Air */}
                <rect x="20" y="40" width="180" height="130" rx="6" fill="#ffffff" stroke="#1b4332" strokeWidth="1.5" />
                <text x="35" y="65" fill="#1b4332" fontSize="11" fontWeight="800" fontFamily="sans-serif">WIRELESS TRANSMISSION</text>
                <text x="35" y="88" fill="#4b5563" fontSize="10" fontFamily="sans-serif">8x Ground Nodes in Field</text>
                <text x="35" y="108" fill="#4b5563" fontSize="10" fontFamily="sans-serif">12-Byte Packed Binary</text>
                <text x="35" y="132" fill="#0d6e5e" fontSize="10" fontWeight="700" fontFamily="monospace">LoRa 865 MHz (1.5–3 km)</text>
                <text x="35" y="152" fill="#4b5563" fontSize="9" fontFamily="sans-serif">No SIM / No Internet</text>

                {/* Receiver Options */}
                <line x1="200" y1="80" x2="280" y2="65" stroke="#1b4332" strokeWidth="2" />
                <line x1="200" y1="130" x2="280" y2="155" stroke="#1b4332" strokeWidth="2" strokeDasharray="3 3" />

                {/* Pathway A: Raspberry Pi Gateway */}
                <rect x="280" y="30" width="240" height="75" rx="6" fill="#ffffff" stroke="#1b4332" strokeWidth="1.5" />
                <text x="295" y="52" fill="#1b4332" fontSize="11" fontWeight="800" fontFamily="sans-serif">OPTION A: RASPBERRY PI GATEWAY</text>
                <text x="295" y="70" fill="#4b5563" fontSize="10" fontFamily="sans-serif">SX1302 HAT receives packets</text>
                <text x="295" y="88" fill="#0d6e5e" fontSize="9" fontFamily="monospace">Daemon POSTs to /api/ingest</text>

                {/* Pathway B: Laptop Web Serial */}
                <rect x="280" y="125" width="240" height="75" rx="6" fill="#ffffff" stroke="#9a5b00" strokeWidth="1.5" />
                <text x="295" y="147" fill="#9a5b00" fontSize="11" fontWeight="800" fontFamily="sans-serif">OPTION B: LAPTOP USB DONGLE</text>
                <text x="295" y="165" fill="#4b5563" fontSize="10" fontFamily="sans-serif">USB LoRa Dongle @ 115200 baud</text>
                <text x="295" y="183" fill="#9a5b00" fontSize="9" fontFamily="monospace">App 'Connect LoRa' (Web Serial)</text>

                {/* Final Destination: Next.js App Core */}
                <line x1="520" y1="65" x2="580" y2="100" stroke="#1b4332" strokeWidth="2" />
                <line x1="520" y1="160" x2="580" y2="115" stroke="#9a5b00" strokeWidth="2" />

                <rect x="580" y="45" width="220" height="120" rx="6" fill="#1b4332" />
                <text x="600" y="75" fill="#ffffff" fontSize="12" fontWeight="800" fontFamily="sans-serif">SOIL-TO-SKY EDGE APP</text>
                <text x="600" y="98" fill="#b7d6c3" fontSize="10" fontFamily="sans-serif">• Stage 1 Normalizer & IndexedDB</text>
                <text x="600" y="116" fill="#b7d6c3" fontSize="10" fontFamily="sans-serif">• 6 Feature Engines Process Data</text>
                <text x="600" y="134" fill="#b7d6c3" fontSize="10" fontFamily="sans-serif">• SVG Grid Maps 48 Field Zones</text>
                <text x="600" y="152" fill="#ffffff" fontSize="10" fontWeight="700" fontFamily="monospace">Offline on http://localhost</text>
              </svg>
            </div>
          </div>

          {/* Section 4: Physical Actuation & Solenoid Control */}
          <div className="system-design-block">
            <h4 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 800 }}>
              3. Physical Actuator Circuit: 12V Drip Irrigation Valve & Drone Spray
            </h4>
            <div style={{ background: "#fafbfc", border: "1px solid var(--border-std)", borderRadius: 8, padding: 18, overflowX: "auto" }}>
              <svg viewBox="0 0 820 180" style={{ width: "100%", minWidth: 720, height: "auto" }}>
                {/* Human Approval */}
                <rect x="20" y="35" width="180" height="100" rx="6" fill="#ffffff" stroke="#1b4332" strokeWidth="1.5" />
                <text x="35" y="60" fill="#1b4332" fontSize="11" fontWeight="800" fontFamily="sans-serif">STAGE 3 APPROVAL</text>
                <text x="35" y="80" fill="#4b5563" fontSize="10" fontFamily="sans-serif">Operator clicks 'Approve'</text>
                <text x="35" y="98" fill="#4b5563" fontSize="10" fontFamily="sans-serif">Safety gate verified</text>
                <text x="35" y="118" fill="#0d6e5e" fontSize="9" fontWeight="700" fontFamily="monospace">Command Packet Emitted</text>

                <line x1="200" y1="85" x2="260" y2="85" stroke="#1b4332" strokeWidth="2" />

                {/* Gateway Driver */}
                <rect x="260" y="35" width="220" height="100" rx="6" fill="#ffffff" stroke="#1b4332" strokeWidth="1.5" />
                <text x="275" y="60" fill="#1b4332" fontSize="11" fontWeight="800" fontFamily="sans-serif">H-BRIDGE MOSFET DRIVER</text>
                <text x="275" y="80" fill="#4b5563" fontSize="10" fontFamily="sans-serif">GPIO 16/17 sends 50ms pulse</text>
                <text x="275" y="98" fill="#4b5563" fontSize="10" fontFamily="sans-serif">12V DC auxiliary supply</text>
                <text x="275" y="118" fill="#9a5b00" fontSize="9" fontWeight="700" fontFamily="monospace">Zero idle power consumed</text>

                <line x1="480" y1="85" x2="540" y2="85" stroke="#dc2626" strokeWidth="2" />

                {/* Valve Actuator */}
                <rect x="540" y="35" width="250" height="100" rx="6" fill="#ffffff" stroke="#dc2626" strokeWidth="1.5" />
                <text x="555" y="60" fill="#dc2626" fontSize="11" fontWeight="800" fontFamily="sans-serif">12V LATCHING SOLENOID VALVE</text>
                <text x="555" y="80" fill="#4b5563" fontSize="10" fontFamily="sans-serif">Water pipe opens for Zone B2</text>
                <text x="555" y="98" fill="#4b5563" fontSize="10" fontFamily="sans-serif">Hardware Remote Stop Interlock</text>
                <text x="555" y="118" fill="#dc2626" fontSize="9" fontWeight="700" fontFamily="monospace">Emergency Kill Switch override</text>
              </svg>
            </div>
          </div>

          {/* Section 5: The 5-Step Physical Build Workflow Cards */}
          <div>
            <h4 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 800 }}>
              4. Step-by-Step Hardware Deployment Guide (Indian Farm Context)
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {hardwareData.connectionSteps.map((step) => (
                <div key={step.step} style={{ background: "#ffffff", border: "1px solid var(--border-std)", borderRadius: 8, padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 800, color: "var(--accent-primary)" }}>
                      STEP 0{step.step}
                    </span>
                    <HonestyPill status="PROPOSED" size="sm" />
                  </div>
                  <h4 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 800 }}>{step.title}</h4>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                    {step.summary}
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {step.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Complete System Architecture */}
      {activeTab === "topology" && (
        <div className="system-design-block">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Soil-to-Sky Complete System Architecture</h3>
            <HonestyPill status="PROPOSED" size="sm" />
          </div>

          <p style={{ margin: "0 0 20px", color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.5 }}>
            End-to-end hardware signal path from ground soil sensor probes and aerial drone surveys to the Raspberry Pi edge gateway, local Next.js decision engine, and safety-interlocked physical actuators.
          </p>

          <div style={{ background: "#fafbfc", border: "1px solid var(--border-std)", borderRadius: 8, padding: "24px 16px", overflowX: "auto" }}>
            <svg viewBox="0 0 880 320" style={{ width: "100%", minWidth: 780, height: "auto" }}>
              <rect x="30" y="30" width="220" height="110" rx="6" fill="#ffffff" stroke="#1b4332" strokeWidth="1.5" />
              <text x="45" y="55" fill="#1b4332" fontSize="12" fontWeight="800" fontFamily="sans-serif">SKY LAYER (SURVEY DRONE)</text>
              <text x="45" y="78" fill="#4b5563" fontSize="11" fontFamily="sans-serif">450mm Carbon Quadcopter</text>
              <text x="45" y="96" fill="#4b5563" fontSize="11" fontFamily="sans-serif">24MP RGB + Downwelling Sensor</text>
              <text x="45" y="118" fill="#0d6e5e" fontSize="10" fontFamily="monospace">Output: GeoTIFF Orthomosaic</text>

              <rect x="30" y="170" width="220" height="120" rx="6" fill="#ffffff" stroke="#1b4332" strokeWidth="1.5" />
              <text x="45" y="195" fill="#1b4332" fontSize="12" fontWeight="800" fontFamily="sans-serif">GROUND NODES (x8)</text>
              <text x="45" y="218" fill="#4b5563" fontSize="11" fontFamily="sans-serif">ESP32-WROOM-32U + SX1276</text>
              <text x="45" y="236" fill="#4b5563" fontSize="11" fontFamily="sans-serif">Capacitive Probe + SHT31 Temp/RH</text>
              <text x="45" y="254" fill="#4b5563" fontSize="11" fontFamily="sans-serif">TP4056 Solar + 3400mAh Li-ion</text>
              <text x="45" y="274" fill="#0d6e5e" fontSize="10" fontFamily="monospace">15-min wake, 12-byte LoRa packet</text>

              <rect x="330" y="60" width="240" height="200" rx="6" fill="#ffffff" stroke="#1b4332" strokeWidth="2" />
              <rect x="330" y="60" width="240" height="28" rx="6" fill="#1b4332" />
              <text x="345" y="79" fill="#ffffff" fontSize="11" fontWeight="800" fontFamily="sans-serif">EDGE GATEWAY (RASPBERRY PI)</text>
              <text x="345" y="112" fill="#111827" fontSize="12" fontWeight="700" fontFamily="sans-serif">Raspberry Pi 4 / 5 + SX1302 HAT</text>
              <text x="345" y="132" fill="#4b5563" fontSize="11" fontFamily="sans-serif">• Offline Wi-Fi Access Point</text>
              <text x="345" y="150" fill="#4b5563" fontSize="11" fontFamily="sans-serif">• Local Next.js & IndexedDB Edge Store</text>
              <text x="345" y="168" fill="#4b5563" fontSize="11" fontFamily="sans-serif">• 6 Autonomous Feature Engines</text>
              <text x="345" y="186" fill="#4b5563" fontSize="11" fontFamily="sans-serif">• Verification Rule Evaluator</text>
              <text x="345" y="210" fill="#9a5b00" fontSize="10" fontWeight="700" fontFamily="monospace">Local Store-and-Forward Queue</text>
              <text x="345" y="235" fill="#4b5563" fontSize="10" fontFamily="monospace">Zero Internet Dependency</text>

              <rect x="640" y="60" width="210" height="200" rx="6" fill="#ffffff" stroke="#dc2626" strokeWidth="1.5" />
              <rect x="640" y="60" width="210" height="28" rx="6" fill="#dc2626" />
              <text x="655" y="79" fill="#ffffff" fontSize="11" fontWeight="800" fontFamily="sans-serif">ACTION & ACTUATION LAYER</text>
              <text x="655" y="112" fill="#111827" fontSize="12" fontWeight="700" fontFamily="sans-serif">4-Stage Safety Checklist</text>
              <text x="655" y="132" fill="#4b5563" fontSize="11" fontFamily="sans-serif">• 12V Latching Irrigation Valve</text>
              <text x="655" y="150" fill="#4b5563" fontSize="11" fontFamily="sans-serif">• Drone Spray Prescription Export</text>
              <text x="655" y="168" fill="#4b5563" fontSize="11" fontFamily="sans-serif">• Operator SMS Notification</text>
              <text x="655" y="196" fill="#dc2626" fontSize="10" fontWeight="800" fontFamily="sans-serif">KILL-SWITCH INTERLOCK</text>
              <text x="655" y="222" fill="#4b5563" fontSize="10" fontFamily="monospace">Dry-Run Plain Water Protocol</text>

              <line x1="250" y1="85" x2="330" y2="120" stroke="#1b4332" strokeWidth="1.5" strokeDasharray="4 4" />
              <text x="260" y="98" fill="#4b5563" fontSize="9" fontFamily="monospace">USB/Wi-Fi</text>

              <line x1="250" y1="230" x2="330" y2="180" stroke="#1b4332" strokeWidth="1.5" />
              <text x="260" y="215" fill="#4b5563" fontSize="9" fontFamily="monospace">LoRa 865MHz</text>

              <line x1="570" y1="160" x2="640" y2="160" stroke="#dc2626" strokeWidth="1.5" />
              <text x="578" y="152" fill="#dc2626" fontSize="9" fontWeight="700" fontFamily="monospace">Authorized</text>
            </svg>
          </div>

          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            <div className="hardware-desc-box">
              <strong>Ground Node Power Budget (18650 Cell)</strong>
              <p style={{ margin: "4px 0 0" }}>
                3 sec active transmission @ 120 mA, 897 sec deep sleep @ 15 µA. Average current: 0.415 mA. A 3400 mAh 18650 cell delivers 340 days runtime without sunlight; a 2W solar panel provides perpetual field operation.
              </p>
            </div>
            <div className="hardware-desc-box">
              <strong>Edge Gateway Fail-Safe Topology</strong>
              <p style={{ margin: "4px 0 0" }}>
                Runs completely isolated in rural farms without cell towers or grid power. Broadcasts local field Wi-Fi for laptop inspection. Telemetry is buffered in local IndexedDB and syncs to cloud only when connection restores.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Layer Cards & Builds */}
      {activeTab === "layers" && (
        <div className="hardware-grid">
          {hardwareData.layers.map((layer) => {
            const isExpanded = expandedLayer === layer.id;
            const iconKey = layer.icon.replace("icon-", "") as IconName;

            return (
              <div className="hardware-card" key={layer.id}>
                <div className="hardware-card-head">
                  <div className="hardware-title-block">
                    <SystemIcon name={iconKey} size={20} />
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{layer.label}</h3>
                  </div>
                  <HonestyPill status="PROPOSED" size="sm" />
                </div>

                <div>
                  <strong style={{ display: "block", fontSize: 9, fontWeight: 800, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase" }}>
                    Bill of Parts
                  </strong>
                  <ul className="hardware-parts-list">
                    {layer.parts.map((part, pIdx) => (
                      <li key={pIdx}>{part}</li>
                    ))}
                  </ul>
                </div>

                <div className="hardware-desc-box">
                  <strong>Build Approach</strong>
                  <p style={{ margin: 0 }}>{layer.build}</p>
                </div>

                <div className="hardware-desc-box" style={{ background: "#f0f7f3", borderColor: "#cce4d6" }}>
                  <strong style={{ color: "var(--accent-primary)" }}>Verification Test</strong>
                  <p style={{ margin: 0 }}>{layer.test}</p>
                </div>

                <button
                  type="button"
                  className="button button-secondary button-small"
                  style={{ marginTop: "auto", width: "100%", justifyContent: "center" }}
                  onClick={() => setExpandedLayer(isExpanded ? null : layer.id)}
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>{isExpanded ? "Hide Technical Details" : "View Technical Spec"}</span>
                </button>

                {isExpanded && layer.hardwareSpec && (
                  <div style={{ paddingTop: 12, borderTop: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: 8, fontSize: 11 }}>
                    {Object.entries(layer.hardwareSpec).map(([specKey, specVal]) => (
                      <div key={specKey} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "var(--text-tertiary)" }}>
                          {specKey.replace(/([A-Z])/g, " $1")}
                        </span>
                        <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{String(specVal)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB: LoRa Packet & Pinouts */}
      {activeTab === "packet" && (
        <div className="system-design-block">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>LoRa Binary Packet & Hardware Pinouts</h3>
            <HonestyPill status="PROPOSED" size="sm" />
          </div>

          <p style={{ margin: "0 0 18px", color: "var(--text-secondary)", fontSize: 13 }}>
            Telemetry uses compact 12-byte packed binary frames over LoRa 865 MHz (IN865 band). Designed for high penetration through dense crop canopy and ultra-low transmit energy.
          </p>

          <div className="plan-table-container">
            <table className="plan-table">
              <thead>
                <tr>
                  <th>Byte Range</th>
                  <th>Field Identifier</th>
                  <th>Binary Type</th>
                  <th>Payload Description</th>
                </tr>
              </thead>
              <tbody>
                {hardwareData.packetSpecification.fields.map((field) => (
                  <tr key={field.name}>
                    <td>
                      <code style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{field.bytes}</code>
                    </td>
                    <td>
                      <strong>{field.name}</strong>
                    </td>
                    <td>
                      <span className="mono-badge">{field.type}</span>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{field.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 20 }}>
            <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 800 }}>ESP32 Sensor Node Pinout Configuration</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, fontFamily: "var(--font-mono)", fontSize: 11 }}>
              <div style={{ padding: 10, background: "#f8f9fa", border: "1px solid var(--border-light)", borderRadius: 6 }}>
                <strong>GPIO 34 (ADC1_CH6)</strong>
                <div style={{ color: "var(--text-secondary)", marginTop: 2 }}>Capacitive Soil Probe v1.2</div>
              </div>
              <div style={{ padding: 10, background: "#f8f9fa", border: "1px solid var(--border-light)", borderRadius: 6 }}>
                <strong>GPIO 21 (SDA) / 22 (SCL)</strong>
                <div style={{ color: "var(--text-secondary)", marginTop: 2 }}>SHT31 Temperature & Humidity</div>
              </div>
              <div style={{ padding: 10, background: "#f8f9fa", border: "1px solid var(--border-light)", borderRadius: 6 }}>
                <strong>GPIO 5, 18, 19, 23 (SPI)</strong>
                <div style={{ color: "var(--text-secondary)", marginTop: 2 }}>SX1276 LoRa Transceiver Module</div>
              </div>
              <div style={{ padding: 10, background: "#f8f9fa", border: "1px solid var(--border-light)", borderRadius: 6 }}>
                <strong>GPIO 16 / 17 (PWM/H-Bridge)</strong>
                <div style={{ color: "var(--text-secondary)", marginTop: 2 }}>12V Latching Solenoid Pulse</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </SystemShell>
  );
}
