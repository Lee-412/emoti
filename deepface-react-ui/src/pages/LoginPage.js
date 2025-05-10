import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!email.trim() || !username.trim()) return;

    localStorage.setItem('user', username);
    localStorage.setItem('email', email);

    navigate('/');
  };

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
          placeholder="Tên người dùng"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <button onClick={handleSubmit}>
          {isSignup ? 'Đăng ký' : 'Đăng nhập'}
        </button>

        <p className="switch-mode">
          {isSignup ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
          <span onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? 'Đăng nhập ngay' : 'Tạo tài khoản'}
          </span>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
