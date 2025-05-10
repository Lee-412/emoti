import React, { useRef, useEffect, useState } from 'react';
import './App.css';
import { askBot } from './chat';

function App() {
  const facialRecognitionModel = process.env.REACT_APP_FACE_RECOGNITION_MODEL || "Facenet";
  const faceDetector = process.env.REACT_APP_FACE_DETECTOR || "opencv";
  const distanceMetric = process.env.REACT_APP_DISTANCE_METRIC || "cosine";

  const serviceEndpoint = process.env.REACT_APP_SERVICE_ENDPOINT;
  const antiSpoofing = process.env.REACT_APP_ANTI_SPOOFING === "1";

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  const [base64Image, setBase64Image] = useState('');
  
  const [isVerified, setIsVerified] = useState(null);
  const [identity, setIdentity] = useState(null);

  const [isAnalyzed, setIsAnalyzed] = useState(null);
  const [analysis, setAnalysis] = useState([]);

  const [facialDb, setFacialDb] = useState({});

  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);



  // Emotion mapping to friendly Vietnamese messages
  const emotionMessages = {
    sad: "Trông bạn có vẻ buồn thế, bạn cần tôi giúp gì không?",
    happy: "Hôm nay có chuyện gì mà bạn vui thế?",
    angry: "Bạn đang tức giận à?",
    neutral: "Bạn có vẻ tốt, chúc bạn một ngày tốt lành, bạn muốn nói chuyện gì không?",
    surprise: "Sao bạn có vẻ ngạc nhiên vậy?",
    fear: "Trông bạn có vẻ nhợt nhạt quá, bạn đang sợ hãi điều gì vậy?",
    disgust: "Trông bạn như đang khinh bỉ điều gì đó, tôi à, hay một chuyện gì khác?",
  };

  useEffect(() => {
    const loadFacialDb = async () => {
      const envVarsWithPrefix = {};
      for (const key in process.env) {
        if (key.startsWith("REACT_APP_USER_")) {
          envVarsWithPrefix[key.replace("REACT_APP_USER_", "")] = process.env[key];
        }
      }
      return envVarsWithPrefix;
    };
  
    const fetchFacialDb = async () => {
      try {
        const loadedFacialDb = await loadFacialDb();
        setFacialDb(loadedFacialDb);
      } catch (error) {
        console.error('Lỗi khi tải cơ sở dữ liệu khuôn mặt:', error);
      }
    };
  
    fetchFacialDb();
  }, []);

  useEffect(() => {
    let video = videoRef.current;
    if (video) {
      const getVideo = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          video.srcObject = stream;
          await video.play();
        } catch (err) {
          console.error("Lỗi khi truy cập webcam:", err);
        }
      };
      getVideo();
    }
  }, []);

  // Auto-analyze every 12 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      captureImage('analyze');
    }, 16000); // 12 seconds

    return () => clearInterval(intervalId);
  }, [base64Image]);

  // Update chat history and auto-scroll
  useEffect(() => {
    if (isAnalyzed && analysis.length > 0) {
      const newMessages = analysis.map(message => ({
        sender: 'bot',
        text: message,
        timestamp: new Date().toLocaleTimeString(),
      }));
      setChatHistory(prev => [...prev, ...newMessages]);
    }

  }, [analysis, isAnalyzed]);

  const captureImage = (task) => {
    if (task === 'verify') {
      setIsVerified(null);
      setIdentity(null);
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Img = canvas.toDataURL('image/png');
    setBase64Image(base64Img);

    if (!base64Img || base64Img === '') {
      return;
    }

    if (task === 'verify') {
      verify(base64Img);
    } else if (task === 'analyze') {
      analyze(base64Img);
    }
  };
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      // Delay nhỏ để đảm bảo tin nhắn đã render xong
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 100);
    }
  }, [chatHistory]);
  const verify = async (base64Image) => {
    try {
      for (const key in facialDb) {
        const targetEmbedding = facialDb[key];
        console.log(`Kiểm tra ${key} với img2: ${targetEmbedding.substring(0, 30)}...`);
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
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: requestBody,
        });

        const data = await response.json();

        if (response.status !== 200) {
          console.log(data.error);
          setIsVerified(false);
          setChatHistory(prev => [...prev, {
            sender: 'bot',
            text: 'Không xác thực được',
            timestamp: new Date().toLocaleTimeString(),
          }]);
          return;
        }

        if (data.verified === true) {
          setIsVerified(true);
          setIsAnalyzed(false);
          setIdentity(key);
          setChatHistory(prev => [...prev, {
            sender: 'bot',
            text: `Xác thực thành công. Chào mừng ${key}`,
            timestamp: new Date().toLocaleTimeString(),
          }]);
          break;
        }
      }

      if (isVerified === null) {
        setIsVerified(false);
        setChatHistory(prev => [...prev, {
          sender: 'bot',
          text: 'Không xác thực được',
          timestamp: new Date().toLocaleTimeString(),
        }]);
      }
    } catch (error) {
      console.error('Lỗi khi xác thực ảnh:', error);
      setChatHistory(prev => [...prev, {
        sender: 'bot',
        text: 'Lỗi trong quá trình xác thực',
        timestamp: new Date().toLocaleTimeString(),
      }]);
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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      const data = await response.json();

      if (response.status !== 200) {
        console.log(data.error);
        setChatHistory(prev => [...prev, {
          sender: 'bot',
          text: 'Lỗi trong quá trình phân tích',
          timestamp: new Date().toLocaleTimeString(),
        }]);
        return;
      }

      for (const instance of data.results) {
        const emotionMessage = emotionMessages[instance.dominant_emotion] || `Bạn đang cảm thấy ${instance.dominant_emotion} à?`;
        const summary = ` ${emotionMessage}`;
        console.log(summary);
        result.push(summary);
      }

      if (result.length > 0) {
        setIsAnalyzed(true);
        setIsVerified(null);
        setAnalysis(result);
      }
    } catch (error) {
      console.error('Lỗi khi phân tích ảnh:', error);
      setChatHistory(prev => [...prev, {
        sender: 'bot',
        text: 'Lỗi trong quá trình phân tích',
        timestamp: new Date().toLocaleTimeString(),
      }]);
    }
    return result;
  };

  const handleSendMessage = async () => {

  const question = userInput;

    setChatHistory(prev => [
      ...prev,
      { sender: 'user', text: question, timestamp: new Date().toLocaleTimeString() },
    ]);

    setUserInput('');

    const botReply = await askBot(question);

    setChatHistory(prev => [
      ...prev,
      { sender: 'bot', text: botReply, timestamp: new Date().toLocaleTimeString() },
    ]);
  };

  return (
    <div className="container">
      {/* Chat Panel */}
      <div className="chat-container">
        <div className="chat-panel">
          <div className="chat-header">
            <h1>DeepFace Chatbot</h1>
          </div>
          <div ref={chatContainerRef} className="chat-messages">
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`chat-message ${msg.sender === 'user' ? 'user' : 'bot'}`}
              >
                <div className={`avatar ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                  {msg.sender === 'user' ? 'U' : 'B'}
                </div>
                <div className="bubble">
                  <p>{msg.text}</p>
                  <p className="timestamp">{msg.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="chat-input">
        
            <div className="input-container">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Nhập tin nhắn..."
              />
              <button onClick={handleSendMessage}>Gửi</button>
            </div>
          </div>
        </div>
      </div>
      {/* Webcam Panel */}
      <div className="webcam-panel">
        <div className="webcam-container">
          <video ref={videoRef} autoPlay muted />
          <div className="webcam-live">Live</div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default App;