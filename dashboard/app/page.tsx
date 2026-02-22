"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

type RiskPayload = {
  heartRate?: number;
  breathingRate?: number;
  stressIndex?: number;
  engagement?: number;
  riskScore: number;
  riskLevel: "GREEN" | "YELLOW" | "RED";
};

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [risk, setRisk] = useState<RiskPayload | null>(null);
  const [frameSrc, setFrameSrc] = useState<string | null>(null);

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
      setRisk(data);
    });

    socket.on("frameUpdate", (msg: { frameBase64: string }) => {
      setFrameSrc(`data:image/jpeg;base64,${msg.frameBase64}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const color =
    risk?.riskLevel === "RED"
      ? "text-red-500"
      : risk?.riskLevel === "YELLOW"
      ? "text-yellow-400"
      : "text-green-500";

    return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

        <div className="w-full">
          <div className="text-sm opacity-80 mb-2">Live Feed</div>

          <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
            {frameSrc ? (
              <img
                src={frameSrc}
                alt="Live camera feed"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-sm opacity-60 px-6 text-center">
                Waiting for camera frames…
                <div className="opacity-50 mt-1">
                  (iOS must send <code className="opacity-90">frameBase64</code> in{" "}
                  <code className="opacity-90">POST /metrics</code>)
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold">Threat Detection Dashboard</h1>

          <p className="text-sm opacity-80">
            Backend: {connected ? "🟢 Connected" : "🔴 Disconnected"}
          </p>

          {risk ? (
            <div className="space-y-2">
              <div className="text-2xl">
                Risk Score: {Math.round(risk.riskScore)}
              </div>

              <div className={`text-5xl font-extrabold ${color}`}>
                {risk.riskLevel}
              </div>

              <div className="text-sm opacity-70">
                Heart Rate: {risk.heartRate ?? "-"} | Breathing:{" "}
                {risk.breathingRate ?? "-"} | Stress:{" "}
                {risk.stressIndex ?? "-"} | Engagement:{" "}
                {risk.engagement ?? "-"}
              </div>
            </div>
          ) : (
            <p className="opacity-60">Waiting for incoming metrics...</p>
          )}
        </div>

      </div>
    </main>
  );
}