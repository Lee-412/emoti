import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<ChatPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />

    </Routes>
  );
}

export default App;
