import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css"; // dùng lại CSS đã có

function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!email || !password || !confirmPass) {

      alert("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (password !== confirmPass) {
      alert("Mật khẩu không khớp.");
      return;
    }
    const response = await fetch("http://localhost:8080/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (data.error) {
      alert(data.error);
      return;
    }
    // Giả lập lưu thông tin (bạn nên kết nối API backend tại đây)
    localStorage.setItem("user", email);
    alert("Đăng ký thành công!");
    navigate("/login");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Chào mừng đến với Emoti!</h2>
        <p className="subtitle">Tạo tài khoản để bắt đầu trò chuyện.</p>

        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Nhập lại mật khẩu"
          value={confirmPass}
          onChange={(e) => setConfirmPass(e.target.value)}
        />

        <button onClick={handleRegister}>Đăng ký</button>

        <div className="switch-mode">
          Đã có tài khoản?
          <span onClick={() => navigate("/login")}>Đăng nhập</span>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
