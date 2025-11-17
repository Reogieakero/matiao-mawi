require('dotenv').config();
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 5000;
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10) || 10;

app.use(cors({
    origin: 'http://localhost:3000', 
    methods: 'GET,POST',
    credentials: true,
}));
app.use(bodyParser.json());

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


const formatThread = (row, type) => ({
    id: row.id,
    type: type, 
    title: row.title,
    author: row.name, 
    time: row.created_at, 
    tag: row.tag,
    body: row.body,
    reactions: 0, 
    responseCount: row.response_count || 0,
    isBookmarked: row.is_bookmarked || false,
    bookmarked_at: row.bookmarked_at || null,
});

const formatResponse = (row) => ({
    id: row.id,
    author: row.name, 
    content: row.content,
    time: row.created_at,
    parent_id: row.parent_id,
    parent_author: row.parent_author_name,
});



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

app.post('/api/responses', (req, res) => {
    const threadId = parseInt(req.body.threadId, 10);
    const userId = parseInt(req.body.userId, 10);
    const parentResponseId = req.body.parentResponseId ? parseInt(req.body.parentResponseId, 10) : null;
    const { threadType, content } = req.body;

    if (!userId || isNaN(userId) || !threadId || isNaN(threadId) || !threadType || !content) {
         return res.status(400).json({ message: 'Missing required fields for response creation.' });
    }

    const threadKey = threadType === 'post' ? 'post_id' : (threadType === 'job' ? 'job_id' : null);

    if (!threadKey) {
        return res.status(400).json({ message: 'Invalid thread type specified.' });
    }
    
    const SQL_INSERT = `INSERT INTO responses (user_id, ${threadKey}, content, parent_id) VALUES (?, ?, ?, ?)`;

    db.query(SQL_INSERT, [userId, threadId, content, parentResponseId], (err, result) => {
        if (err) {
            console.error("Database error inserting response:", err);
            
            let userMessage = 'Failed to submit response.';
            if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                userMessage = `Error: The associated ${threadType}, User ID, or parent response ID is invalid.`;
            }
            return res.status(500).json({ message: userMessage });
        }
        res.status(201).json({ message: 'Response submitted successfully!', responseId: result.insertId });
    });
});

app.get('/api/responses/:threadType/:threadId', (req, res) => {
    const { threadType, threadId } = req.params;
    const threadIdInt = parseInt(threadId, 10);

    if (!['post', 'job'].includes(threadType) || isNaN(threadIdInt)) {
        return res.status(400).json({ message: 'Invalid thread type or ID.' });
    }

    const threadKey = threadType === 'post' ? 'post_id' : 'job_id';

    const SQL_FETCH_RESPONSES = `
        SELECT r.*, u.name, pr_u.name AS parent_author_name
        FROM responses r
        JOIN users u ON r.user_id = u.id -- Author of the current response
        LEFT JOIN responses pr ON r.parent_id = pr.id -- Parent response (optional)
        LEFT JOIN users pr_u ON pr.user_id = pr_u.id -- Author of the parent response
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


app.get('/api/job-category-counts', (req, res) => {
    const SQL_FETCH_COUNTS = `
        SELECT tag, COUNT(id) AS count
        FROM jobs
        GROUP BY tag
    `;

    db.query(SQL_FETCH_COUNTS, (err, results) => {
        if (err) {
            console.error("Database error fetching job category counts:", err);
            return res.status(500).json({ message: 'Failed to fetch job category counts.' });
        }
        res.status(200).json(results);
    });
});

app.post('/api/bookmarks', (req, res) => {
    const userId = parseInt(req.body.userId, 10);
    const threadId = parseInt(req.body.threadId, 10);
    const threadType = req.body.threadType;

    if (!userId || isNaN(userId) || !threadId || isNaN(threadId) || !['post', 'job'].includes(threadType)) {
        return res.status(400).json({ message: 'Invalid or missing fields for bookmark operation.' });
    }

    const threadKey = threadType === 'post' ? 'post_id' : 'job_id';
    
    const SQL_CHECK = `SELECT id FROM bookmarks WHERE user_id = ? AND ${threadKey} = ?`;
    
    db.query(SQL_CHECK, [userId, threadId], (err, results) => {
        if (err) {
            console.error("Database error checking bookmark status:", err);
            return res.status(500).json({ message: 'Failed to check bookmark status.' });
        }

        if (results.length > 0) {

            const bookmarkId = results[0].id;
            const SQL_DELETE = 'DELETE FROM bookmarks WHERE id = ?';

            db.query(SQL_DELETE, [bookmarkId], (deleteErr) => {
                if (deleteErr) {
                    console.error("Database error deleting bookmark:", deleteErr);
                    return res.status(500).json({ message: 'Failed to unsave thread.' });
                }
                res.status(200).json({ message: 'Thread unsaved successfully.', bookmarked: false });
            });
        } else {

            const SQL_INSERT = `INSERT INTO bookmarks (user_id, ${threadKey}) VALUES (?, ?)`;
            db.query(SQL_INSERT, [userId, threadId], (insertErr) => {
                if (insertErr) {

                    console.error("Database error inserting bookmark:", insertErr);
                    let userMessage = 'Failed to save thread.';
                    if (insertErr.code === 'ER_NO_REFERENCED_ROW_2') {
                        userMessage = `Error: The associated ${threadType} or User ID is invalid.`;
                    }
                    return res.status(500).json({ message: userMessage });
                }
                res.status(201).json({ message: 'Thread saved successfully.', bookmarked: true });
            });
        }
    });
});

app.get('/api/bookmarks/:userId', (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) return res.status(400).json({ message: 'Invalid User ID.' });

    const SQL_FETCH_BOOKMARKS = `
        (
            SELECT 
                p.id, 
                'post' AS type, 
                p.title, 
                u.name, 
                p.created_at, 
                p.tag, 
                p.body, 
                b.created_at AS bookmarked_at,
                (SELECT COUNT(r.id) FROM responses r WHERE r.post_id = p.id) AS response_count
            FROM bookmarks b
            JOIN posts p ON b.post_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE b.user_id = ? AND b.job_id IS NULL
        )
        UNION ALL
        (
            SELECT 
                j.id, 
                'job' AS type, 
                j.title, 
                u.name, 
                j.created_at, 
                j.tag, 
                j.body, 
                b.created_at AS bookmarked_at,
                (SELECT COUNT(r.id) FROM responses r WHERE r.job_id = j.id) AS response_count
            FROM bookmarks b
            JOIN jobs j ON b.job_id = j.id
            JOIN users u ON j.user_id = u.id
            WHERE b.user_id = ? AND b.post_id IS NULL
        )
        ORDER BY bookmarked_at DESC
    `;

    db.query(SQL_FETCH_BOOKMARKS, [userId, userId], (err, results) => {
        if (err) {
            console.error("Database error fetching bookmarks:", err);
            return res.status(500).json({ message: 'Failed to fetch saved threads.' });
        }
        
        const savedThreads = results.map(row => formatThread(row, row.type));
        res.status(200).json(savedThreads);
    });
});


app.get('/api/search', (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: 'Search query is required.' });

    const searchPattern = `%${q}%`;

    const SQL_SEARCH_POSTS = `
        SELECT p.id, 'post' AS type, p.title, u.name, p.created_at, p.tag, p.body,
        CAST(COUNT(r.id) AS UNSIGNED) AS response_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN responses r ON p.id = r.post_id
        WHERE p.title LIKE ? OR p.body LIKE ?
        GROUP BY p.id
    `;
    const SQL_SEARCH_JOBS = `
        SELECT j.id, 'job' AS type, j.title, u.name, j.created_at, j.tag, j.body,
        CAST(COUNT(r.id) AS UNSIGNED) AS response_count
        FROM jobs j
        JOIN users u ON j.user_id = u.id
        LEFT JOIN responses r ON j.id = r.job_id
        WHERE j.title LIKE ? OR j.body LIKE ?
        GROUP BY j.id
    `;

    db.query(`${SQL_SEARCH_POSTS};${SQL_SEARCH_JOBS}`, 
        [searchPattern, searchPattern, searchPattern, searchPattern], 
        (err, results) => {
        if (err) {
            console.error("Database error fetching search results:", err);
            return res.status(500).json({ message: 'Failed to fetch search results.' });
        }

        // results is an array of two arrays: [posts_results, jobs_results]
        const posts = results[0].map(row => formatThread(row, 'post'));
        const jobs = results[1].map(row => formatThread(row, 'job'));

        const allResults = [...posts, ...jobs].sort((a, b) => 
            new Date(b.time) - new Date(a.time) 
        );

        res.status(200).json(allResults);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});