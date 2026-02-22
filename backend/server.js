const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"]
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") {
    console.error("Payload too large (increase express.json limit)");
    return res.status(413).json({ error: "Payload too large" });
  }
  next(err);
});

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

// Metrics
app.post("/metrics", (req, res) => {
  const data = req.body;

  console.log("Incoming metrics:", {
  heartRate: data.heartRate,
  breathingRate: data.breathingRate,
  stressIndex: data.stressIndex,
  engagement: data.engagement,
  frameBytes: data.frameBase64 ? data.frameBase64.length : 0
});

if (frameBase64 && frameBase64.length > 200) {
  io.emit("frameUpdate", { frameBase64 });
}

  const heartRate = data.heartRate || 0;
  const breathingRate = data.breathingRate || 0;
  const stressIndex = data.stressIndex || 0;
  const engagement = data.engagement ?? 1;

  // Risk Calc
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

  const frameBase64 = data.frameBase64;

  io.emit("riskUpdate", payload);

  if (frameBase64) {
    io.emit("frameUpdate", { frameBase64 });
  }

  res.json({ status: "ok", ...payload });
});

io.on("connection", (socket) => {
  console.log("Dashboard connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Dashboard disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});