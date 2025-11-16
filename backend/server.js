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
    user_id: row.user_id,
    authorName: row.name,
    tag: row.tag,
    title: row.title,
    content: row.content,
    type: type, // 'post' or 'job'
    created_at: row.created_at,
    // Add other fields as needed
});


// ------------------- ENDPOINTS -------------------

// Registration endpoint
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const SQL_INSERT = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';

        db.query(SQL_INSERT, [name, email, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ message: 'Email already in use.' });
                }
                console.error("Database error during registration:", err);
                return res.status(500).json({ message: 'Registration failed due to a server error.' });
            }
            res.status(201).json({ message: 'Registration successful!', userId: result.insertId });
        });

    } catch (e) {
        console.error("Bcrypt hashing error:", e);
        res.status(500).json({ message: 'Server error during password processing.' });
    }
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    const SQL_FIND_USER = 'SELECT * FROM users WHERE email = ?';
    db.query(SQL_FIND_USER, [email], async (err, results) => {
        if (err) {
            console.error("Database error during login:", err);
            return res.status(500).json({ message: 'Login failed due to a server error.' });
        }
        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const user = results[0];
        try {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                // Successful login
                res.status(200).json({ 
                    message: 'Login successful!', 
                    userId: user.id, 
                    userName: user.name,
                    userEmail: user.email 
                });
            } else {
                // Password does not match
                res.status(401).json({ message: 'Invalid email or password.' });
            }
        } catch (e) {
            console.error("Bcrypt comparison error:", e);
            res.status(500).json({ message: 'Server error during password verification.' });
        }
    });
});

// Fetch all threads (posts and jobs)
app.get('/api/threads', (req, res) => {
    const SQL_FETCH_POSTS = `
        SELECT p.id, p.user_id, p.tag, p.title, p.content, p.created_at, u.name 
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        LIMIT 20
    `;
    
    const SQL_FETCH_JOBS = `
        SELECT j.id, j.user_id, j.tag, j.title, j.content, j.created_at, u.name 
        FROM jobs j
        JOIN users u ON j.user_id = u.id
        ORDER BY j.created_at DESC
        LIMIT 20
    `;

    db.query(SQL_FETCH_POSTS, (errPosts, resultsPosts) => {
        if (errPosts) {
            console.error("Database error fetching posts:", errPosts);
            return res.status(500).json({ message: 'Database error fetching posts.' });
        }

        db.query(SQL_FETCH_JOBS, (errJobs, resultsJobs) => {
            if (errJobs) {
                console.error("Database error fetching jobs:", errJobs);
                return res.status(500).json({ message: 'Database error fetching jobs.' });
            }

            const posts = resultsPosts.map(p => formatThread(p, 'post'));
            const jobs = resultsJobs.map(j => formatThread(j, 'job'));

            // Combine and sort all threads by creation date
            const allThreads = [...posts, ...jobs].sort((a, b) => 
                new Date(b.created_at) - new Date(a.created_at)
            );

            res.status(200).json(allThreads);
        });
    });
});

// Create new thread (post or job)
app.post('/api/threads', (req, res) => {
    const { user_id, type, tag, title, content } = req.body;
    if (!user_id || !type || !tag || !title || !content) {
        return res.status(400).json({ message: 'Missing required fields for thread creation.' });
    }

    let SQL_INSERT;
    let params;

    if (type === 'post') {
        SQL_INSERT = 'INSERT INTO posts (user_id, tag, title, content) VALUES (?, ?, ?, ?)';
        params = [user_id, tag, title, content];
    } else if (type === 'job') {
        SQL_INSERT = 'INSERT INTO jobs (user_id, tag, title, content) VALUES (?, ?, ?, ?)';
        params = [user_id, tag, title, content];
    } else {
        return res.status(400).json({ message: 'Invalid thread type.' });
    }

    db.query(SQL_INSERT, params, (err, result) => {
        if (err) {
            console.error(`Database error creating ${type}:`, err);
            return res.status(500).json({ message: `Failed to create ${type}.` });
        }

        res.status(201).json({ 
            message: `${type} created successfully!`, 
            id: result.insertId,
            tag,
            title,
            content
        });
    });
});

// Create a new response (reply)
app.post('/api/responses', (req, res) => {
    const { user_id, thread_type, thread_id, content, parent_response_id = null } = req.body;
    if (!user_id || !thread_type || !thread_id || !content) {
        return res.status(400).json({ message: 'Missing required fields for response creation.' });
    }

    // Determine the correct foreign key column name
    const threadKey = thread_type === 'post' ? 'post_id' : 'job_id';

    const SQL_INSERT_RESPONSE = `
        INSERT INTO responses (user_id, ${threadKey}, content, parent_response_id) 
        VALUES (?, ?, ?, ?)
    `;

    db.query(SQL_INSERT_RESPONSE, [user_id, thread_id, content, parent_response_id], (err, result) => {
        if (err) {
            console.error("Database error creating response:", err);
            return res.status(500).json({ message: 'Failed to create response.' });
        }

        res.status(201).json({ 
            message: 'Response created successfully!', 
            id: result.insertId,
            user_id,
            content
        });
    });
});


// Fetch responses for a specific thread
// UPDATED: Fetches parent author name
app.get('/api/responses/:threadType/:threadId', (req, res) => {
    const { threadType, threadId } = req.params;
    const threadIdInt = parseInt(threadId, 10);

    if (!['post', 'job'].includes(threadType) || isNaN(threadIdInt)) {
        return res.status(400).json({ message: 'Invalid thread type or ID.' });
    }

    const threadKey = threadType === 'post' ? 'post_id' : 'job_id';

    // UPDATED: LEFT JOIN the responses table (r2) and users table (u2) to get the parent response's author name
    const SQL_FETCH_RESPONSES = `
        SELECT 
            r.*, 
            u.name,
            u2.name AS parent_author_name 
        FROM responses r
        JOIN users u ON r.user_id = u.id  
        LEFT JOIN responses r2 ON r.parent_response_id = r2.id -- Join to get the parent response
        LEFT JOIN users u2 ON r2.user_id = u2.id                 -- Join to get the parent response author's name
        WHERE r.${threadKey} = ?
        ORDER BY r.created_at ASC 
    `;

    db.query(SQL_FETCH_RESPONSES, [threadIdInt], (err, results) => {
        if (err) {
            console.error("Database error fetching responses:", err);
            return res.status(500).json({ message: 'Database error fetching responses.' });
        }
        res.status(200).json(results);
    });
});

// NEW ENDPOINT: GET /api/jobcounts - Fetches the total count of jobs for each category
app.get('/api/jobcounts', (req, res) => {
    // This query groups all rows in the 'jobs' table by the 'tag' column 
    // and counts the number of rows in each group.
    const SQL_FETCH_COUNTS = `
        SELECT tag, COUNT(*) AS count
        FROM jobs
        GROUP BY tag;
    `;

    db.query(SQL_FETCH_COUNTS, (err, results) => {
        if (err) {
            console.error("Database error fetching job counts:", err);
            return res.status(500).json({ message: 'Database error fetching job counts.' });
        }
        
        // Results will be an array of objects like: [{ tag: 'Full-Time', count: 5 }, ...]
        res.status(200).json(results);
    });
});


// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});