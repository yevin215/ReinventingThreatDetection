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

  // Simple risk calculation
  const riskScore = Math.min(
    100,
    (data.stressIndex || 0) * 60 +
    (1 - (data.engagement || 1)) * 30 +
    (data.heartRate || 60) * 0.1
  );

  let riskLevel = "GREEN";
  if (riskScore > 70) riskLevel = "RED";
  else if (riskScore > 40) riskLevel = "YELLOW";

  const payload = { ...data, riskScore, riskLevel };

  io.emit("riskUpdate", payload);

  res.json({ status: "ok", payload });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});