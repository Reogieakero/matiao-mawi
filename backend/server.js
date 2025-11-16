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

// MySQL Connection - IMPORTANT: Configure your environment variables (.env file)
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
    reactions: 0, // Mock reaction count
    responseCount: row.response_count || 0, 
});

const formatResponse = (row) => ({
    id: row.id,
    author: row.name, // CRITICAL: Fetched from the JOIN operation
    content: row.content,
    time: row.created_at,
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
            res.status(200).json({ message: 'Login successful!', user: { id: user.id, name: user.name, email: user.email } });
        } else {
            res.status(401).json({ message: 'Invalid credentials.' });
        }
    });
});

// GET /api/threads - Fetches all posts and jobs with response count
app.get('/api/threads', (req, res) => {
    const SQL_FETCH_POSTS = `
        SELECT p.*, u.name, CAST(COUNT(r.id) AS UNSIGNED) AS response_count 
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN responses r ON p.id = r.post_id
        GROUP BY p.id
    `;
    const SQL_FETCH_JOBS = `
        SELECT j.*, u.name, CAST(COUNT(r.id) AS UNSIGNED) AS response_count 
        FROM jobs j
        JOIN users u ON j.user_id = u.id
        LEFT JOIN responses r ON j.id = r.job_id
        GROUP BY j.id
    `;

    db.query(`${SQL_FETCH_POSTS};${SQL_FETCH_JOBS}`, (err, results) => {
        if (err) {
            console.error("Database error fetching threads:", err);
            return res.status(500).json({ message: 'Failed to fetch community threads.' });
        }

        const posts = results[0].map(row => formatThread(row, 'post'));
        const jobs = results[1].map(row => formatThread(row, 'job'));

        const allThreads = [...posts, ...jobs].sort((a, b) => 
            new Date(b.time) - new Date(a.time) 
        );

        res.status(200).json(allThreads);
    });
});

// POST /api/threads - Creates a new post or job 
app.post('/api/threads', (req, res) => {
    const userId = parseInt(req.body.userId, 10); 
    const { postType, postContent, postCategory } = req.body;
    
    if (!userId || isNaN(userId) || !postType || !postContent || !postCategory) {
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
        
        const SQL_FETCH_NEW = `
            SELECT t.*, u.name, 0 AS response_count FROM ${table} t
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

// POST /api/responses - Creates a new response
app.post('/api/responses', (req, res) => {
    const threadId = parseInt(req.body.threadId, 10);
    // User ID is assumed to come from a session/JWT in a production app, but here it's from the body
    const userId = parseInt(req.body.userId, 10); 
    const { threadType, content } = req.body;

    if (!userId || isNaN(userId) || !threadId || isNaN(threadId) || !threadType || !content) {
        return res.status(400).json({ message: 'Missing required fields for response or invalid IDs.' });
    }
    
    let threadKey;
    
    if (threadType === 'post') {
        threadKey = 'post_id';
    } else if (threadType === 'job') {
        threadKey = 'job_id';
    } else {
        return res.status(400).json({ message: 'Invalid thread type specified for response. Must be "post" or "job".' });
    }

    const SQL_INSERT_RESPONSE = `
        INSERT INTO responses (user_id, ${threadKey}, content) VALUES (?, ?, ?)
    `;

    db.query(SQL_INSERT_RESPONSE, [userId, threadId, content], (err, result) => {
        if (err) {
            console.error(`--- Database error inserting response into responses table ---`);
            console.error("MySQL Error:", err.code, err.message);
            
            let userMessage = 'Failed to submit response.';
            if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
                userMessage = `Error: The associated ${threadType} or User ID is invalid. Please ensure you are logged in and the thread exists.`;
            }
            
            return res.status(500).json({ message: userMessage });
        }
        
        res.status(201).json({ message: 'Response submitted successfully!', responseId: result.insertId });
    });
});

// GET /api/responses/:threadType/:threadId - Fetches responses with author name
app.get('/api/responses/:threadType/:threadId', (req, res) => {
    const { threadType, threadId } = req.params;
    const threadIdInt = parseInt(threadId, 10);

    if (!['post', 'job'].includes(threadType) || isNaN(threadIdInt)) {
        return res.status(400).json({ message: 'Invalid thread type or ID.' });
    }

    const threadKey = threadType === 'post' ? 'post_id' : 'job_id';

    const SQL_FETCH_RESPONSES = `
        SELECT r.*, u.name 
        FROM responses r
        JOIN users u ON r.user_id = u.id  -- CRITICAL JOIN: Links the response to the user who wrote it
        WHERE r.${threadKey} = ?
        ORDER BY r.created_at DESC
    `;

    db.query(SQL_FETCH_RESPONSES, [threadIdInt], (err, results) => {
        if (err) {
            console.error("Database error fetching responses:", err);
            return res.status(500).json({ message: 'Failed to fetch responses.' });
        }
        
        const responses = results.map(formatResponse);
        res.status(200).json(responses);
    });
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));