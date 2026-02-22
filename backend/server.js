const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

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

// Metrics
app.post("/metrics", (req, res) => {
  const data = req.body;

  console.log("Incoming metrics:", data);

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

  io.emit("riskUpdate", payload);
  
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