const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3000;
const cors = require('cors');
app.use(cors());
app.use(express.json());
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'QP3tNKObrmTnkaA',
  database: 'facebook_backend',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
const JWT_SECRET = '@ManD@2001';
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Forbidden' });
    req.user = user;
    next();
  });
};
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error registering user' });
  }
});
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, userId: user.id });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});
app.delete('/posts/:id', authenticateToken, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  try {
    const [post] = await pool.execute('SELECT user_id FROM posts WHERE id = ?', [postId]);
    if (post.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (post[0].user_id !== userId) {
      return res.status(403).json({ message: 'You are not authorized to delete this post' });
    }
    await pool.execute('DELETE FROM posts WHERE id = ?', [postId]);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Error deleting post' });
  }
});
app.get('/users/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, username, email FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user' });
  }
});
app.get('/posts', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM posts');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching posts' });
  }
});
app.post('/posts', authenticateToken, async (req, res) => {
  const { content } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO posts (user_id, content) VALUES (?, ?)',
      [req.user.id, content]
    );
    res.status(201).json({ message: 'Post created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error creating post' });
  }
});
app.put('/posts/:id', authenticateToken, async (req, res) => {
  const { content } = req.body;
  try {
    const [result] = await pool.execute(
      'UPDATE posts SET content = ? WHERE id = ? AND user_id = ?',
      [content, req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(403).json({ message: 'Unauthorized or Post not found' });
    res.json({ message: 'Post updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error updating post' });
  }
});
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
