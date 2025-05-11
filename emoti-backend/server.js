const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require("multer");
dotenv.config();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

// Kết nối SQLite
const db = new sqlite3.Database('./emoti.db', (err) => {
  if (err) {
    console.error('SQLite error:', err.message);
  } else {
    console.log('SQLite connected');
    // Tạo bảng users
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);
    // Tạo bảng messages
    db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);
  }
});

// Hàm kiểm tra email/password
const checkCredentials = (email, password, callback) => {
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return callback(err);
    if (!user) return callback(null, false);
    const isMatch = await bcrypt.compare(password, user.password);
    callback(null, isMatch ? user : false);
  });
};

// API Đăng ký
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Thiếu email hoặc password' });

    // Kiểm tra email tồn tại
    db.get('SELECT email FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) return res.status(500).json({ error: 'Lỗi server' });
      if (row) return res.status(400).json({ error: 'Email đã tồn tại' });

      const hashedPassword = await bcrypt.hash(password, 10);
      db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], function(err) {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json({ success: true, message: 'Đăng ký thành công' });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// API Đăng nhập
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Thiếu email hoặc password' });

    checkCredentials(email, password, (err, user) => {
      if (err) return res.status(500).json({ error: 'Lỗi server' });
      if (!user) return res.status(401).json({ error: 'Email hoặc password sai' });
      res.json({ success: true, message: 'Đăng nhập thành công', userId: user.id });
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// API Lấy tin nhắn
app.get('/api/messages', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Thiếu email hoặc password' });

    checkCredentials(email, password, (err, user) => {
      if (err) return res.status(500).json({ error: 'Lỗi server' });
      if (!user) return res.status(401).json({ error: 'Email hoặc password sai' });

      db.all('SELECT id, userId, content, timestamp FROM messages WHERE userId = ? ORDER BY timestamp ASC', [user.id], (err, messages) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json(messages);
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// API Gửi tin nhắn
app.post('/api/messages', async (req, res) => {
  try {
    const { email, password, content } = req.body;
    if (!email || !password || !content) return res.status(400).json({ error: 'Thiếu email, password hoặc nội dung tin nhắn' });

    checkCredentials(email, password, (err, user) => {
      if (err) return res.status(500).json({ error: 'Lỗi server' });
      if (!user) return res.status(401).json({ error: 'Email hoặc password sai' });

      db.run('INSERT INTO messages (userId, content) VALUES (?, ?)', [user.id, content], function(err) {
        if (err) return res.status(500).json({ error: 'Lỗi server' });

        const message = { id: this.lastID, userId: user.id, content, timestamp: new Date() };
        res.json({ success: true, message });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});
const removeDiacritics = (str) =>
  str
    .normalize('NFD')                       // Tách các dấu
    .replace(/[\u0300-\u036f]/g, '')        // Xóa dấu
    .replace(/đ/g, 'd')                     // Chuẩn hóa đ -> d
    .replace(/Đ/g, 'd')                     // Chuẩn hóa Đ -> d
    .replace(/[^\w\s]/gi, '')               // Xóa ký tự đặc biệt, giữ chữ/số/khoảng trắng
    .toLowerCase();


app.get('/api/search', (req, res) => {
  const query = req.query.q || "";

  console.log("Query:", query);
  
  db.all(
    `SELECT question, answer FROM qa`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      // Tìm câu gần giống nhất bằng remove dấu và so khớp fuzzy
      const matches = rows.map(row => {
        return {
          question: row.question,
          answer: row.answer,
          cleaned: removeDiacritics(row.question),
        };
      });

      const best = matches.find(m => m.cleaned.includes(query));
      
      if (best) {
        return res.json({
          answer: best.answer,
          matched_question: best.question,
          original_query: query,
        });
      }

      return res.json({
        answer: "Xin lỗi, tôi chưa hiểu câu hỏi đó 😥",
        matched_question: null,
        original_query: query,
      });
    }
  );
});



const upload = multer({
  dest: path.join(__dirname, "uploads/"),
  limits: { fileSize: 10 * 1024 * 1024 }, // max 10MB
});



app.post("/api/audio", upload.single("file"), async (req, res) => {
  try {
    const webmPath = req.file.path;
    const wavPath = `${webmPath}.wav`;

    // Chuyển webm => wav (sử dụng ffmpeg)
    const ffmpegCmd = `ffmpeg -i ${webmPath} -ac 1 -ar 16000 -f wav ${wavPath}`;
    exec(ffmpegCmd, (ffmpegErr) => {
      if (ffmpegErr) {
        console.error("FFmpeg error:", ffmpegErr);
        return res.status(500).json({ error: "Chuyển đổi audio lỗi" });
      }

      // Gọi Python để nhận diện
      const pythonCmd = `python3 recognize.py ${wavPath}`;
      exec(pythonCmd, (pyErr, stdout, stderr) => {
        // Dọn file
        fs.unlinkSync(webmPath);
        fs.unlinkSync(wavPath);

        if (pyErr) {
          console.error("Python error:", pyErr);
          return res.status(500).json({ error: "Python xử lý lỗi" });
        }

        try {
          const result = JSON.parse(stdout);
          if (result.text) return res.json({ text: result.text });
          else return res.status(400).json({ error: "Không nhận diện được" });
        } catch (e) {
          return res.status(500).json({ error: "Lỗi khi phân tích kết quả" });
        }
      });
    });
  } catch (err) {
    console.error("Lỗi xử lý ghi âm:", err);
    res.status(500).json({ error: "Lỗi tổng quát" });
  }
});

app.get('/api/tts', async (req, res) => {
  const text = req.query.q;
  if (!text) return res.status(400).json({ error: 'Thiếu nội dung' });

  const id = uuidv4();
  const outputPath = path.join(__dirname, 'tts', `${id}.mp3`);

  const cmd = `python3 tts.py "${text}" "${outputPath}"`;

  exec(cmd, (err) => {
    if (err) {
      console.error('TTS error:', err);
      return res.status(500).json({ error: 'TTS thất bại' });
    }

    res.download(outputPath, 'tts.mp3', () => {
      fs.unlink(outputPath, () => {}); // Xóa file sau khi gửi
    });
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));