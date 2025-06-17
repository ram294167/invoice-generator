const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
app.use(bodyParser.json({ limit: '20mb' }));
app.use(cookieParser());
app.use(express.static('public'));

const USERS_FILE = './users.json';
const INVOICE_DIR = './invoices';
// Register a new user
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

  const users = JSON.parse(fs.readFileSync(USERS_FILE));

  if (users.find(u => u.username === username)) {
    return res.status(409).json({ error: 'User already exists' });
  }

  users.push({ username, password });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

  res.status(201).json({ success: true });
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync(USERS_FILE));
  const valid = users.find(u => u.username === username && u.password === password);
  if (valid) {
    res.cookie('user', username, { httpOnly: true });
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid' });
  }
});

// Check current user
app.get('/api/me', (req, res) => {
  if (req.cookies.user) res.json({ user: req.cookies.user });
  else res.status(401).json({ error: 'Not logged in' });
});

// Save PDF
app.post('/api/save-pdf', (req, res) => {
  const user = req.cookies.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { filename, base64 } = req.body;
  const folder = path.join(INVOICE_DIR, user);
  const filePath = path.join(folder, filename);

  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  const buffer = Buffer.from(base64, 'base64');
  fs.writeFileSync(filePath, buffer);

  res.json({ success: true });
});
app.get('/api/invoices', (req, res) => {
  const user = req.cookies.user;
  if (!user) return res.status(403).json({ error: 'Unauthorized' });

  const dir = path.join(__dirname, 'invoices', user);
  if (!fs.existsSync(dir)) return res.json([]);

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));
  res.json(files);
});
app.get('/api/download/:filename', (req, res) => {
  const user = req.cookies.user;
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'invoices', user, filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send('File not found');
  }
});
app.get('/api/view/:filename', (req, res) => {
  const user = req.cookies.user;
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'invoices', user, filename);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath); // ✅ This allows inline viewing
  } else {
    res.status(404).send('File not found');
  }
});
app.delete('/api/delete/:filename', (req, res) => {
  const user = req.cookies.user;
  const filename = req.params.filename;

  if (!user) return res.status(401).send('Unauthorized');

  const filePath = path.join(__dirname, 'invoices', user, filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.status(200).json({ message: 'Invoice deleted' });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});




app.listen(3000, () => console.log('Running on http://localhost:3000'));
