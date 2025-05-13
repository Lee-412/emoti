import React, { useRef, useEffect, useState } from "react";
import "./ChatPage.css";
import { askBot } from "../chat";
import { useNavigate } from "react-router-dom";

function ChatPage() {
  const facialRecognitionModel =
    process.env.REACT_APP_FACE_RECOGNITION_MODEL || "Facenet";
  const faceDetector = process.env.REACT_APP_FACE_DETECTOR || "opencv";
  const distanceMetric = process.env.REACT_APP_DISTANCE_METRIC || "cosine";

  const serviceEndpoint = process.env.REACT_APP_SERVICE_ENDPOINT;
  const antiSpoofing = process.env.REACT_APP_ANTI_SPOOFING === "1";
  const [ttsEnabled, setTTSEnabled] = useState(false);
  const [webcamEnabled, setWebcamEnabled] = useState(true);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();

  const [base64Image, setBase64Image] = useState("");

  const [isVerified, setIsVerified] = useState(null);
  const [user, setUser] = useState({
    email: "",
    password: "",
    id: 0,
  });
  const [isAnalyzed, setIsAnalyzed] = useState(null);
  const [analysis, setAnalysis] = useState([]);

  const [facialDb, setFacialDb] = useState({});

  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  // Emotion mapping to friendly Vietnamese messages
  const emotionMessages = {
    sad: "Trông bạn có vẻ buồn thế, bạn cần tôi giúp gì không?",
    happy: "Hôm nay có chuyện gì mà bạn vui thế?",
    angry: "Bạn đang tức giận à?",
    neutral:
      "Bạn có vẻ tốt, chúc bạn một ngày tốt lành, bạn muốn nói chuyện gì không?",
    surprise: "Sao bạn có vẻ ngạc nhiên vậy?",
    fear: "Trông bạn có vẻ nhợt nhạt quá, bạn đang sợ hãi điều gì vậy?",
    disgust:
      "Trông bạn như đang khinh bỉ điều gì đó, tôi à, hay một chuyện gì khác?",
  };
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    console.log(storedUser);

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    }
  }, []);
  useEffect(() => {
    const loadFacialDb = async () => {
      const envVarsWithPrefix = {};
      for (const key in process.env) {
        if (key.startsWith("REACT_APP_USER_")) {
          envVarsWithPrefix[key.replace("REACT_APP_USER_", "")] =
            process.env[key];
        }
      }
      return envVarsWithPrefix;
    };

    const fetchFacialDb = async () => {
      try {
        const loadedFacialDb = await loadFacialDb();
        setFacialDb(loadedFacialDb);
      } catch (error) {
        console.error("Lỗi khi tải cơ sở dữ liệu khuôn mặt:", error);
      }
    };

    fetchFacialDb();
  }, []);
  const toggleWebcam = async () => {
    if (webcamEnabled) {
      const tracks = streamRef.current?.getTracks();
      tracks?.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      streamRef.current = null;
      setWebcamEnabled(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setWebcamEnabled(true);
      } catch (err) {
        console.error("Không thể bật webcam:", err);
      }
    }
  };

  useEffect(() => {
    let video = videoRef.current;
    if (video) {
      const getVideo = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          video.srcObject = stream;
          await video.play();
        } catch (err) {
          console.error("Lỗi khi truy cập webcam:", err);
        }
      };
      getVideo();
    }
  }, []);
const [idleTimer, setIdleTimer] = useState(null);

  // Auto-analyze every 16 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      captureImage("analyze");
    }, 20000);

    return () => clearInterval(intervalId);
  }, [base64Image]);

useEffect(() => {
  if (idleTimer) clearTimeout(idleTimer);

  const timer = setTimeout(() => {
    captureImage("analyze"); // chỉ gọi khi không gõ gì sau 10s
  }, 10000); // 10 giây không gõ

  setIdleTimer(timer);

  return () => clearTimeout(timer);
}, [userInput]);


  // Update chat history
  useEffect(() => {
    if (isAnalyzed && analysis.length > 0) {
      const newMessages = analysis.map((message) => ({
        sender: "bot",
        text: message,
        timestamp: new Date().toLocaleTimeString(),
      }));
      setChatHistory((prev) => [...prev, ...newMessages]);
    }
  }, [analysis, isAnalyzed]);

  // Auto-scroll to bottom
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 100);
    }
  }, [chatHistory]);

  const captureImage = (task) => {
    if (task === "verify") {
      setIsVerified(null);
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Img = canvas.toDataURL("image/png");
    setBase64Image(base64Img);

    if (!base64Img || base64Img === "") {
      return;
    }

    if (task === "verify") {
      verify(base64Img);
    } else if (task === "analyze") {
      analyze(base64Img);
    }
  };

  const verify = async (base64Image) => {
    try {
      for (const key in facialDb) {
        const targetEmbedding = facialDb[key];
        console.log(
          `Kiểm tra ${key} với img2: ${targetEmbedding.substring(0, 30)}...`
        );
        const requestBody = JSON.stringify({
          model_name: facialRecognitionModel,
          detector_backend: faceDetector,
          distance_metric: distanceMetric,
          align: true,
          img1: base64Image,
          img2: targetEmbedding,
          enforce_detection: false,
          anti_spoofing: antiSpoofing,
        });

        console.log(`Gọi endpoint dịch vụ ${serviceEndpoint}/verify`);

        const response = await fetch(`${serviceEndpoint}/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: requestBody,
        });

        const data = await response.json();

        if (response.status !== 200) {
          console.log(data.error);
          setIsVerified(false);
          setChatHistory((prev) => [
            ...prev,
            {
              sender: "bot",
              text: "Không xác thực được",
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
          return;
        }

        if (data.verified === true) {
          setIsVerified(true);
          setIsAnalyzed(false);
          setChatHistory((prev) => [
            ...prev,
            {
              sender: "bot",
              text: `Xác thực thành công. Chào mừng ${key}`,
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
          break;
        }
      }

      if (isVerified === null) {
        setIsVerified(false);
        setChatHistory((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "Không xác thực được",
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Lỗi khi xác thực ảnh:", error);
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Lỗi trong quá trình xác thực",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  const analyze = async (base64Image) => {
    const result = [];
    setIsAnalyzed(false);
    try {
      const requestBody = JSON.stringify({
        detector_backend: faceDetector,
        align: true,
        img: base64Image,
        enforce_detection: false,
        anti_spoofing: antiSpoofing,
      });

      const response = await fetch(`${serviceEndpoint}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestBody,
      });

      const data = await response.json();

      if (response.status !== 200) {
        console.log(data.error);
        setChatHistory((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "Lỗi trong quá trình phân tích",
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        return;
      }

      for (const instance of data.results) {
        const emotionMessage =
          emotionMessages[instance.dominant_emotion] ||
          `Bạn đang cảm thấy ${instance.dominant_emotion} à?`;
        const summary = `${emotionMessage}`;
        console.log(summary);
        result.push(summary);
      }

      if (result.length > 0) {
        setIsAnalyzed(true);
        setIsVerified(null);
        setAnalysis(result);
      }
    } catch (error) {
      console.error("Lỗi khi phân tích ảnh:", error);
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Lỗi trong quá trình phân tích",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
    return result;
  };

  const handleSendMessage = async () => {
    if (userInput.trim()) {
      const question = userInput;

      setChatHistory((prev) => [
        ...prev,
        {
          sender: "user",
          text: question,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      setUserInput("");
      const botReply = await askBot(question);

      const baseDelay = 0;

      const extraDelay = Math.min(Math.floor(botReply.length / 30) * 500, 3000);

      const totalDelay = baseDelay + extraDelay;

      setTimeout(() => {
        setChatHistory((prev) => [
          ...prev,
          {
            sender: "bot",
            text: botReply,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }, totalDelay);
    }
  };

  const handleLogin = () => {
    navigate("/login");
    // captureImage('verify');
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser({ email: "", password: "", id: 0 });
  };
  const handleClickAvatar = () => {
    console.log("click avatar");
    navigate("/profile");
  };

  //state record
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleRecordAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordTime(0);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        clearInterval(timerRef.current);
        setIsRecording(false);

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.webm");

        const response = await fetch("http://localhost:8080/api/audio", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (data.text) {
          const question = data.text;

          setChatHistory((prev) => [
            ...prev,
            {
              sender: "user",
              text: question,
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);

          const botReply = await askBot(data.text);

          const baseDelay = 1000;

          const extraDelay = Math.min(
            Math.floor(botReply.length / 30) * 500,
            5000
          );

          const totalDelay = baseDelay + extraDelay;

          setTimeout(() => {
            // speakText(botReply);
            setChatHistory((prev) => [
              ...prev,
              {
                sender: "bot",
                text: botReply,
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
          }, totalDelay);
        }
      };

      mediaRecorder.start();

      // Bắt đầu bộ đếm giây
      timerRef.current = setInterval(() => {
        setRecordTime((prev) => {
          if (prev >= 10) {
            mediaRecorder.stop(); // Auto stop sau 10s
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Lỗi ghi âm:", err);
      setIsRecording(false);
    }
  };
  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop();
  };
  const speakText = async (text) => {
    const response = await fetch(
      `http://localhost:8080/api/tts?q=${encodeURIComponent(text)}`
    );
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
  };

  const toggleTTS = () => setTTSEnabled((prev) => !prev);
  const streamRef = useRef(null);

  useEffect(() => {
    if (ttsEnabled && chatHistory.length > 0) {
      const last = chatHistory[chatHistory.length - 1];
      if (last.sender === "bot") {
        const utterance = new SpeechSynthesisUtterance(last.text);
        utterance.lang = "vi-VN";
        // window.speechSynthesis.speak(utterance);
        speakText(last.text);
      }
    }
  }, [chatHistory]);

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-logo">
            <span>EMOTI</span>
          </div>

          {user && user.email ? (
            <div className="header-actions">
              <div className="header-avatar" onClick={handleClickAvatar}></div>
              <button className="auth-btn logout-btn" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="header-actions">
              <button className="auth-btn login-btn" onClick={handleLogin}>
                Đăng nhập
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="container">
        {/* Chat Panel */}
        <div className="chat-container">
          <div className="chat-panel">
            <div className="chat-header">
              <h1>DeepFace Chatbot</h1>
              <div className="chat-header-controls">
                <button
                  className={`icon-btn ${ttsEnabled ? "active" : ""}`}
                  onClick={toggleTTS}
                >
                  🔊
                </button>
                <button
                  className={`icon-btn ${webcamEnabled ? "active" : ""}`}
                  onClick={toggleWebcam}
                >
                  📷
                </button>
              </div>
            </div>

            <div className="chat-messages" ref={chatContainerRef}>
              {chatHistory.length === 0 && (
                <div className="chat-empty">Bắt đầu trò chuyện nào!</div>
              )}
              {chatHistory.map((msg, index) => (
                <div
                  key={index}
                  className={`chat-message ${
                    msg.sender === "user" ? "user" : "bot"
                  }`}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <div
                    className={`avatar ${
                      msg.sender === "user" ? "user" : "bot"
                    }`}
                  >
                    {msg.sender === "user" ? "U" : "B"}
                  </div>
                  <div className="bubble">
                    <p>{msg.text}</p>
                    <p className="timestamp">{msg.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            {isRecording && (
              <div className="recording-status">
                🎙️ Đang ghi âm: {recordTime}s
                <button className="stop-btn" onClick={handleStopRecording}>
                  Dừng
                </button>
              </div>
            )}
            <div className="chat-input">
              <div className="input-container">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Nhập tin nhắn..."
                />
                <button onClick={handleSendMessage}>Gửi</button>
                <button className="mic-btn" onClick={handleRecordAudio}>
                  🎤
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Webcam Panel */}
        <div className="webcam-panel">
          {/* <div className="webcam-container">
            <video ref={videoRef} autoPlay muted />
            <div className="webcam-live">Live</div>
          </div> */}
          <div className={`webcam-panel ${webcamEnabled ? "" : "hidden"}`}>
            <div className="webcam-container">
              <video ref={videoRef} autoPlay muted />
              <div className="webcam-live">Live</div>
            </div>
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          EMOTI CHATBOT{" "}
          <a href="https://x.ai" target="_blank" rel="noopener noreferrer">
            xAI
          </a>{" "}
          © 2025
        </p>
      </footer>
    </div>
  );
}

export default ChatPage;
