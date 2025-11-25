require('dotenv').config();
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer'); 
const path = require('path'); 
const fs = require('fs');


const app = express();
const PORT = process.env.PORT || 5000;
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10) || 10;

app.use(cors({
    origin: 'http://localhost:3000', 
    methods: 'GET,POST,DELETE,PUT', // ⭐ MODIFIED: Added PUT to allowed methods for cancellation
    credentials: true,
}));
app.use(bodyParser.json());

// --- MULTER CONFIGURATION ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Generic storage configuration (used by /api/upload-media for posts/jobs)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// For Post/Job media upload 
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } 
}).single('media'); 

// Dedicated storage for PROFILE PICTURES
const profilePicStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const userId = req.params.userId || 'temp'; 
        cb(null, `profile-${userId}-${Date.now()}${ext}`);
    }
});

const profilePicUploader = multer({ 
    storage: profilePicStorage, 
    limits: { fileSize: 2 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
}).single('profile_picture'); 

// Dedicated storage for DOCUMENT REQUIREMENTS
const requirementsStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        // Use a distinct prefix for requirements
        cb(null, `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${ext}`);
    }
});

// Multer instance for multiple requirements files (max 5)
const requirementsUploader = multer({ 
    storage: requirementsStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for requirements!'), false);
        }
    }
}).array('requirements', 5); // 'requirements' is the field name, 5 is the max count


app.use('/media', express.static(uploadDir));

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


// Modified to include author_id and author_picture_url
const formatThread = (row, type) => {
    let mediaUrls = [];
    if (row.media_url) {
        try {
            mediaUrls = JSON.parse(row.media_url);
        } catch (e) {
            if (typeof row.media_url === 'string') {
                mediaUrls = [row.media_url];
            }
        }
    }
    
    return {
        id: row.id,
        type: type, 
        title: row.title,
        author: row.name, 
        author_id: row.user_id, 
        author_picture_url: row.profile_picture_url || '', 
        time: row.created_at, 
        tag: row.tag,
        body: row.body,
        reactions: 0, 
        responseCount: row.response_count || 0,
        isBookmarked: row.is_bookmarked || false,
        bookmarked_at: row.bookmarked_at || null,
        mediaUrls: mediaUrls || [],
        // ⭐ ADDED: Include contact number for jobs
        contactNumber: row.contact_number || null, 
    };
};

// Modified to include author_picture_url
const formatResponse = (row) => ({
    id: row.id,
    author: row.name, 
    author_picture_url: row.profile_picture_url || '', 
    content: row.content,
    time: row.created_at,
    parent_id: row.parent_id,
    parent_author: row.parent_author_name,
});

// --- API ENDPOINTS ---

app.post('/api/upload-media', (req, res) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error("Multer Error:", err.message);
            return res.status(400).json({ message: `File upload failed: ${err.message}` });
        } else if (err) {
            console.error("Unknown Upload Error:", err);
            return res.status(500).json({ message: 'An unknown error occurred during file upload.' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file selected for upload.' });
        }

        const mediaUrls = [
            `http://localhost:${PORT}/media/${req.file.filename}`
        ];
        
        res.status(200).json({ 
            message: 'File uploaded successfully.', 
            mediaUrls: mediaUrls,
        });
    });
});

// NEW ENDPOINT: POST /api/upload-requirements
app.post('/api/upload-requirements', (req, res) => {
    requirementsUploader(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error("Multer Requirements Error:", err.message);
            return res.status(400).json({ message: `Requirements upload failed: ${err.message}` });
        } else if (err) {
            console.error("Unknown Requirements Upload Error:", err);
            return res.status(500).json({ message: err.message || 'An unknown error occurred during requirements upload.' });
        }

        if (!req.files || req.files.length === 0) {
            // Should be handled on the frontend if files are required, but a check here is safer.
            return res.status(200).json({ message: 'No files uploaded.', mediaUrls: [] });
        }
        
        // Map uploaded files to their accessible URLs
        const mediaUrls = req.files.map(file => 
            `http://localhost:${PORT}/media/${file.filename}`
        );
        
        res.status(200).json({ 
            message: `${req.files.length} requirements uploaded successfully.`, 
            mediaUrls: mediaUrls,
        });
    });
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

    // Modified SQL: Join user_profiles to get the profile_picture_url
    const SQL_FIND_USER = `
        SELECT u.id, u.name, u.email, u.password, up.profile_picture_url 
        FROM users u 
        LEFT JOIN user_profiles up ON u.id = up.user_id 
        WHERE u.email = ?
    `;
    
    db.query(SQL_FIND_USER, [email], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error during login.' });
        if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials.' });

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);

        if (match) {
            // Modified response: Include profilePictureUrl
            res.status(200).json({ 
                message: 'Login successful!', 
                user: { 
                    id: user.id, 
                    name: user.name, 
                    email: user.email,
                    profilePictureUrl: user.profile_picture_url || '' // Send the URL
                } 
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials.' });
        }
    });
});

// Modified SQL to include profile_picture_url in the thread fetch query
app.get('/api/threads', (req, res) => {
    const SQL_FETCH_POSTS = `
        SELECT 
            p.id, p.user_id, p.title, p.body, p.tag, p.created_at, p.media_url, 
            u.name, 
            up.profile_picture_url, 
            CAST(COUNT(r.id) AS UNSIGNED) AS response_count 
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id 
        LEFT JOIN responses r ON p.id = r.post_id
        GROUP BY p.id, p.user_id, p.title, p.body, p.tag, p.created_at, p.media_url, u.name, up.profile_picture_url 
    `;
    const SQL_FETCH_JOBS = `
        SELECT 
            j.id, j.user_id, j.title, j.body, j.tag, j.created_at, j.media_url, 
            u.name, 
            up.profile_picture_url, 
            CAST(COUNT(r.id) AS UNSIGNED) AS response_count 
        FROM jobs j
        JOIN users u ON j.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id 
        LEFT JOIN responses r ON j.id = r.job_id
        GROUP BY j.id, j.user_id, j.title, j.body, j.tag, j.created_at, j.media_url, u.name, up.profile_picture_url 
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

// NEW ENDPOINT: GET /api/user-threads/:userId - Fetch all posts and jobs created by a specific user
app.get('/api/user-threads/:userId', (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid User ID.' });
    }

    // Combine posts and jobs using UNION, filtered by the user_id
    const SQL_FETCH_USER_THREADS = `
        (
            SELECT 
                p.id, 
                'post' AS type, 
                p.title, 
                u.name, 
                p.user_id, 
                up.profile_picture_url,
                p.created_at, 
                p.tag, 
                p.body, 
                p.media_url, 
                NULL AS contact_number, /* Ensure the post branch has a contact_number field for UNION consistency */
                (SELECT COUNT(*) FROM responses WHERE post_id = p.id) AS response_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE p.user_id = ?
        )
        UNION ALL
        (
            SELECT 
                j.id, 
                'job' AS type, 
                j.title, 
                u.name, 
                j.user_id, 
                up.profile_picture_url,
                j.created_at, 
                j.tag, 
                j.body, 
                j.media_url, 
                j.contact_number, /* Include contact_number for jobs */
                (SELECT COUNT(*) FROM responses WHERE job_id = j.id) AS response_count
            FROM jobs j
            JOIN users u ON j.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE j.user_id = ?
        )
        ORDER BY created_at DESC;
    `;

    // Pass userId twice for the two SELECT statements in the UNION
    db.query(SQL_FETCH_USER_THREADS, [userId, userId], (err, results) => {
        if (err) {
            console.error("Database error fetching user threads:", err);
            return res.status(500).json({ message: 'Failed to fetch user threads.' });
        }
        
        // Use the existing formatThread helper function
        const userThreads = results.map(row => formatThread(row, row.type));
        res.status(200).json(userThreads);
    });
});

// ⭐ NEW ENDPOINT: DELETE /api/user-threads/:userId - Delete ALL posts and jobs by a user
app.delete('/api/user-threads/:userId', (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    // Use userId from body for an additional security check, matching the frontend logic
    const userIdFromBody = parseInt(req.body.userId, 10); 

    if (isNaN(userId) || isNaN(userIdFromBody) || userId !== userIdFromBody) {
        return res.status(400).json({ message: 'Invalid or inconsistent User ID.' });
    }

    // SQL statements use subqueries to find the IDs of threads the user owns, and then
    // delete responses/bookmarks related to those IDs.
    const SQL_DELETE_RESPONSES = `
        DELETE FROM responses 
        WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?) 
           OR job_id IN (SELECT id FROM jobs WHERE user_id = ?);
    `;
    const SQL_DELETE_BOOKMARKS = `
        DELETE FROM bookmarks 
        WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?) 
           OR job_id IN (SELECT id FROM jobs WHERE user_id = ?)
           OR user_id = ?; 
    `;
    // Note: Deleting a user's own bookmarks is also covered here, 
    // including those they made on *other* users' posts.
    // The previous logic for deleting responses also included deleting 
    // responses made by the user themselves on *other* posts. 
    // The current approach ensures that all children rows that reference the 
    // user's posts/jobs are deleted first, then the user's posts/jobs themselves.

    const SQL_DELETE_POSTS = `DELETE FROM posts WHERE user_id = ?`;
    const SQL_DELETE_JOBS = `DELETE FROM jobs WHERE user_id = ?`;

    db.beginTransaction(err => {
        if (err) {
            console.error("Transaction Begin Error:", err);
            return res.status(500).json({ message: 'Failed to start bulk thread deletion.' });
        }

        // 1. Delete all Responses tied to the user's threads
        db.query(SQL_DELETE_RESPONSES, [userId, userId], (err, responseResult) => {
            if (err) return db.rollback(() => {
                console.error("Database error deleting responses for user threads:", err);
                res.status(500).json({ message: 'Failed to delete responses for user threads.' });
            });

            // 2. Delete all Bookmarks tied to the user's threads or made by the user
            db.query(SQL_DELETE_BOOKMARKS, [userId, userId, userId], (err, bookmarkResult) => {
                if (err) return db.rollback(() => {
                    console.error("Database error deleting thread dependencies (bookmarks):", err);
                    res.status(500).json({ message: 'Failed to delete thread dependencies (bookmarks).' });
                });

                // 3. Delete all Posts (Parent Rows)
                db.query(SQL_DELETE_POSTS, [userId], (err, postsResult) => {
                    if (err) return db.rollback(() => {
                        console.error("Database error deleting all posts:", err);
                        res.status(500).json({ message: 'Failed to delete all posts.' });
                    });

                    // 4. Delete all Jobs (Parent Rows)
                    db.query(SQL_DELETE_JOBS, [userId], (err, jobsResult) => {
                        if (err) return db.rollback(() => {
                            console.error("Database error deleting all jobs:", err);
                            res.status(500).json({ message: 'Failed to delete all jobs.' });
                        });

                        const deletedCount = postsResult.affectedRows + jobsResult.affectedRows;

                        // 5. Commit Transaction
                        db.commit(commitErr => {
                            if (commitErr) return db.rollback(() => {
                                console.error("Transaction Commit Error:", commitErr);
                                res.status(500).json({ message: 'Failed to complete bulk thread deletion.' });
                            });
                            res.status(200).json({ message: `Successfully deleted ${deletedCount} threads.`, deletedCount: deletedCount });
                        });
                    });
                });
            });
        });
    });
});
// ⭐ END NEW ENDPOINT 

// Modified SQL: Join user_profiles to get the profile_picture_url in the thread fetch query after insertion
app.post('/api/threads', (req, res) => {
    // MODIFICATION 1: Destructure contactNumber from the request body
    const { userId, postContent, postType, postCategory, mediaUrls, contactNumber } = req.body; 

    if (!userId || isNaN(userId) || !postContent || !postType || !postCategory) {
        return res.status(400).json({ message: 'Missing required fields for thread creation.' });
    }
    
    const table = postType === 'post' ? 'posts' : 'jobs';
    const mediaUrlJson = mediaUrls && mediaUrls.length > 0 ? JSON.stringify(mediaUrls) : null;
    const title = postContent.length > 100 ? postContent.substring(0, 100) + '...' : postContent;
    
    let SQL_INSERT;
    let params;

    if (postType === 'post') {
        // MODIFICATION 2a: Standard POST INSERT statement (no contact_number)
        SQL_INSERT = `INSERT INTO ${table} (user_id, title, body, tag, media_url) VALUES (?, ?, ?, ?, ?)`;
        params = [userId, title, postContent, postCategory, mediaUrlJson];
    } else { // postType === 'job'
        // MODIFICATION 2b: JOB INSERT statement now includes contact_number
        if (!contactNumber) {
            return res.status(400).json({ message: 'Contact number is required for job posts.' });
        }
        SQL_INSERT = `INSERT INTO ${table} (user_id, title, body, tag, media_url, contact_number) VALUES (?, ?, ?, ?, ?, ?)`;
        params = [userId, title, postContent, postCategory, mediaUrlJson, contactNumber];
    }

    // MODIFICATION 3: Use the new parameterized query and parameters array
    db.query(SQL_INSERT, params, (err, result) => { 
        if (err) {
            console.error("Database error creating thread:", err);
            return res.status(500).json({ message: 'Failed to create thread.' });
        }

        // Fetch the newly created thread along with author name and profile picture URL
        // Modified SQL: Join user_profiles to get the profile_picture_url
        const SQL_FETCH_NEW = `
            SELECT t.*, u.name, up.profile_picture_url, 0 AS response_count 
            FROM ${table} t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id 
            WHERE t.id = ?;
        `;
        
        db.query(SQL_FETCH_NEW, [result.insertId], (fetchErr, fetchResults) => {
            if (fetchErr) {
                console.error("Error fetching new thread details:", fetchErr);
                return res.status(201).json({ message: 'Thread created successfully, but failed to return full details.' });
            }

            // formatThread now includes profile_picture_url
            const newThread = formatThread(fetchResults[0], postType);
            res.status(201).json({ message: 'Thread created successfully!', thread: newThread });
        });
    });
});

// FIXED ENDPOINT: DELETE /api/threads/:threadId - Delete a post or job (Uses transaction to delete child rows first)
app.delete('/api/threads/:threadId', (req, res) => {
    const threadId = parseInt(req.params.threadId, 10);
    const { threadType, userId } = req.body;

    if (isNaN(threadId) || !userId || isNaN(parseInt(userId, 10)) || !['post', 'job'].includes(threadType)) {
        return res.status(400).json({ message: 'Invalid or missing thread ID, user ID, or thread type.' });
    }

    const table = threadType === 'post' ? 'posts' : 'jobs';
    const threadKey = threadType === 'post' ? 'post_id' : 'job_id';

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ message: 'Failed to start deletion transaction.' });

        // 1. Delete associated responses
        const SQL_DELETE_RESPONSES = `DELETE FROM responses WHERE ${threadKey} = ?`;
        db.query(SQL_DELETE_RESPONSES, [threadId], (err) => {
            if (err) return db.rollback(() => {
                console.error("Database error deleting responses:", err);
                res.status(500).json({ message: 'Failed to delete associated responses.' });
            });

            // 2. Delete associated bookmarks
            const SQL_DELETE_BOOKMARKS = `DELETE FROM bookmarks WHERE ${threadKey} = ?`;
            db.query(SQL_DELETE_BOOKMARKS, [threadId], (err) => {
                if (err) return db.rollback(() => {
                    console.error("Database error deleting bookmarks:", err);
                    res.status(500).json({ message: 'Failed to delete associated bookmarks.' });
                });

                // 3. Delete the post/job itself, with user ownership check
                const SQL_DELETE_THREAD = `DELETE FROM ${table} WHERE id = ? AND user_id = ?`;
                db.query(SQL_DELETE_THREAD, [threadId, userId], (err, result) => {
                    if (err) return db.rollback(() => {
                        console.error("Database error deleting thread:", err);
                        res.status(500).json({ message: `Failed to delete ${threadType}.` });
                    });

                    if (result.affectedRows === 0) {
                        return db.rollback(() => { 
                            // This handles: threadId/userId mismatch OR the thread doesn't exist
                            res.status(403).json({ message: 'Thread could not be deleted. It may not exist, or you are not the author.' });
                        });
                    }

                    // 4. Commit Transaction
                    db.commit(commitErr => {
                        if (commitErr) return db.rollback(() => {
                            console.error("Transaction Commit Error:", commitErr);
                            res.status(500).json({ message: 'Failed to complete thread deletion.' });
                        });
                        res.status(200).json({ message: `${threadType} deleted successfully.`, deletedId: threadId });
                    });
                });
            });
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

    const SQL_INSERT = `
        INSERT INTO responses (user_id, ${threadKey}, content, parent_id) 
        VALUES (?, ?, ?, ?)
    `;

    db.query(SQL_INSERT, [userId, threadId, content, parentResponseId], (err, result) => {
        if (err) {
            console.error("Database error inserting response:", err);
            return res.status(500).json({ message: 'Failed to add response.' });
        }

        // Modified SQL: Join user_profiles to get the profile_picture_url 
        // and join responses again for parent author name
        const SQL_FETCH_NEW = `
            SELECT 
                r.*, 
                u.name, 
                up.profile_picture_url,
                parent_r.id AS parent_response_id,
                parent_u.name AS parent_author_name
            FROM responses r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN responses parent_r ON r.parent_id = parent_r.id
            LEFT JOIN users parent_u ON parent_r.user_id = parent_u.id
            WHERE r.id = ?
        `;

        db.query(SQL_FETCH_NEW, [result.insertId], (fetchErr, fetchResults) => {
            if (fetchErr) {
                console.error("Error fetching new response details:", fetchErr);
                return res.status(201).json({ message: 'Response created successfully, but failed to return full details.' });
            }
            
            res.status(201).json({ 
                message: 'Response added successfully!', 
                response: formatResponse(fetchResults[0])
            });
        });
    });
});

app.get('/api/responses/:threadType/:threadId', (req, res) => {
    const threadId = parseInt(req.params.threadId, 10);
    const threadType = req.params.threadType;

    if (isNaN(threadId) || !['post', 'job'].includes(threadType)) {
        return res.status(400).json({ message: 'Invalid thread ID or thread type.' });
    }

    const threadKey = threadType === 'post' ? 'post_id' : 'job_id';

    // Modified SQL: Join user_profiles to get the profile_picture_url 
    // and join responses again for parent author name
    const SQL_FETCH_RESPONSES = `
        SELECT 
            r.*, 
            u.name, 
            up.profile_picture_url,
            parent_r.id AS parent_response_id,
            parent_u.name AS parent_author_name
        FROM responses r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN responses parent_r ON r.parent_id = parent_r.id
        LEFT JOIN users parent_u ON parent_r.user_id = parent_u.id
        WHERE r.${threadKey} = ?
        ORDER BY r.created_at ASC
    `;

    db.query(SQL_FETCH_RESPONSES, [threadId], (err, results) => {
        if (err) {
            console.error("Database error fetching responses:", err);
            return res.status(500).json({ message: 'Failed to fetch responses.' });
        }
        
        // Format and return responses
        const formattedResponses = results.map(row => formatResponse(row));
        res.status(200).json(formattedResponses);
    });
});

app.get('/api/post-categories', (req, res) => {
    const SQL_FETCH_COUNTS = `
        SELECT tag, COUNT(id) AS count 
        FROM posts 
        GROUP BY tag
    `;
    db.query(SQL_FETCH_COUNTS, (err, results) => {
        if (err) {
            console.error("Database error fetching post category counts:", err);
            return res.status(500).json({ message: 'Failed to fetch post category counts.' });
        }
        res.status(200).json(results);
    });
});

app.get('/api/job-categories', (req, res) => {
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
        return res.status(400).json({ message: 'Missing required fields or invalid data.' });
    }

    const post_id = threadType === 'post' ? threadId : null;
    const job_id = threadType === 'job' ? threadId : null;

    // Check if the bookmark already exists
    const SQL_CHECK = `
        SELECT id FROM bookmarks 
        WHERE user_id = ? AND (post_id = ? OR job_id = ?)
    `;
    
    db.query(SQL_CHECK, [userId, post_id, job_id], (err, results) => {
        if (err) {
            console.error("Database error checking bookmark:", err);
            return res.status(500).json({ message: 'Failed to process bookmark.' });
        }

        if (results.length > 0) {
            // Bookmark exists, so delete it (unsave)
            const SQL_DELETE = 'DELETE FROM bookmarks WHERE id = ?';
            db.query(SQL_DELETE, [results[0].id], (deleteErr) => {
                if (deleteErr) {
                    console.error("Database error deleting bookmark:", deleteErr);
                    return res.status(500).json({ message: 'Failed to unsave thread.' });
                }
                res.status(200).json({ message: 'Thread unsaved successfully.', action: 'unsaved' });
            });
        } else {
            // Bookmark doesn't exist, so insert it (save)
            const SQL_INSERT = 'INSERT INTO bookmarks (user_id, post_id, job_id) VALUES (?, ?, ?)';
            db.query(SQL_INSERT, [userId, post_id, job_id], (insertErr) => {
                if (insertErr) {
                    console.error("Database error inserting bookmark:", insertErr);
                    return res.status(500).json({ message: 'Failed to save thread.' });
                }
                res.status(200).json({ message: 'Thread saved successfully.', action: 'saved' });
            });
        }
    });
});

app.get('/api/bookmarks/:userId', (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid User ID.' });
    }

    // Fetch bookmarked posts and jobs and combine them
    const SQL_FETCH_BOOKMARKS = `
        (
            SELECT 
                p.id, 
                'post' AS type, 
                p.title, 
                u.name, 
                p.user_id, 
                up.profile_picture_url,
                p.created_at, 
                p.tag, 
                p.body, 
                p.media_url, 
                NULL AS contact_number, /* Ensure the post branch has a contact_number field for UNION consistency */
                b.created_at AS bookmarked_at,
                (SELECT COUNT(r.id) FROM responses r WHERE r.post_id = p.id) AS response_count 
            FROM bookmarks b
            JOIN posts p ON b.post_id = p.id
            JOIN users u ON p.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE b.user_id = ? AND b.job_id IS NULL
        )
        UNION ALL
        (
            SELECT 
                j.id, 
                'job' AS type, 
                j.title, 
                u.name, 
                j.user_id, 
                up.profile_picture_url,
                j.created_at, 
                j.tag, 
                j.body, 
                j.media_url, 
                j.contact_number, /* Include contact_number for jobs */
                b.created_at AS bookmarked_at,
                (SELECT COUNT(r.id) FROM responses r WHERE r.job_id = j.id) AS response_count 
            FROM bookmarks b
            JOIN jobs j ON b.job_id = j.id
            JOIN users u ON j.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE b.user_id = ? AND b.post_id IS NULL
        )
        ORDER BY bookmarked_at DESC
    `;

    db.query(SQL_FETCH_BOOKMARKS, [userId, userId], (err, results) => {
        if (err) {
            console.error("Database error fetching bookmarks:", err);
            return res.status(500).json({ message: 'Failed to fetch saved threads.' });
        }

        // Add 'isBookmarked: true' property for client consistency
        const savedThreads = results.map(row => ({ 
            ...formatThread(row, row.type), 
            isBookmarked: true,
            bookmarked_at: row.bookmarked_at,
        }));

        res.status(200).json(savedThreads);
    });
});

// GET /api/threads/search?q=...&category=...&type=...
app.get('/api/search', (req, res) => {
    // The query 'q' comes from the URL: /api/search?q=search+term
    const { q } = req.query; 

    // If no search query is provided, return an empty array
    if (!q) {
        return res.status(200).json([]);
    }

    // Base query parts
    let searchConditions = [];
    let queryParams = [];

    // 1. Search term 'q' (Applies to both)
    if (q) {
        // Use LIKE operator for full text search on title and body
        const searchPattern = `%${q}%`;
        
        // Conditions for posts (p)
        searchConditions.push(`(p.title LIKE ? OR p.body LIKE ?)`);
        // Conditions for jobs (j)
        searchConditions.push(`(j.title LIKE ? OR j.body LIKE ?)`);
        
        // Query parameters for the two pairs of LIKE conditions
        queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    const postWhereClause = searchConditions[0] ? `WHERE ${searchConditions[0]}` : '';
    const jobWhereClause = searchConditions[1] ? `WHERE ${searchConditions[1]}` : '';

    // SQL to fetch matching POSTS
    const SQL_FETCH_POSTS = `
        SELECT 
            p.id, p.user_id, p.title, p.body, p.tag, p.created_at, p.media_url, 
            NULL AS contact_number, /* Ensure the post branch has a contact_number field for UNION consistency */
            u.name, 
            up.profile_picture_url, 
            CAST(COUNT(r.id) AS UNSIGNED) AS response_count,
            'post' AS thread_type
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id 
        LEFT JOIN responses r ON p.id = r.post_id
        ${postWhereClause}
        GROUP BY p.id
    `;
    
    // SQL to fetch matching JOBS
    const SQL_FETCH_JOBS = `
        SELECT 
            j.id, j.user_id, j.title, j.body, j.tag, j.created_at, j.media_url, 
            j.contact_number, /* Include contact_number for jobs */
            u.name, 
            up.profile_picture_url, 
            CAST(COUNT(r.id) AS UNSIGNED) AS response_count,
            'job' AS thread_type
        FROM jobs j
        JOIN users u ON j.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id 
        LEFT JOIN responses r ON j.id = r.job_id
        ${jobWhereClause}
        GROUP BY j.id
    `;
    
    // The final query uses UNION ALL to combine the results from both tables
    const FINAL_SQL_QUERY = `
        ${SQL_FETCH_POSTS}
        UNION ALL
        ${SQL_FETCH_JOBS}
        ORDER BY created_at DESC
    `;

    // Execute the combined query with the search parameters
    db.query(FINAL_SQL_QUERY, queryParams, (err, results) => {
        if (err) {
            console.error("Database error fetching search results:", err);
            return res.status(500).json({ message: 'Failed to fetch search results.' });
        }
        
        // Format all results into threads
        const allResults = results.map(row => formatThread(row, row.thread_type));
        
        // The front-end is responsible for checking bookmark status later
        res.status(200).json(allResults);
    });
});

// POST /api/profile/upload-picture/:userId
app.post('/api/profile/upload-picture/:userId', (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid User ID for profile picture upload.' });
    }

    // Use the dedicated profile picture uploader
    profilePicUploader(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error("Multer Profile Picture Error:", err.message);
            return res.status(400).json({ message: `File upload failed: ${err.message}` });
        } else if (err) {
            console.error("Unknown Upload Error:", err);
            return res.status(500).json({ message: err.message || 'An unknown error occurred during file upload.' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file selected for upload.' });
        }

        const profilePictureUrl = `http://localhost:${PORT}/media/${req.file.filename}`;

        // Use UPSERT to insert or update the profile picture URL
        const SQL_UPSERT_PROFILE_PIC = `
            INSERT INTO user_profiles (user_id, profile_picture_url)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE profile_picture_url = ?;
        `;
        
        db.query(SQL_UPSERT_PROFILE_PIC, [userId, profilePictureUrl, profilePictureUrl], (dbErr) => {
            if (dbErr) {
                console.error("Database error upserting profile picture URL:", dbErr);
                return res.status(500).json({ message: 'Failed to save profile picture URL to database.' });
            }

            res.status(200).json({ 
                message: 'Profile picture uploaded and saved successfully.', 
                profilePictureUrl: profilePictureUrl 
            });
        });
    });
});

// PUT /api/profile/:userId - Update user profile details
app.put('/api/profile/:userId', (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const { name, contact, address } = req.body;

    if (isNaN(userId) || !name) {
        return res.status(400).json({ message: 'Invalid User ID or missing Name.' });
    }

    // 1. Update user name in 'users' table
    const SQL_UPDATE_USER = 'UPDATE users SET name = ? WHERE id = ?';
    db.query(SQL_UPDATE_USER, [name, userId], (userErr) => {
        if (userErr) {
            console.error("Database error updating user name:", userErr);
            return res.status(500).json({ message: 'Failed to update user name.' });
        }

        // 2. Use UPSERT to insert or update profile details in 'user_profiles' table
        const SQL_UPSERT_PROFILE = `
            INSERT INTO user_profiles (user_id, contact, address)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE contact = ?, address = ?;
        `;
        
        db.query(SQL_UPSERT_PROFILE, [userId, contact, address, contact, address], (err) => {
            if (err) {
                console.error("Database error upserting profile data:", err);
                return res.status(500).json({ message: 'Failed to update profile details.' });
            }
            res.status(200).json({ message: 'Profile updated successfully.' });
        });
    });
});

// POST /api/document-application - Save application transaction
app.post('/api/document-application', (req, res) => {
    // requirementsMediaUrl is included in the body and will be passed to the database
    const { userId, documentName, purpose, fee, requirementsMediaUrl } = req.body;
    const status = 'Pending';

    if (!userId || !documentName || !purpose || fee === undefined || fee === null) {
        return res.status(400).json({ message: 'Missing required fields for document application.' });
    }

    // CRITICAL FIX: requirements_media_url is added to the INSERT list
    const SQL_INSERT_APPLICATION = `
        INSERT INTO document_transactions 
            (user_id, document_name, purpose, fee, requirements_media_url, status) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(SQL_INSERT_APPLICATION, [userId, documentName, purpose, fee, requirementsMediaUrl, status], (err, result) => {
        if (err) {
            console.error("Database error inserting application:", err);
            return res.status(500).json({ message: 'Failed to submit document application.' });
        }
        res.status(201).json({ message: 'Document application submitted successfully!', transactionId: result.insertId, status: status });
    });
});

// ⭐ CANCEL ROUTE: PUT /api/document-application/cancel/:transactionId
app.put('/api/document-application/cancel/:transactionId', (req, res) => {
    const transactionId = parseInt(req.params.transactionId, 10);
    const userId = parseInt(req.body.userId, 10); 

    if (isNaN(transactionId) || isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid Transaction ID or User ID.' });
    }

    // Update status to 'Cancelled' only if the current status is 'Pending' AND the user_id matches
    const SQL_CANCEL_APPLICATION = `
        UPDATE document_transactions 
        SET status = 'Cancelled' 
        WHERE id = ? AND user_id = ? AND status = 'Pending'
    `;
    
    db.query(SQL_CANCEL_APPLICATION, [transactionId, userId], (err, result) => {
        if (err) {
            console.error("Database error cancelling application:", err);
            return res.status(500).json({ message: 'Failed to cancel document application due to a database error.' });
        }

        if (result.affectedRows === 0) {
            // This handles two cases: transactionId/userId mismatch OR status is not 'Pending'
            return res.status(400).json({ message: 'Application could not be cancelled. It may have already been processed or cancelled, or the transaction ID/User ID is incorrect.' });
        }

        res.status(200).json({ message: 'Document application cancelled successfully!', status: 'Cancelled' });
    });
});

// GET /api/document-applications/:userId - Fetch user's transaction history.
app.get('/api/document-applications/:userId', (req, res) => {
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid User ID.' });
    }

    const SQL_FETCH_TRANSACTIONS = `
        SELECT 
            id, 
            document_name, 
            purpose, 
            fee, 
            requirements_media_url,
            status, 
            created_at, 
            updated_at
        FROM document_transactions 
        WHERE user_id = ?
        ORDER BY created_at DESC;
    `;
    
    db.query(SQL_FETCH_TRANSACTIONS, [userId], (err, results) => {
        if (err) {
            console.error("Database error fetching applications:", err);
            return res.status(500).json({ message: 'Failed to fetch document applications.' });
        }

        // Parse requirements_media_url from JSON string back to array if necessary
        const transactions = results.map(row => ({
            ...row,
            requirementsMediaUrl: row.requirements_media_url ? JSON.parse(row.requirements_media_url) : [],
        }));

        res.status(200).json(transactions);
    });
});

// DELETE /api/document-application/:transactionId - Permanently delete a CANCELLED application
app.delete('/api/document-applications/:transactionId', (req, res) => {
    const transactionId = parseInt(req.params.transactionId, 10);
    const userId = parseInt(req.body.userId, 10); 
    if (isNaN(transactionId) || isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid Transaction ID or User ID.' });
    }

    // Delete only if the status is 'Cancelled' AND the user_id matches
    const SQL_DELETE_APPLICATION = `
        DELETE FROM document_transactions 
        WHERE id = ? AND user_id = ? AND status = 'Cancelled'
    `;
    
    db.query(SQL_DELETE_APPLICATION, [transactionId, userId], (err, result) => {
        if (err) {
            console.error("Database error deleting application:", err);
            return res.status(500).json({ message: 'Failed to permanently delete document application due to a database error.' });
        }

        if (result.affectedRows === 0) {
            // This handles two cases: transactionId/userId mismatch OR status is not 'Cancelled'
            return res.status(400).json({ message: 'Application could not be deleted. It may not be in a "Cancelled" status, or the transaction ID/User ID is incorrect.' });
        }

        res.status(200).json({ message: 'Document application permanently deleted successfully!', deletedId: transactionId });
    });
});

app.get('/api/jobs', (req, res) => {
    const { category } = req.query; // 'category' is the tag
    
    let SQL_FETCH_JOBS = `
        SELECT 
            j.id, j.user_id, j.title, j.body, j.tag, j.created_at, j.media_url,
            j.contact_number, 
            u.name,
            up.profile_picture_url,
            CAST(COUNT(r.id) AS UNSIGNED) AS response_count
        FROM jobs j
        JOIN users u ON j.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id 
        LEFT JOIN responses r ON j.id = r.job_id
    `;
    
    let whereClause = [];
    let queryParams = [];

    // Filter by category if provided and not 'All' 
    if (category && category !== 'All') {
        whereClause.push('j.tag = ?');
        queryParams.push(category);
    }
    
    if (whereClause.length > 0) {
        SQL_FETCH_JOBS += ` WHERE ${whereClause.join(' AND ')}`;
    }
    
    SQL_FETCH_JOBS += ` 
        GROUP BY 
            j.id, j.user_id, j.title, j.body, j.tag, j.created_at, j.media_url, j.contact_number, u.name, up.profile_picture_url
        ORDER BY j.created_at DESC
    `;
    
    db.query(SQL_FETCH_JOBS, queryParams, (err, results) => {
        if (err) {
            console.error("Database error fetching jobs:", err);
            return res.status(500).json({ message: 'Failed to fetch jobs.' });
        }

        // Use the existing formatThread helper, passing 'job' as the type
        const jobs = results.map(row => formatThread(row, 'job'));
        res.status(200).json(jobs);
    });
});

app.post('/api/contact-message', (req, res) => {
    const { userId, fullName, emailAddress, subject, message } = req.body;

    if (!fullName || !emailAddress || !subject || !message) {
        return res.status(400).json({ message: 'All form fields are required.' });
    }

    // Convert userId to INT or NULL if it's undefined/null/empty string from frontend
    const user_id_val = userId && !isNaN(parseInt(userId, 10)) ? parseInt(userId, 10) : null;
    
    const SQL_INSERT_MESSAGE = `
        INSERT INTO contact_messages 
            (user_id, full_name, email_address, subject, message) 
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(SQL_INSERT_MESSAGE, [user_id_val, fullName, emailAddress, subject, message], (err, result) => {
        if (err) {
            console.error("Database error inserting contact message:", err);
            return res.status(500).json({ message: 'Failed to submit contact message.' });
        }
        res.status(201).json({ message: 'Message sent successfully!', messageId: result.insertId });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});