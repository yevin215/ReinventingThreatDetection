require("dotenv").config();

console.log("Eleven key exists:", !!process.env.ELEVENLABS_API_KEY);
console.log("Eleven key value:", process.env.ELEVENLABS_API_KEY);

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"]
}));

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ["websocket", "polling"]
});

app.get("/", (req, res) => {
  res.send("Threat Detection Backend Running");
});

let lastRiskLevel = "GREEN";

// ElevenLabs voice generator
async function generateVoiceAlert(text) {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      console.error("Missing ELEVENLABS_API_KEY");
      return null;
    }

    console.log("Triggering voice alert...");

    const response = await axios.post(
      "https://api.elevenlabs.io/v1/text-to-speech/Kvcnj2rpsBNFQ5XSUrMG",
      {
        text,
        model_id: "eleven_monolingual_v1"
      },
      {
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json"
        },
        responseType: "arraybuffer"
      }
    );

    return Buffer.from(response.data).toString("base64");

  } catch (err) {
    console.error(
      "Voice generation failed:",
      err.response?.data?.toString() || err.message
    );
    return null;
  }
}

// Metrics endpoint
app.post("/metrics", async (req, res) => {

  const data = req.body;
  console.log("Incoming metrics:", data);

  const heartRate = data.heartRate || 0;
  const breathingRate = data.breathingRate || 0;
  const stressIndex = data.stressIndex || 0;
  const engagement = data.engagement ?? 1;

  const riskScore = Math.min(
    100,
    stressIndex * 60 +
    (1 - engagement) * 30 +
    heartRate * 0.1
  );

  let riskLevel = "GREEN";
  if (riskScore > 70) riskLevel = "RED";
  else if (riskScore > 40) riskLevel = "YELLOW";

  const payload = {
    heartRate,
    breathingRate,
    stressIndex,
    engagement,
    riskScore,
    riskLevel
  };

  let voiceData = null;

  // Trigger only when level changes
  if (riskLevel !== lastRiskLevel) {

    if (riskLevel === "YELLOW") {
      voiceData = await generateVoiceAlert(
        "Caution. Elevated stress detected. Security has been alerted."
      );
    }

    if (riskLevel === "RED") {
      voiceData = await generateVoiceAlert(
        "Warning. Critical stress levels detected."
      );
    }
  }

  lastRiskLevel = riskLevel;

  console.log("Voice data length:", voiceData ? voiceData.length : "NO AUDIO");

  io.emit("riskUpdate", { ...payload, voiceData });

  res.json({ status: "ok" });
});

io.on("connection", (socket) => {
  console.log("Dashboard connected:", socket.id);
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});