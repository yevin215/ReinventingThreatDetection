const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"]
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

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

app.post("/metrics", (req, res) => {
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

// Error handler must be last
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") {
    console.error("Payload too large");
    return res.status(413).json({ error: "Payload too large" });
  }
  next(err);
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});