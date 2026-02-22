const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.get("/", (req, res) => {
  res.send("Threat Detection Backend Running");
});

app.post("/metrics", (req, res) => {
  const data = req.body;

  console.log("Incoming metrics:", data);

  const heartRate = data.heartRate || 60;
  const breathingRate = data.breathingRate || 12;

  const riskScore = Math.min(
    100,
    heartRate * 0.7 + breathingRate * 2.5
  );

  let riskLevel = "GREEN";
  if (riskScore > 85) riskLevel = "RED";
  else if (riskScore > 60) riskLevel = "YELLOW";

  const payload = {
    heartRate,
    breathingRate,
    riskScore,
    riskLevel,
    timestamp: Date.now()
  };

  io.emit("riskUpdate", payload);

  res.json({ status: "ok", payload });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});