import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5001", {
  transports: ["polling", "websocket"],
  reconnection: true,
});

function App() {
  const [message, setMessage] = useState("");
  const [receivedMessage, setReceivedMessage] = useState("");
  const [isVideoCall, setIsVideoCall] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Connected to server:", socket.id);
    });

    socket.on("receive-message", (message) => {
      console.log("📩 New message received:", message);
      setReceivedMessage(message);
    });

    socket.on("offer", (offer) => {
      handleOffer(offer);
    });

    socket.on("answer", (answer) => {
      handleAnswer(answer);
    });

    socket.on("ice-candidate", (candidate) => {
      handleIceCandidate(candidate);
    });

    return () => {
      // socket.disconnect();
    };
  }, []);

  // Set up local video stream safely
  const setupLocalStream = async () => {
    // Check if navigator.mediaDevices and getUserMedia are available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert(
        "🚫 Camera/Mic not supported in this browser or insecure connection!"
      );
      console.error("🚫 navigator.mediaDevices or getUserMedia not available.");
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      console.error("🚫 Error accessing camera/microphone:", error);
      alert("Error accessing camera/microphone. Please check permissions.");
      return null;
    }
  };

  const initializePeerConnection = () => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", event.candidate);
      }
    };

    peerConnection.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    return peerConnection;
  };

  const createOffer = async () => {
    const stream = await setupLocalStream();
    if (!stream) {
      console.error("🚫 No local stream available.");
      return; // Stop if no stream
    }

    const peerConnection = initializePeerConnection();

    // Add each track
    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      socket.emit("offer", offer);
      setIsVideoCall(true);

      peerConnectionRef.current = peerConnection;
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  };

  const handleOffer = async (offer) => {
    const stream = await setupLocalStream();
    if (!stream) {
      console.error("🚫 No local stream available.");
      return; // Stop if no stream
    }

    const peerConnection = initializePeerConnection();

    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    try {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socket.emit("answer", answer);
      setIsVideoCall(true);

      peerConnectionRef.current = peerConnection;
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  };

  const handleAnswer = (answer) => {
    try {
      peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  };

  const handleIceCandidate = (candidate) => {
    try {
      peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  };

  return (
    <div className="App">
      <h1>🎥 Video Conferencing App</h1>

      <div style={{ marginBottom: "20px" }}>
        <button onClick={createOffer} disabled={isVideoCall}>
          {isVideoCall ? "Video Call Started" : "Start Video Call"}
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
        <video
          ref={localVideoRef}
          autoPlay
          muted
          style={{ width: "300px", height: "200px", backgroundColor: "black" }}
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          style={{ width: "300px", height: "200px", backgroundColor: "black" }}
        />
      </div>

      {/* Messaging Section */}
      <div style={{ marginTop: "40px" }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          style={{ padding: "8px", width: "200px" }}
        />
        <button
          onClick={() => socket.emit("send-message", message)}
          style={{ padding: "8px 12px", marginLeft: "10px" }}
        >
          Send
        </button>
      </div>

      {receivedMessage && (
        <div style={{ marginTop: "20px" }}>
          <strong>Received:</strong> {receivedMessage}
        </div>
      )}
    </div>
  );
}

export default App;
