const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 5001;

const MYSQL_HOST = process.env.MYSQL_HOST || 'mysql';
const MYSQL_PORT = parseInt(process.env.MYSQL_PORT || '3306');
const MYSQL_USER = process.env.MYSQL_USER || 'voteuser';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || 'votepass';
const MYSQL_DB = process.env.MYSQL_DB || 'votesdb';

let pool;

async function connectMySQL(retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      pool = mysql.createPool({
        host: MYSQL_HOST,
        port: MYSQL_PORT,
        user: MYSQL_USER,
        password: MYSQL_PASSWORD,
        database: MYSQL_DB,
        waitForConnections: true,
        connectionLimit: 5,
      });
      const conn = await pool.getConnection();
      conn.release();
      console.log(`[result] Connected to MySQL on attempt ${i + 1}`);
      return;
    } catch (err) {
      console.log(`[result] MySQL not ready (${err.message}), retrying in 2s...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error('Could not connect to MySQL');
}

async function getVotes() {
  try {
    const [rows] = await pool.execute(
      "SELECT vote, COUNT(*) as count FROM votes GROUP BY vote"
    );
    const enjoying = rows.find(r => r.vote === 'enjoying')?.count || 0;
    const not_enjoying = rows.find(r => r.vote === 'not_enjoying')?.count || 0;
    const total = Number(enjoying) + Number(not_enjoying);
    return {
      enjoying: Number(enjoying),
      not_enjoying: Number(not_enjoying),
      total,
      pct_enjoying: total > 0 ? Math.round((enjoying / total) * 100) : 0,
      pct_not: total > 0 ? Math.round((not_enjoying / total) * 100) : 0
    };
  } catch (err) {
    console.error('[result] DB query error:', err.message);
    return { enjoying: 0, not_enjoying: 0, total: 0, pct_enjoying: 0, pct_not: 0 };
  }
}

app.get('/votes', async (req, res) => {
  const data = await getVotes();
  res.json(data);
});

app.get('/', (req, res) => {
  res.send(getHTML());
});

function getHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Results — DevOps with Satyam</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0a0a0f;
      --surface: #12121a;
      --card: #1a1a28;
      --border: #2a2a40;
      --accent-a: #00e5ff;
      --accent-b: #ff1744;
      --accent-c: #76ff03;
      --text: #e8e8f0;
      --muted: #6a6a8a;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Space Mono', monospace;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
    }

    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image:
        linear-gradient(rgba(0,229,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,229,255,0.04) 1px, transparent 1px);
      background-size: 40px 40px;
      animation: gridMove 20s linear infinite;
      pointer-events: none;
    }
    @keyframes gridMove {
      0% { background-position: 0 0; }
      100% { background-position: 40px 40px; }
    }

    .blob {
      position: fixed;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.1;
      pointer-events: none;
      animation: float 8s ease-in-out infinite;
    }
    .blob-1 { width: 400px; height: 400px; background: var(--accent-a); top: -100px; right: -100px; }
    .blob-2 { width: 300px; height: 300px; background: var(--accent-b); bottom: -80px; left: -80px; animation-delay: -4s; }
    @keyframes float {
      0%,100% { transform: translate(0,0); }
      50% { transform: translate(20px, 15px); }
    }

    body::after {
      content: '';
      position: fixed;
      inset: 0;
      background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
      pointer-events: none;
      z-index: 999;
    }

    .container {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 720px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 28px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--card);
      border: 1px solid var(--border);
      padding: 6px 16px;
      border-radius: 100px;
      font-size: 11px;
      color: var(--accent-c);
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .badge-dot {
      width: 6px; height: 6px;
      background: var(--accent-c);
      border-radius: 50%;
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%,100% { opacity:1; transform:scale(1); }
      50% { opacity:0.4; transform:scale(0.8); }
    }

    .title {
      font-family: 'Syne', sans-serif;
      font-size: clamp(26px, 4vw, 42px);
      font-weight: 800;
      text-align: center;
      background: linear-gradient(135deg, var(--accent-a), #a78bfa, var(--accent-b));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1.2;
    }

    .results-card {
      width: 100%;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 36px 32px;
      position: relative;
      overflow: hidden;
    }
    .results-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, var(--accent-a), #a78bfa, var(--accent-b));
    }

    .total-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
    }
    .total-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 2px; }
    .total-count {
      font-family: 'Syne', sans-serif;
      font-size: 36px;
      font-weight: 800;
      color: var(--text);
    }
    .last-updated { font-size: 10px; color: var(--muted); }

    .vote-row {
      margin-bottom: 24px;
    }
    .vote-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .vote-label {
      font-family: 'Syne', sans-serif;
      font-size: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .vote-stats {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .vote-count { font-size: 22px; font-weight: 700; }
    .vote-pct { font-size: 13px; color: var(--muted); }

    .bar-track {
      width: 100%;
      height: 12px;
      background: var(--surface);
      border-radius: 100px;
      overflow: hidden;
      border: 1px solid var(--border);
    }
    .bar-fill {
      height: 100%;
      border-radius: 100px;
      transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .bar-enjoying { background: linear-gradient(90deg, #005f73, var(--accent-a)); }
    .bar-not { background: linear-gradient(90deg, #5f0020, var(--accent-b)); }

    .divider {
      height: 1px;
      background: var(--border);
      margin: 24px 0;
    }

    .footer-links {
      display: flex;
      gap: 20px;
      align-items: center;
    }
    .footer-links a {
      color: var(--muted);
      text-decoration: none;
      font-size: 11px;
      letter-spacing: 1px;
      text-transform: uppercase;
      transition: color 0.2s;
    }
    .footer-links a:hover { color: var(--accent-a); }
    .footer-sep { color: var(--border); }

    #status { font-size: 10px; color: var(--accent-c); }
  </style>
</head>
<body>
  <div class="blob blob-1"></div>
  <div class="blob blob-2"></div>

  <div class="container">
    <div class="badge">
      <span class="badge-dot"></span>
      Live Results
    </div>

    <h1 class="title">Learning DevOps<br/>with Satyam</h1>

    <div class="results-card">
      <div class="total-row">
        <div>
          <div class="total-label">Total Votes Cast</div>
          <div class="total-count" id="total">—</div>
        </div>
        <div style="text-align:right;">
          <div class="last-updated">Auto-updates every 2s</div>
          <div id="status">connecting...</div>
        </div>
      </div>

      <div class="vote-row">
        <div class="vote-header">
          <div class="vote-label" style="color: var(--accent-a)">🚀 Enjoying</div>
          <div class="vote-stats">
            <span class="vote-count" id="cnt-enjoying" style="color:var(--accent-a)">0</span>
            <span class="vote-pct" id="pct-enjoying">0%</span>
          </div>
        </div>
        <div class="bar-track">
          <div class="bar-fill bar-enjoying" id="bar-enjoying" style="width:0%"></div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="vote-row">
        <div class="vote-header">
          <div class="vote-label" style="color: var(--accent-b)">😤 Not Enjoying</div>
          <div class="vote-stats">
            <span class="vote-count" id="cnt-not" style="color:var(--accent-b)">0</span>
            <span class="vote-pct" id="pct-not">0%</span>
          </div>
        </div>
        <div class="bar-track">
          <div class="bar-fill bar-not" id="bar-not" style="width:0%"></div>
        </div>
      </div>
    </div>

    <div class="footer-links">
      <a href="http://localhost:8080" target="_blank">← Cast Your Vote</a>
      <span class="footer-sep">|</span>
      <a href="#">Built with Docker</a>
      <span class="footer-sep">|</span>
      <a href="#">Satyam DevOps</a>
    </div>
  </div>

  <script>
    async function fetchVotes() {
      try {
        const res = await fetch('/votes');
        const d = await res.json();
        document.getElementById('total').textContent = d.total;
        document.getElementById('cnt-enjoying').textContent = d.enjoying;
        document.getElementById('cnt-not').textContent = d.not_enjoying;
        document.getElementById('pct-enjoying').textContent = d.pct_enjoying + '%';
        document.getElementById('pct-not').textContent = d.pct_not + '%';
        document.getElementById('bar-enjoying').style.width = d.pct_enjoying + '%';
        document.getElementById('bar-not').style.width = d.pct_not + '%';
        document.getElementById('status').textContent = '● live';
        document.getElementById('status').style.color = 'var(--accent-c)';
      } catch(e) {
        document.getElementById('status').textContent = '○ reconnecting...';
        document.getElementById('status').style.color = 'var(--accent-b)';
      }
    }
    fetchVotes();
    setInterval(fetchVotes, 2000);
  </script>
</body>
</html>`;
}

connectMySQL().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[result] Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('[result] Fatal:', err.message);
  process.exit(1);
});
