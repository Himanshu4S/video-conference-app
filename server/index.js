const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:3000", // React app
//     methods: ["GET", "POST"],
//   },
//   transports: ["websocket", "polling"], // 👈 Important to allow both
//   allowEIO3: true, // 👈 For compatibility
// });
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // your React frontend
    methods: ["GET", "POST"],
  },
  // Don't restrict only websocket
});

app.use(cors());

io.on("connection", (socket) => {
  console.log("✅ A user connected:", socket.id);

  socket.on("send-message", (message) => {
    console.log("💬 Received message:", message);
    io.emit("receive-message", message);
  });

  socket.on("disconnect", (reason) => {
    console.log(`❌ User disconnected: ${socket.id} due to ${reason}`);
  });
});

app.get("/", (req, res) => {
  res.send("Server is running...");
});

const PORT = 5001;
server.listen(PORT, "127.0.0.1", () => {
  console.log(`🚀 Server listening on http://127.0.0.1:${PORT}`);
});
