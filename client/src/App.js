import { useEffect, useState } from "react";
import { io } from "socket.io-client";

// Connect to backend server
// Connect to backend server
const socket = io("http://localhost:5001", {
  transports: ["polling", "websocket"], // 🛠 Allow polling first
  reconnection: true, // 🔥 Allow auto reconnect
});

function App() {
  const [message, setMessage] = useState(""); // 📩 Message you type
  const [receivedMessage, setReceivedMessage] = useState(""); // 📬 Message you receive

  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Connected to server:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Connection error:", err);
    });

    socket.on("receive-message", (message) => {
      console.log("📩 New message received:", message);
      setReceivedMessage(message); // ⬅️ Show received message in UI
    });

    return () => {
      // socket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (message.trim() !== "") {
      socket.emit("send-message", message);
      setMessage(""); // Clear input after sending
    }
  };

  return (
    <div className="App" style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Hello Video Conferencing App!</h1>

      {/* Input to type message */}
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        style={{ padding: "10px", width: "300px", fontSize: "16px" }}
      />

      {/* Send button */}
      <button
        onClick={sendMessage}
        style={{
          marginLeft: "10px",
          padding: "10px 20px",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Send
      </button>

      {/* Display received message */}
      <div style={{ marginTop: "30px" }}>
        <h2>Received Message:</h2>
        <p style={{ fontSize: "20px", color: "green" }}>{receivedMessage}</p>
      </div>
    </div>
  );
}

export default App;
