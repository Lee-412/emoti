import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setpassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return;
     const response = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (data.error) {
      alert(data.error);
      return;
    }
    console.log("check data", data);
    const id = data.userId;
    localStorage.setItem('user', JSON.stringify({ email, password, id }));

    navigate('/');
  };

  const handleClickSignup = async () => {
   
    navigate('/signup');
    setIsSignup(isSignup);
    setEmail('');
    setpassword('');
  }
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>{isSignup ? 'Chào mừng đến với EmotiChat 🎉' : 'Chào mừng trở lại! 👋'}</h2>
        <p className="subtitle">
          {isSignup
            ? 'Tạo tài khoản mới để bắt đầu trò chuyện cảm xúc.'
            : 'Đăng nhập để tiếp tục kết nối cùng EmotiChat.'}
        </p>

        <input
          type="email"
          placeholder="Địa chỉ email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="Password"
          value={password}
          onChange={(e) => setpassword(e.target.value)}
        />

        <button onClick={handleSubmit}>
          {isSignup ? 'Đăng ký' : 'Đăng nhập'}
        </button>

        <p className="switch-mode">
          Chưa có tài khoản?
          <span onClick={handleClickSignup}>
            Tạo tài khoản
          </span>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
