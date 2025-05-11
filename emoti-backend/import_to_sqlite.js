// import_to_sqlite.js
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const qaData = require('./chatbot_qa_10k.json');

const db = new sqlite3.Database('emoti.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS qa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL
  )`);

  const stmt = db.prepare("INSERT INTO qa (question, answer) VALUES (?, ?)");
  for (const [question, answer] of Object.entries(qaData)) {
    stmt.run(question, answer);
  }
  stmt.finalize();
});

db.close();
