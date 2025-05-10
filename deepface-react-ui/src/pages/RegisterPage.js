import React from 'react';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
  const navigate = useNavigate();

  const handleRegister = () => {
    // TODO: gửi đăng ký
    navigate('/login');
  };

  return (
    <div className="auth-container">
      <h2>Đăng ký</h2>
      <input placeholder="Tên người dùng" />
      <input type="password" placeholder="Mật khẩu" />
      <input type="password" placeholder="Nhập lại mật khẩu" />
      <button onClick={handleRegister}>Đăng ký</button>
      <p>Đã có tài khoản? <a href="/login">Đăng nhập</a></p>
    </div>
  );
}

export default RegisterPage;
