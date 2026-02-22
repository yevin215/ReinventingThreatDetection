"use client";

import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

type RiskPayload = {
  heartRate?: number;
  breathingRate?: number;
  stressIndex?: number;
  engagement?: number;
  riskScore: number;
  riskLevel: "GREEN" | "YELLOW" | "RED";
};

function PulseRing({ level }: { level: "GREEN" | "YELLOW" | "RED" }) {
  const color =
    level === "RED" ? "#ef4444" : level === "YELLOW" ? "#eab308" : "#22c55e";
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        className="absolute rounded-full opacity-20 animate-ping"
        style={{
          width: 220,
          height: 220,
          backgroundColor: color,
          animationDuration: level === "RED" ? "0.8s" : "2s",
        }}
      />
      <div
        className="absolute rounded-full opacity-10 animate-ping"
        style={{
          width: 280,
          height: 280,
          backgroundColor: color,
          animationDuration: level === "RED" ? "1.2s" : "2.5s",
          animationDelay: "0.3s",
        }}
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: number | string;
  unit?: string;
  accent: string;
}) {
  return (
    <div
      className="relative overflow-hidden p-5 flex flex-col gap-1"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        className="absolute top-0 left-0 h-0.5 w-full"
        style={{ background: accent }}
      />
      <span
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: accent, opacity: 0.8 }}
      >
        {label}
      </span>
      <span className="text-3xl font-black text-white tabular-nums">
        {value ?? "—"}
        {unit && (
          <span className="text-base font-normal opacity-40 ml-1">{unit}</span>
        )}
      </span>
    </div>
  );
}

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [risk, setRisk] = useState<RiskPayload | null>(null);
  const [frameSrc, setFrameSrc] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const prevLevel = useRef<string | null>(null);

  useEffect(() => {
    const socket = io(
      "https://threat-detection-backend-production.up.railway.app",
      {
        transports: ["websocket", "polling"],
        secure: true,
      }
    );
    socket.on("connect", () => {
      console.log("Connected:", socket.id);
      setConnected(true);
    });

    socket.on("connect_error", (err) => {
      console.log("Connection error:", err.message);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected");
      setConnected(false);
    });

    socket.on("riskUpdate", (data: RiskPayload) => {
      console.log("Risk update received:", data);
      if (prevLevel.current !== data.riskLevel) {
        setFlash(true);
        setTimeout(() => setFlash(false), 600);
        prevLevel.current = data.riskLevel;
      }
      setRisk(data);
    });

    socket.on("frameUpdate", (msg: { frameBase64: string }) => {
      setFrameSrc(`data:image/jpeg;base64,${msg.frameBase64}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const accentColor =
    risk?.riskLevel === "RED"
      ? "#ef4444"
      : risk?.riskLevel === "YELLOW"
      ? "#eab308"
      : "#22c55e";

  const riskLabel = risk?.riskLevel ?? "STANDBY";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080a0f; }
        .scan-line {
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255,255,255,0.015) 2px,
            rgba(255,255,255,0.015) 4px
          );
          pointer-events: none;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        @keyframes flashBorder {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        .risk-flash { animation: flashBorder 0.6s ease; }
      `}</style>

      <main
        className="min-h-screen text-white relative"
        style={{ fontFamily: "'DM Mono', monospace", background: "#080a0f" }}
      >
        {/* Scan line overlay */}
        <div className="scan-line fixed inset-0 z-50 pointer-events-none" />

        {/* Flash overlay on risk level change */}
        {flash && (
          <div
            className="fixed inset-0 z-40 pointer-events-none risk-flash"
            style={{ background: accentColor, opacity: 0.06 }}
          />
        )}

        {/* Grid background */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8 min-h-screen">

          {/* Header */}
          <header className="flex items-center justify-between">
            <div>
              <div
                className="text-xs uppercase tracking-[0.3em] opacity-40 mb-1"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                System Active
              </div>
              <h1
                className="text-5xl tracking-wider"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  letterSpacing: "0.08em",
                  color: accentColor,
                  transition: "color 0.5s ease",
                  textShadow: `0 0 40px ${accentColor}66`,
                }}
              >
                Threat Detection
              </h1>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div
                className="h-2 w-2 rounded-full"
                style={{
                  background: connected ? "#22c55e" : "#ef4444",
                  boxShadow: connected
                    ? "0 0 8px #22c55e"
                    : "0 0 8px #ef4444",
                }}
              />
              <span className="opacity-60 uppercase tracking-widest">
                {connected ? "Online" : "Offline"}
              </span>
            </div>
          </header>

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">

            {/* Camera feed */}
            <div className="flex flex-col gap-3">
              <div className="text-xs uppercase tracking-widest opacity-40">
                Live Feed
              </div>
              <div
                className="relative flex-1 overflow-hidden"
                style={{
                  border: `1px solid ${accentColor}44`,
                  background: "rgba(255,255,255,0.02)",
                  minHeight: 320,
                  boxShadow: `0 0 40px ${accentColor}22`,
                  transition: "border-color 0.5s, box-shadow 0.5s",
                }}
              >
                {frameSrc ? (
                  <img
                    src={frameSrc}
                    alt="Live camera feed"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <div className="text-xs opacity-30 uppercase tracking-widest">
                      Awaiting Signal
                    </div>
                    <div className="text-xs opacity-20">
                      iOS → frameBase64 → POST /metrics
                    </div>
                  </div>
                )}

                {/* Corner decorations */}
                <div className="absolute top-3 left-3 w-4 h-4 border-l border-t" style={{ borderColor: accentColor }} />
                <div className="absolute top-3 right-3 w-4 h-4 border-r border-t" style={{ borderColor: accentColor }} />
                <div className="absolute bottom-3 left-3 w-4 h-4 border-l border-b" style={{ borderColor: accentColor }} />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-r border-b" style={{ borderColor: accentColor }} />
              </div>
            </div>

            {/* Risk panel */}
            <div className="flex flex-col gap-6">

              {/* Big risk indicator */}
              <div
                className="relative flex flex-col items-center justify-center py-10 overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${accentColor}33`,
                  transition: "border-color 0.5s",
                }}
              >
                {risk && <PulseRing level={risk.riskLevel} />}

                <div className="text-xs uppercase tracking-[0.4em] opacity-30 mb-2">
                  Threat Level
                </div>

                <div
                  className="fade-up"
                  key={riskLabel}
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "6rem",
                    lineHeight: 1,
                    color: accentColor,
                    textShadow: `0 0 60px ${accentColor}88`,
                    transition: "color 0.5s, text-shadow 0.5s",
                  }}
                >
                  {riskLabel}
                </div>

                {risk && (
                  <div className="mt-3 text-xs opacity-40 uppercase tracking-widest">
                    Score:{" "}
                    <span className="opacity-80">
                      {Math.round(risk.riskScore)}
                    </span>
                    /100
                  </div>
                )}
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="Heart Rate"
                  value={risk?.heartRate ?? "—"}
                  unit="bpm"
                  accent="#f97316"
                />
                <MetricCard
                  label="Breathing"
                  value={
                    risk?.breathingRate
                      ? Math.round(risk.breathingRate)
                      : "—"
                  }
                  unit="rpm"
                  accent="#38bdf8"
                />
                <MetricCard
                  label="Stress Index"
                  value={
                    risk?.stressIndex
                      ? risk.stressIndex.toFixed(2)
                      : "—"
                  }
                  accent="#a78bfa"
                />
                <MetricCard
                  label="Engagement"
                  value={
                    risk?.engagement
                      ? risk.engagement.toFixed(2)
                      : "—"
                  }
                  accent="#34d399"
                />
              </div>

              {!risk && (
                <div className="text-center text-xs opacity-30 uppercase tracking-widest py-4">
                  Waiting for incoming metrics...
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className="flex justify-between text-xs opacity-20 uppercase tracking-widest">
            <span>Reinventing Threat Detection</span>
            <span>WSU Hackathon 2026</span>
          </footer>
        </div>
      </main>
    </>
  );
}