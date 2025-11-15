require('dotenv').config();
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 5000;
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10) || 10;

// Middleware
app.use(cors({
    origin: 'http://localhost:3000', // React dev server
    methods: 'GET,POST',
    credentials: true,
}));
app.use(bodyParser.json());

// MySQL Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    multipleStatements: true 
});

db.connect(err => {
    if (err) {
        console.error('--- MYSQL CONNECTION FAILED ---');
        console.error(err.code, err.message);
        return;
    }
    console.log('Connected to MySQL as id ' + db.threadId);
});

// ------------------- UTILITY FUNCTIONS -------------------

// Function to format the threads for the frontend
const formatThread = (row, type) => ({
    id: row.id,
    type: type, // 'post' or 'job'
    title: row.title,
    author: row.name, // Fetched from users table
    time: row.created_at, // Will be formatted on the frontend
    tag: row.tag,
    body: row.body,
    reactions: 0 // Mock reaction count
});

// ------------------- ROUTES -------------------

// POST /api/register
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required' });

    try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const SQL_INSERT = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        db.query(SQL_INSERT, [name, email, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ message: 'Email already exists.' });
                }
                console.error(err);
                return res.status(500).json({ message: 'Database error during registration.' });
            }
            res.status(201).json({ message: 'Account created successfully!', userId: result.insertId });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const SQL_FIND_USER = 'SELECT id, name, email, password FROM users WHERE email = ?';
    db.query(SQL_FIND_USER, [email], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error during login.' });
        if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials.' });

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);

        if (match) {
            // Include user ID in the response
            res.status(200).json({ message: 'Login successful!', user: { id: user.id, name: user.name, email: user.email } });
        } else {
            res.status(401).json({ message: 'Invalid credentials.' });
        }
    });
});

// GET /api/threads - Fetches all posts and jobs
app.get('/api/threads', (req, res) => {
    // SQL to fetch posts and jobs along with the author's name
    const SQL_FETCH_POSTS = `
        SELECT p.*, u.name FROM posts p
        JOIN users u ON p.user_id = u.id;
    `;
    const SQL_FETCH_JOBS = `
        SELECT j.*, u.name FROM jobs j
        JOIN users u ON j.user_id = u.id;
    `;

    db.query(SQL_FETCH_POSTS + SQL_FETCH_JOBS, (err, results) => {
        if (err) {
            console.error("Database error fetching threads:", err);
            return res.status(500).json({ message: 'Failed to fetch community threads.' });
        }

        const posts = results[0].map(row => formatThread(row, 'post'));
        const jobs = results[1].map(row => formatThread(row, 'job'));

        const allThreads = [...posts, ...jobs].sort((a, b) => 
            new Date(b.time) - new Date(a.time) // Sort by creation date (newest first)
        );

        res.status(200).json(allThreads);
    });
});

// POST /api/threads - Creates a new post or job
app.post('/api/threads', (req, res) => {
    // FIX: Ensure userId is an integer before insertion
    const userId = parseInt(req.body.userId, 10); 
    const { postType, postContent, postCategory } = req.body;
    
    // Basic validation and User ID check
    if (!userId || isNaN(userId) || !postType || !postContent || !postCategory) {
        console.error("Missing fields or Invalid userId:", { userId, postType, postContent, postCategory });
        return res.status(400).json({ message: 'Missing required fields for thread creation or invalid User ID.' });
    }

    const title = postContent.substring(0, 50) + (postContent.length > 50 ? '...' : '');

    let SQL_INSERT;
    let table;
    
    if (postType === 'post') {
        table = 'posts';
        SQL_INSERT = `INSERT INTO posts (user_id, title, body, tag) VALUES (?, ?, ?, ?)`;
    } else if (postType === 'job') {
        table = 'jobs';
        SQL_INSERT = `INSERT INTO jobs (user_id, title, body, tag) VALUES (?, ?, ?, ?)`;
    } else {
        return res.status(400).json({ message: 'Invalid post type specified.' });
    }

    db.query(SQL_INSERT, [userId, title, postContent, postCategory], (err, result) => {
        if (err) {
            // FIX: Enhanced error logging and user reporting for Foreign Key issues
            console.error(`--- Database error inserting into ${table} ---`);
            console.error("MySQL Error:", err.code, err.message);
            
            let userMessage = 'Failed to create thread.';
            
            if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
                userMessage = 'Error: The user ID is invalid or does not exist in the database. Please log in again.';
            } else if (err.code === 'ER_DATA_TOO_LONG') {
                 userMessage = 'Error: Content is too long. Please shorten your post.';
            }
            
            return res.status(500).json({ message: userMessage });
        }
        
        // Fetch the newly created thread data (including author name) for the frontend
        const SQL_FETCH_NEW = `
            SELECT t.*, u.name FROM ${table} t
            JOIN users u ON t.user_id = u.id
            WHERE t.id = ?;
        `;
        
        db.query(SQL_FETCH_NEW, [result.insertId], (fetchErr, fetchResults) => {
             if (fetchErr) {
                console.error("Error fetching new thread details:", fetchErr);
                return res.status(201).json({ message: 'Thread created successfully, but failed to return full details.' });
            }

            const newThread = formatThread(fetchResults[0], postType);
            res.status(201).json({ message: 'Thread created successfully!', thread: newThread });
        });
    });
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));