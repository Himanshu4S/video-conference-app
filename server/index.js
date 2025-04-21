const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000", // Allow local dev environment
      "https://4a5d-49-43-179-191.ngrok-free.app", // Replace with your ngrok URL
    ],
    methods: ["GET", "POST"],
    credentials: true, // Allow cookies for cross-origin
  },
});

app.use(cors());

io.on("connection", (socket) => {
  console.log("✅ A user connected:", socket.id);

  // Handle text message
  socket.on("send-message", (message) => {
    console.log("💬 Received message:", message);
    io.emit("receive-message", message); // Broadcast to all connected clients
  });

  // Handle WebRTC offer
  socket.on("offer", (offer) => {
    console.log("📩 Offer received:", offer);
    socket.broadcast.emit("offer", offer); // Send to everyone except the sender
  });

  // Handle WebRTC answer
  socket.on("answer", (answer) => {
    console.log("📩 Answer received:", answer);
    socket.broadcast.emit("answer", answer); // Send to everyone except the sender
  });

  // Handle ICE candidates
  socket.on("ice-candidate", (candidate) => {
    console.log("📩 ICE Candidate:", candidate);
    socket.broadcast.emit("ice-candidate", candidate); // Send to everyone except the sender
  });

  socket.on("disconnect", (reason) => {
    console.log(`❌ User disconnected: ${socket.id} due to ${reason}`);
  });
});

app.get("/", (req, res) => {
  res.send("Server is running...");
});

const PORT = 5001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
