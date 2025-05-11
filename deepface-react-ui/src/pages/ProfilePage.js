import React, { useEffect, useState } from "react";
import "./ProfilePage.css";
import { useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  ArcElement,
  Tooltip,
  Legend
);

function ProfilePage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error("Lỗi khi đọc user từ localStorage");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const now = new Date();
  const twentySecondsAgo = new Date(now.getTime() - 20000).toLocaleString(
    "vi-VN",
    {
      hour12: false,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  );

  const fakeStatsById = {
    1: {
      messages: 12,
      emotions: { happy: 1231, sad: 312, neutral: 323 },
      lastLogin: twentySecondsAgo,
    },
    2: {
      messages: 33,
      emotions: { happy: 12, sad: 15, neutral: 45 },
      lastLogin: twentySecondsAgo,
    },
    3: {
      messages: 1,
      emotions: { happy: 3, sad: 3, neutral: 2 },
      lastLogin: twentySecondsAgo,
    },
  };

  const stats =
    user && fakeStatsById[user.id] ? fakeStatsById[user.id] : fakeStatsById[1];

  const emotionChart = {
    labels: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5"],
    datasets: [
      {
        label: "Happy",
        data: [5, 15, 30, 25, 40],
        borderColor: "#10b981",
        fill: false,
      },
      {
        label: "Sad",
        data: [10, 20, 15, 5, 8],
        borderColor: "#ef4444",
        fill: false,
      },

         {
        label: "Neutral",
        data: [10, 15, 25, 17, 23],
        borderColor: "#6366f1",
        fill: false,
      },
    ],
  };
  const emotionPieChart = {
    labels: ["Happy", "Sad", "Neutral"],
    datasets: [
      {
        label: "Phân tích cảm xúc",
        data: [
          stats.emotions.happy,
          stats.emotions.sad,
          stats.emotions.neutral,
        ],
        backgroundColor: ["#10b981", "#ef4444", "#6366f1"],
        borderColor: ["#10b981", "#ef4444", "#6366f1"],
        borderWidth: 1,
      },
    ],
  };
  const pieOptions = {
    plugins: {
      legend: {
        position: "bottom", // Đưa xuống dưới
        align: "center", // Căn giữa theo chiều ngang
        labels: {
          boxWidth: 13,
          padding: 5,
        },
      },
    },
    maintainAspectRatio: false,
  };
  const handleClickChatbot = () => {
    navigate("/");
  };
  return (
    <div className="profile-wrapper">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-logo">
            <span>EMOTI</span>
          </div>
          {user && user.email ? (
            <div className="header-actions">
              <div className="header-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <button
                className="auth-btn logout-btn"
                onClick={handleClickChatbot}
              >
                chatbot
              </button>
              <button className="auth-btn logout-btn" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          ) : (
            <button
              className="auth-btn login-btn"
              onClick={() => navigate("/login")}
            >
              Đăng nhập
            </button>
          )}
        </div>
      </header>

      {/* Profile content */}
      <div className="profile-header">
        <div className="avatar">
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="user-info">
          <h2>{user?.email}</h2>
        </div>
      </div>
      <div className="profile-base-info">
        <div
          className="profile-stats"
          style={{ display: "flex", flexDirection: "column" }}
        >
          <div className="stat-card-box">
            <h3>Tin nhắn</h3>
            <p>{stats.messages}</p>
          </div>

          <div className="stat-card-box">
            <h3>Lần cuối đăng nhập</h3>
            <p>{stats.lastLogin}</p>
          </div>
        </div>
        <div className="stat-card chart-card">
          <h3>Phân tích cảm xúc</h3>
          <div className="pie-container">
            <Pie data={emotionPieChart} options={pieOptions} />
          </div>
        </div>
      </div>

      <div>

        <div className="profile-chart">
          <h3 className="chart-title">Biến động cảm xúc theo thời gian</h3>
          <div className="line-chart-container">
            <Line data={emotionChart} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
