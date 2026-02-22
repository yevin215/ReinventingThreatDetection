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

  useEffect(() => {
    const socket = io(
      "https://threat-detection-backend-production.up.railway.app",
      {
        transports: ["websocket"],
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
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
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
    </main>
  );
}