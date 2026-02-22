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
  voiceData?: string;
};

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [risk, setRisk] = useState<RiskPayload | null>(null);

  useEffect(() => {
    const socket = io("http://10.108.174.237:4000", {
      transports: ["websocket"],
    });

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

      // Plays voice if backend sent audio
      if (data.voiceData) {
        const audio = new Audio(
          `data:audio/mpeg;base64,${data.voiceData}`
        );
        audio.play().catch((err) => {
          console.log("Audio blocked:", err);
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const riskColor =
    risk?.riskLevel === "RED"
      ? "text-red-500"
      : risk?.riskLevel === "YELLOW"
      ? "text-yellow-400"
      : "text-green-500";

  const bgGlow =
    risk?.riskLevel === "RED"
      ? "shadow-red-500/40"
      : risk?.riskLevel === "YELLOW"
      ? "shadow-yellow-400/40"
      : "shadow-green-500/40";

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className={`w-full max-w-2xl bg-zinc-900 rounded-2xl p-10 shadow-2xl ${bgGlow}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-wide">
            Threat Detection
          </h1>

          <div className="flex items-center gap-2 text-sm">
            <div
              className={`h-3 w-3 rounded-full ${
                connected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            {connected ? "Connected" : "Disconnected"}
          </div>
        </div>

        {/* Main Risk Display */}
        {risk ? (
          <>
            <div className="text-center mb-10">
              <div className="text-lg opacity-70 mb-2">
                Risk Score
              </div>

              <div className="text-5xl font-bold mb-4">
                {Math.round(risk.riskScore)}
              </div>

              <div
                className={`text-6xl font-extrabold tracking-widest ${riskColor} transition-all duration-300`}
              >
                {risk.riskLevel}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-6 text-center text-sm">
              <div className="bg-zinc-800 rounded-xl p-4">
                <div className="opacity-60 mb-1">Heart Rate</div>
                <div className="text-xl font-semibold">
                  {risk.heartRate ?? "-"}
                </div>
              </div>

              <div className="bg-zinc-800 rounded-xl p-4">
                <div className="opacity-60 mb-1">Breathing</div>
                <div className="text-xl font-semibold">
                  {risk.breathingRate ?? "-"}
                </div>
              </div>

              <div className="bg-zinc-800 rounded-xl p-4">
                <div className="opacity-60 mb-1">Stress Index</div>
                <div className="text-xl font-semibold">
                  {risk.stressIndex ?? "-"}
                </div>
              </div>

              <div className="bg-zinc-800 rounded-xl p-4">
                <div className="opacity-60 mb-1">Engagement</div>
                <div className="text-xl font-semibold">
                  {risk.engagement ?? "-"}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center opacity-50">
            Waiting for incoming metrics...
          </div>
        )}
      </div>
    </main>
  );
}