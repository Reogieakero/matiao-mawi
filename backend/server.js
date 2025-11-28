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
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10) || 1001;

app.use(cors({
    origin: 'http://localhost:3000', 
    methods: 'GET,POST,DELETE,PUT', 
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

// Dedicated storage for PROFILE PICTURES (Users)
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

// Dedicated storage for OFFICIAL PROFILE PICTURES
const officialPicStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        // Use a distinct prefix for officials
        cb(null, `official-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${ext}`);
    }
});

const officialPicUploader = multer({ 
    storage: officialPicStorage, 
    limits: { fileSize: 2 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
}).single('official_picture'); // Field name matches client-side: 'official_picture'

// Re-using the generic storage for document-related files, allowing image/pdf
const documentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        // Use a distinct prefix for document related files
        cb(null, `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${ext}`);
    }
});



// =========================================================
// UPDATED: Multer instance for the Document Application Route
// Only handles 'requirements' files. Payment is now handled via text fields.
// =========================================================
const documentsApplicationUploader = multer({ 
    storage: documentStorage, 
    limits: { fileSize: 5 * 1024 * 1024 * 5 }, // Global limit: 25MB (Max 5 requirements files)
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only image and PDF files are allowed for requirements!'), false);
        }
    }
}).fields([
    { name: 'requirements', maxCount: 5 },  
]);
// =========================================================


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
        // ADDED: Include contact number for jobs
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

// NEW ENDPOINT: POST /api/upload-requirements (Kept but may not be used by DocumentsPage now)
app.post('/api/upload-requirements', (req, res) => {
    // This endpoint remains for completeness but is likely not used by the new DocumentsPage
    const requirementsStorage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir); 
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${ext}`);
        }
    });

    const requirementsUploader = multer({ 
        storage: requirementsStorage,
        limits: { fileSize: 5 * 1024 * 1024 }, 
        fileFilter: (req, file, cb) => {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed for requirements!'), false);
            }
        }
    }).array('requirements', 5); 

    requirementsUploader(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error("Multer Requirements Error:", err.message);
            return res.status(400).json({ message: `Requirements upload failed: ${err.message}` });
        } else if (err) {
            console.error("Unknown Requirements Upload Error:", err);
            return res.status(500).json({ message: err.message || 'An unknown error occurred during requirements upload.' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(200).json({ message: 'No files uploaded.', mediaUrls: [] });
        }
        
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
            res.status(200).json({ 
                message: 'Login successful!', 
                user: { 
                    id: user.id, 
                    name: user.name, 
                    email: user.email,
                    profilePictureUrl: user.profile_picture_url || '' 
                } 
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials.' });
        }
    });
});

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

app.get('/api/user-threads/:userId', (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid User ID.' });
    }

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
                NULL AS contact_number, 
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
                j.contact_number, 
                (SELECT COUNT(*) FROM responses WHERE job_id = j.id) AS response_count
            FROM jobs j
            JOIN users u ON j.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE j.user_id = ?
        )
        ORDER BY created_at DESC;
    `;

    db.query(SQL_FETCH_USER_THREADS, [userId, userId], (err, results) => {
        if (err) {
            console.error("Database error fetching user threads:", err);
            return res.status(500).json({ message: 'Failed to fetch user threads.' });
        }
        
        const userThreads = results.map(row => formatThread(row, row.type));
        res.status(200).json(userThreads);
    });
});

app.delete('/api/user-threads/:userId', (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const userIdFromBody = parseInt(req.body.userId, 10); 

    if (isNaN(userId) || isNaN(userIdFromBody) || userId !== userIdFromBody) {
        return res.status(400).json({ message: 'Invalid or inconsistent User ID.' });
    }

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
    const SQL_DELETE_POSTS = `DELETE FROM posts WHERE user_id = ?`;
    const SQL_DELETE_JOBS = `DELETE FROM jobs WHERE user_id = ?`;

    db.beginTransaction(err => {
        if (err) {
            console.error("Transaction Begin Error:", err);
            return res.status(500).json({ message: 'Failed to start bulk thread deletion.' });
        }

        db.query(SQL_DELETE_RESPONSES, [userId, userId], (err, responseResult) => {
            if (err) return db.rollback(() => {
                console.error("Database error deleting responses for user threads:", err);
                res.status(500).json({ message: 'Failed to delete responses for user threads.' });
            });

            db.query(SQL_DELETE_BOOKMARKS, [userId, userId, userId], (err, bookmarkResult) => {
                if (err) return db.rollback(() => {
                    console.error("Database error deleting thread dependencies (bookmarks):", err);
                    res.status(500).json({ message: 'Failed to delete thread dependencies (bookmarks).' });
                });

                db.query(SQL_DELETE_POSTS, [userId], (err, postsResult) => {
                    if (err) return db.rollback(() => {
                        console.error("Database error deleting all posts:", err);
                        res.status(500).json({ message: 'Failed to delete all posts.' });
                    });

                    db.query(SQL_DELETE_JOBS, [userId], (err, jobsResult) => {
                        if (err) return db.rollback(() => {
                            console.error("Database error deleting all jobs:", err);
                            res.status(500).json({ message: 'Failed to delete all jobs.' });
                        });

                        const deletedCount = postsResult.affectedRows + jobsResult.affectedRows;

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

// --- NEW API ENDPOINT: DELETE a single thread (Post or Job) ---
app.delete('/api/threads/:threadType/:threadId', (req, res) => {
    const threadId = parseInt(req.params.threadId, 10);
    const threadType = req.params.threadType; // 'post' or 'job'
    // The userId is passed in the body from the client to verify ownership
    const userIdFromBody = parseInt(req.body.userId, 10); 
    
    // Basic Validation
    if (isNaN(threadId) || isNaN(userIdFromBody) || !['post', 'job'].includes(threadType)) {
        return res.status(400).json({ message: 'Invalid thread ID, type, or user ID provided.' });
    }

    const table = threadType === 'post' ? 'posts' : 'jobs';
    const threadIdKey = threadType === 'post' ? 'post_id' : 'job_id';

    // 1. Delete associated responses
    const SQL_DELETE_RESPONSES = `DELETE FROM responses WHERE ${threadIdKey} = ?`;
    // 2. Delete associated bookmarks
    const SQL_DELETE_BOOKMARKS = `DELETE FROM bookmarks WHERE ${threadIdKey} = ?`;
    // 3. Delete the thread itself, ensuring user_id matches for authorization
    const SQL_DELETE_THREAD = `DELETE FROM ${table} WHERE id = ? AND user_id = ?`;

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ message: 'Transaction start failed.' });

        // Step 1: Delete Responses
        db.query(SQL_DELETE_RESPONSES, [threadId], (err) => {
            if (err) return db.rollback(() => { 
                console.error("Database error deleting responses:", err);
                res.status(500).json({ message: 'Failed to delete associated responses.' });
            });

            // Step 2: Delete Bookmarks
            db.query(SQL_DELETE_BOOKMARKS, [threadId], (err) => {
                if (err) return db.rollback(() => { 
                    console.error("Database error deleting bookmarks:", err);
                    res.status(500).json({ message: 'Failed to delete associated bookmarks.' });
                });

                // Step 3: Delete the Post/Job
                db.query(SQL_DELETE_THREAD, [threadId, userIdFromBody], (err, result) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error("Database error deleting thread:", err);
                            res.status(500).json({ message: `Failed to delete ${threadType}.` });
                        });
                    }

                    if (result.affectedRows === 0) {
                        return db.rollback(() => {
                            // No rows deleted means unauthorized or thread not found
                            res.status(403).json({ message: 'Thread could not be deleted. It may not exist, or you are not the author.' });
                        });
                    }

                    // Success: Commit Transaction
                    db.commit(commitErr => {
                        if (commitErr) return db.rollback(() => {
                            console.error("Transaction Commit Error:", commitErr);
                            res.status(500).json({ message: 'Failed to complete thread deletion.' });
                        });
                        
                        // Success JSON Response
                        res.status(200).json({ message: `${threadType} deleted successfully.`, deletedId: threadId });
                    });
                });
            });
        });
    });
});

app.post('/api/threads', (req, res) => {
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
        SQL_INSERT = `INSERT INTO ${table} (user_id, title, body, tag, media_url) VALUES (?, ?, ?, ?, ?)`;
        params = [userId, title, postContent, postCategory, mediaUrlJson];
    } else { 
        if (!contactNumber) {
            return res.status(400).json({ message: 'Contact number is required for job posts.' });
        }
        SQL_INSERT = `INSERT INTO ${table} (user_id, title, body, tag, media_url, contact_number) VALUES (?, ?, ?, ?, ?, ?)`;
        params = [userId, title, postContent, postCategory, mediaUrlJson, contactNumber];
    }

    db.query(SQL_INSERT, params, (err, result) => { 
        if (err) {
            console.error("Database error creating thread:", err);
            return res.status(500).json({ message: 'Failed to create thread.' });
        }

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

            const newThread = formatThread(fetchResults[0], postType);
            res.status(201).json({ message: 'Thread created successfully!', thread: newThread });
        });
    });
});

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

        const SQL_DELETE_RESPONSES = `DELETE FROM responses WHERE ${threadKey} = ?`;
        db.query(SQL_DELETE_RESPONSES, [threadId], (err) => {
            if (err) return db.rollback(() => {
                console.error("Database error deleting responses:", err);
                res.status(500).json({ message: 'Failed to delete associated responses.' });
            });

            const SQL_DELETE_BOOKMARKS = `DELETE FROM bookmarks WHERE ${threadKey} = ?`;
            db.query(SQL_DELETE_BOOKMARKS, [threadId], (err) => {
                if (err) return db.rollback(() => {
                    console.error("Database error deleting bookmarks:", err);
                    res.status(500).json({ message: 'Failed to delete associated bookmarks.' });
                });

                const SQL_DELETE_THREAD = `DELETE FROM ${table} WHERE id = ? AND user_id = ?`;
                db.query(SQL_DELETE_THREAD, [threadId, userId], (err, result) => {
                    if (err) return db.rollback(() => {
                        console.error("Database error deleting thread:", err);
                        res.status(500).json({ message: `Failed to delete ${threadType}.` });
                    });

                    if (result.affectedRows === 0) {
                        return db.rollback(() => { 
                            res.status(403).json({ message: 'Thread could not be deleted. It may not exist, or you are not the author.' });
                        });
                    }

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
            const SQL_DELETE = 'DELETE FROM bookmarks WHERE id = ?';
            db.query(SQL_DELETE, [results[0].id], (deleteErr) => {
                if (deleteErr) {
                    console.error("Database error deleting bookmark:", deleteErr);
                    return res.status(500).json({ message: 'Failed to unsave thread.' });
                }
                res.status(200).json({ message: 'Thread unsaved successfully.', action: 'unsaved' });
            });
        } else {
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
                NULL AS contact_number, 
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
                j.contact_number, 
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

        const savedThreads = results.map(row => ({ 
            ...formatThread(row, row.type), 
            isBookmarked: true,
            bookmarked_at: row.bookmarked_at,
        }));

        res.status(200).json(savedThreads);
    });
});

app.get('/api/search', (req, res) => {
    const { q } = req.query; 

    if (!q) {
        return res.status(200).json([]);
    }

    let searchConditions = [];
    let queryParams = [];

    if (q) {
        const searchPattern = `%${q}%`;
        
        searchConditions.push(`(p.title LIKE ? OR p.body LIKE ?)`);
        searchConditions.push(`(j.title LIKE ? OR j.body LIKE ?)`);
        
        queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    const postWhereClause = searchConditions[0] ? `WHERE ${searchConditions[0]}` : '';
    const jobWhereClause = searchConditions[1] ? `WHERE ${searchConditions[1]}` : '';

    const SQL_FETCH_POSTS = `
        SELECT 
            p.id, p.user_id, p.title, p.body, p.tag, p.created_at, p.media_url, 
            NULL AS contact_number, 
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
    
    const SQL_FETCH_JOBS = `
        SELECT 
            j.id, j.user_id, j.title, j.body, j.tag, j.created_at, j.media_url, 
            j.contact_number, 
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
    
    const FINAL_SQL_QUERY = `
        ${SQL_FETCH_POSTS}
        UNION ALL
        ${SQL_FETCH_JOBS}
        ORDER BY created_at DESC
    `;

    db.query(FINAL_SQL_QUERY, queryParams, (err, results) => {
        if (err) {
            console.error("Database error fetching search results:", err);
            return res.status(500).json({ message: 'Failed to fetch search results.' });
        }
        
        const allResults = results.map(row => formatThread(row, row.thread_type));
        
        res.status(200).json(allResults);
    });
});

app.post('/api/profile/upload-picture/:userId', (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid User ID for profile picture upload.' });
    }

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

app.get('/api/profile/:userId', (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid User ID.' });
    }

    const SQL_FETCH_PROFILE = `
        SELECT 
            u.name, 
            u.email, 
            up.contact, 
            up.address, 
            up.profile_picture_url
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = ?
    `;

    db.query(SQL_FETCH_PROFILE, [userId], (err, results) => {
        if (err) {
            console.error("Database error fetching user profile:", err);
            return res.status(500).json({ message: 'Failed to fetch user profile.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const profileData = results[0];
        res.status(200).json({
            name: profileData.name,
            email: profileData.email,
            contact: profileData.contact,
            address: profileData.address,
            profilePictureUrl: profileData.profile_picture_url || '',
        });
    });
});


// --- API Endpoint: PUT Update Profile Details (The save function) ---
app.put('/api/profile/:userId', (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid User ID.' });
    }

    const { editedName, editedContact, editedAddress, newProfilePictureUrl } = req.body;

    // Validation
    if (!editedName) {
        return res.status(400).json({ message: 'Name is required.' });
    }

    // SQL to update user's name in the 'users' table
    const SQL_UPDATE_USER = 'UPDATE users SET name = ? WHERE id = ?';
    
    // SQL to update or insert profile details in 'user_profiles' table (UPSERT)
    // Assumes user_id is a primary or unique key in user_profiles
    const SQL_UPSERT_PROFILE = `
        INSERT INTO user_profiles (user_id, contact, address, profile_picture_url)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            contact = VALUES(contact), 
            address = VALUES(address), 
            profile_picture_url = VALUES(profile_picture_url)
    `;
    
    db.beginTransaction(err => {
        if (err) return res.status(500).json({ message: 'Transaction start failed.' });

        // 1. Update user's name
        db.query(SQL_UPDATE_USER, [editedName, userId], (err) => {
            if (err) {
                return db.rollback(() => {
                    console.error("Error updating user name:", err);
                    res.status(500).json({ message: 'Failed to update user name.' });
                });
            }

            // 2. Upsert profile details (contact, address, picture URL)
            db.query(SQL_UPSERT_PROFILE, [userId, editedContact, editedAddress, newProfilePictureUrl], (err) => {
                if (err) {
                    return db.rollback(() => {
                        console.error("Error upserting user profile:", err);
                        res.status(500).json({ message: 'Failed to update profile details.' });
                    });
                }
                
                db.commit(commitErr => {
                    if (commitErr) {
                        return db.rollback(() => {
                            console.error("Transaction commit error:", commitErr);
                            res.status(500).json({ message: 'Failed to commit profile updates.' });
                        });
                    }

                    // Return updated info to client to refresh local state
                    res.status(200).json({ 
                        message: 'Profile updated successfully.',
                        updatedName: editedName,
                        updatedPictureUrl: newProfilePictureUrl
                    });
                });
            });
        });
    });
});
app.get('/api/jobs', (req, res) => {
    const { category } = req.query; 
    
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

        const jobs = results.map(row => formatThread(row, 'job'));
        res.status(200).json(jobs);
    });
});

app.post('/api/contact-message', (req, res) => {
    const { userId, fullName, emailAddress, subject, message } = req.body;

    if (!fullName || !emailAddress || !subject || !message) {
        return res.status(400).json({ message: 'All form fields are required.' });
    }

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

app.get('/api/admin/dashboard-stats', (req, res) => {
    const SQL_STATS = `
        SELECT COUNT(*) AS totalUsers FROM users;
        SELECT COUNT(*) AS totalPosts FROM posts;
        SELECT COUNT(*) AS totalJobs FROM jobs;
        SELECT COUNT(*) AS totalApplications FROM document_applications;
        SELECT COUNT(*) AS totalContacts FROM contact_messages;
    `;

    db.query(SQL_STATS, (err, results) => {
        if (err) {
            console.error("Database error fetching dashboard stats:", err);
            return res.status(500).json({ message: 'Failed to fetch dashboard statistics.' });
        }

        const stats = {
            totalUsers: results[0][0].totalUsers,
            totalPosts: results[1][0].totalPosts,
            totalJobs: results[2][0].totalJobs,
            totalApplications: results[3][0].totalApplications,
            totalContacts: results[4][0].totalContacts,
        };

        res.status(200).json(stats);
    });
});

app.get('/api/admin/users', (req, res) => {
    const SQL_SELECT_USERS = `
        SELECT 
            id,              
            name, 
            email, 
            role, 
            created_at
        FROM users
    `;

    db.query(SQL_SELECT_USERS, (err, results) => {
        if (err) {
            console.error("Database error fetching all users:", err);
            return res.status(500).json({ message: 'Failed to fetch user list.' });
        }
        res.status(200).json(results);
    });
});

app.delete('/api/admin/users/:userId', (req, res) => {
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid User ID.' });
    }

    const SQL_DELETE_RESPONSES = `
        DELETE FROM responses 
        WHERE user_id = ? OR post_id IN (SELECT id FROM posts WHERE user_id = ?) OR job_id IN (SELECT id FROM jobs WHERE user_id = ?);
    `;
    const SQL_DELETE_BOOKMARKS = `
        DELETE FROM bookmarks 
        WHERE user_id = ? OR post_id IN (SELECT id FROM posts WHERE user_id = ?) OR job_id IN (SELECT id FROM jobs WHERE user_id = ?);
    `;
    const SQL_DELETE_POSTS = `DELETE FROM posts WHERE user_id = ?`;
    const SQL_DELETE_JOBS = `DELETE FROM jobs WHERE user_id = ?`;
    const SQL_DELETE_PROFILE = `DELETE FROM user_profiles WHERE user_id = ?`;
    const SQL_DELETE_USER = `DELETE FROM users WHERE id = ?`;

    const executionPlan = [
        { sql: SQL_DELETE_RESPONSES, params: [userId, userId, userId], errorMsg: 'Failed to delete user responses.' },
        { sql: SQL_DELETE_BOOKMARKS, params: [userId, userId, userId], errorMsg: 'Failed to delete user bookmarks.' },
        { sql: SQL_DELETE_POSTS, params: [userId], errorMsg: 'Failed to delete user posts.' },
        { sql: SQL_DELETE_JOBS, params: [userId], errorMsg: 'Failed to delete user jobs.' },
        { sql: SQL_DELETE_PROFILE, params: [userId], errorMsg: 'Failed to delete user profile.' },
        { sql: SQL_DELETE_USER, params: [userId], errorMsg: 'Failed to delete user record.' },
    ];

    db.beginTransaction(err => {
        if (err) {
            console.error("Transaction Begin Error:", err);
            return res.status(500).json({ message: 'Failed to start user deletion transaction.' });
        }

        const executeStep = (stepIndex) => {
            if (stepIndex >= executionPlan.length) {
                db.commit(commitErr => {
                    if (commitErr) return db.rollback(() => {
                        console.error("Transaction Commit Error:", commitErr);
                        res.status(500).json({ message: 'Failed to complete user deletion.' });
                    });
                    res.status(200).json({ message: 'User and all associated data deleted successfully.' });
                });
                return;
            }

            const step = executionPlan[stepIndex];
            db.query(step.sql, step.params, (err) => {
                if (err) return db.rollback(() => {
                    console.error(`Database error: ${step.errorMsg}:`, err);
                    res.status(500).json({ message: step.errorMsg });
                });

                executeStep(stepIndex + 1);
            });
        };

        executeStep(0);
    });
});


app.get('/api/documents', (req, res) => {
    const SQL_GET_DOCUMENTS = 'SELECT id, document_name, description, requirements, fee FROM barangay_documents ORDER BY document_name';
    db.query(SQL_GET_DOCUMENTS, (err, results) => {
        if (err) {
            console.error("Database error fetching documents:", err);
            return res.status(500).json({ message: 'Failed to fetch documents.' });
        }
        res.status(200).json(results);
    });
});

// Endpoint to fetch payment accounts for display in the modal
// =========================================================
app.get('/api/payment-details', (req, res) => {
    const SQL_GET_PAYMENT_DETAILS = 'SELECT method_name, account_name, account_number FROM barangay_payment_details WHERE is_active = TRUE ORDER BY id';
    db.query(SQL_GET_PAYMENT_DETAILS, (err, results) => {
        if (err) {
            console.error("Database error fetching payment details:", err);
            return res.status(500).json({ message: 'Failed to fetch payment details.' });
        }
        res.status(200).json(results);
    });
});
// =========================================================

// UPDATED ENDPOINT: POST /api/documents/apply
// Now uses documentsApplicationUploader for file uploads
// =========================================================
app.post('/api/documents/apply', (req, res) => {
    // 1. Use the dedicated uploader middleware
    documentsApplicationUploader(req, res, (uploadErr) => {
        if (uploadErr instanceof multer.MulterError) {
            console.error("Multer Upload Error:", uploadErr.message);
            return res.status(400).json({ message: `File upload failed: ${uploadErr.message}` });
        } else if (uploadErr) {
            console.error("Unknown Upload Error:", uploadErr);
            return res.status(500).json({ message: uploadErr.message || 'An unknown error occurred during file upload.' });
        }

        // 2. Extract text fields from req.body and file paths from req.files
        const { document_id, user_email, full_name, purpose, requirements_details, payment_method, payment_reference_number } = req.body;
        
        const uploadedRequirements = req.files && req.files['requirements'] ? req.files['requirements'] : [];
        const requirementsFilePaths = uploadedRequirements.map(file => `http://localhost:${PORT}/media/${file.filename}`);
        const requirementsFilePathsJson = requirementsFilePaths.length > 0 ? JSON.stringify(requirementsFilePaths) : null;

        if (!document_id || !user_email || !full_name || !purpose || !requirements_details || uploadedRequirements.length === 0) {
            return res.status(400).json({ message: 'Missing required fields or requirements files.' });
        }

        const SQL_INSERT_APPLICATION = `
            INSERT INTO document_applications (
                document_id, user_email, applicant_name, purpose, 
                requirements_details, requirements_file_paths, 
                payment_method, payment_reference_number, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
        `;

        db.query(
            SQL_INSERT_APPLICATION, 
            [
                document_id, user_email, full_name, purpose, 
                requirements_details, requirementsFilePathsJson, 
                payment_method || null, payment_reference_number || null
            ], 
            (err, result) => {
            if (err) {
                console.error("Database error inserting document application:", err);
                return res.status(500).json({ message: 'Failed to submit document application.' });
            }

            res.status(201).json({ 
                message: 'Application submitted successfully!', 
                applicationId: result.insertId 
            });
        });
    });
});
// =========================================================

// UPDATED ENDPOINT: GET /api/documents/history/:userEmail
// Now includes requirements_file_paths
// =========================================================
app.get('/api/documents/history/:userEmail', (req, res) => {
    const userEmail = req.params.userEmail;
    if (!userEmail) {
        return res.status(400).json({ message: 'User email is required.' });
    }

    const SQL_FETCH_HISTORY = `
        SELECT 
            da.id, 
            da.applicant_name, 
            da.purpose, 
            da.requirements_details, 
            da.requirements_file_paths, -- *** NEW FIELD: File paths of submitted requirements ***
            da.payment_method, 
            da.payment_reference_number, 
            da.status, 
            da.application_date, 
            bd.document_name, 
            bd.fee
        FROM document_applications da
        JOIN barangay_documents bd ON da.document_id = bd.id
        WHERE da.user_email = ?
        ORDER BY da.application_date DESC
    `;

    db.query(SQL_FETCH_HISTORY, [userEmail], (err, results) => {
        if (err) {
            console.error("Database error fetching application history:", err);
            return res.status(500).json({ message: 'Failed to fetch application history.' });
        }

        // Parse requirements_file_paths from JSON string back to array if it exists
        const history = results.map(row => ({
            ...row,
            requirements_file_paths: row.requirements_file_paths ? JSON.parse(row.requirements_file_paths) : []
        }));

        res.status(200).json(history);
    });
});
// =========================================================


// =========================================================
// NEW ENDPOINT: PUT /api/documents/cancel/:applicationId
// Updates the status of an application to 'Cancelled'
// =========================================================
// New Endpoint for application cancellation (updates status)
// New Endpoint for application cancellation (updates status)
app.put('/api/documents/cancel/:applicationId', (req, res) => {
    const applicationId = parseInt(req.params.applicationId, 10);
    const { userEmail } = req.body;

    if (isNaN(applicationId) || !userEmail) {
        return res.status(400).json({ message: 'Invalid Application ID or missing user email.' });
    }

    // Only allow cancellation if the current status is 'Pending'
    const SQL_CANCEL_APPLICATION = `
        UPDATE document_applications 
        SET status = 'Cancelled', updated_at = NOW()
        WHERE id = ? AND user_email = ? AND status = 'Pending'
    `;

    db.query(SQL_CANCEL_APPLICATION, [applicationId, userEmail], (err, result) => {
        if (err) {
            console.error("Database error cancelling application:", err);
            return res.status(500).json({ message: 'Failed to cancel application.' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(403).json({ message: 'Application cannot be cancelled or not found/unauthorized.' });
        }

        res.status(200).json({ message: 'Application successfully cancelled.' });
    });
});
// =========================================================


// Endpoint for deleting an application
// Allows deletion if status is 'Pending' or 'Cancelled'
app.delete('/api/documents/delete/:applicationId', (req, res) => {
    const applicationId = parseInt(req.params.applicationId, 10);
    const { userEmail } = req.body; // To verify the user owns the application

    if (isNaN(applicationId) || !userEmail) {
        return res.status(400).json({ message: 'Invalid Application ID or missing user email.' });
    }
    
    // NOTE: In a real application, you would also delete the files associated with the application
    // from the file system using the requirements_file_paths.

    const SQL_DELETE_APPLICATION = `
        DELETE FROM document_applications 
        WHERE id = ? AND user_email = ? AND status IN ('Pending', 'Cancelled')
    `;

    db.query(SQL_DELETE_APPLICATION, [applicationId, userEmail], (err, result) => {
        if (err) {
            console.error("Database error deleting application:", err);
            return res.status(500).json({ message: 'Failed to delete application.' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(403).json({ message: 'Application cannot be deleted (status is Approved/Rejected/Completed) or not found/unauthorized.' });
        }

        res.status(200).json({ message: 'Application permanently deleted.' });
    });
});

app.get('/api/user/profile/:email', (req, res) => {
    const userEmail = req.params.email;

    if (!userEmail) {
        return res.status(400).json({ message: 'User email is required.' });
    }

    // --- CRITICAL CHANGE: USING LEFT JOIN to get profile_picture_url ---
    const SQL_QUERY_PROFILE = `
        SELECT 
            u.id, 
            u.name, 
            u.email, 
            up.profile_picture_url  /* Fetches the picture URL from user_profiles */
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id /* JOIN on user_id */
        WHERE u.email = ?
    `;

    db.query(SQL_QUERY_PROFILE, [userEmail], (err, results) => {
        if (err) {
            console.error("Database error fetching user profile:", err);
            return res.status(500).json({ message: 'Failed to fetch user profile.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Return the full user profile object
        // Renaming 'full_name' to 'name' to match frontend convention
        const userProfile = {
            id: results[0].id,
            name: results[0].name, // Corrected from results[0].full_name
            email: results[0].email,
            // The profile picture URL is now correctly sourced via the JOIN
            profilePictureUrl: results[0].profile_picture_url, 
            // Note: If profile_picture_url is NULL in the database, it will be NULL here, triggering the initials fallback on the frontend.
        };

        res.status(200).json(userProfile);
    });
});
// =========================================================

// --- NEW API ENDPOINTS FOR BARANGAY OFFICIALS MANAGEMENT ---

// 1. Upload Official Profile Picture
app.post('/api/admin/officials/upload-picture', (req, res) => {
    officialPicUploader(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error("Multer Official Picture Error:", err.message);
            return res.status(400).json({ message: `File upload failed: ${err.message}` });
        } else if (err) {
            console.error("Unknown Official Upload Error:", err);
            return res.status(500).json({ message: err.message || 'An unknown error occurred during file upload.' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file selected for upload.' });
        }

        // Construct the full URL for the image
        const pictureUrl = `http://localhost:${PORT}/media/${req.file.filename}`;

        // Return the temporary URL to the frontend for use in the main form submission
        res.status(200).json({ 
            message: 'Picture uploaded successfully.', 
            profilePictureUrl: pictureUrl,
        });
    });
});

// 2. Add New Barangay Official
app.post('/api/admin/officials', (req, res) => {
    // --- UPDATED: Destructure new fields: position, committee ---
    const { firstName, middleInitial, lastName, contactNumber, category, status, profilePictureUrl, position, committee } = req.body;

    // --- UPDATED: New required field 'position' ---
    if (!firstName || !lastName || !category || !status || !position) {
        return res.status(400).json({ message: 'Missing required official details (Name, Category, Status, Position).' });
    }
    
    // Committee is optional or can be 'None', store as NULL if not provided or 'None'
    const finalCommittee = (committee === 'None' || !committee) ? null : committee;

    const SQL_INSERT = `
        INSERT INTO barangay_officials 
        (first_name, middle_initial, last_name, contact_number, position, committee, category, status, profile_picture_url) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        firstName, 
        middleInitial || null, 
        lastName, 
        contactNumber || null, 
        position, // <-- NEW PARAMETER
        finalCommittee, // <-- NEW PARAMETER
        category, 
        status, 
        profilePictureUrl || null
    ];

    db.query(SQL_INSERT, params, (err, result) => {
        if (err) {
            console.error("Database error adding official:", err);
            return res.status(500).json({ message: 'Failed to add new official.' });
        }
        
        const newOfficialId = result.insertId;
        const SQL_FETCH_NEW = `
            SELECT 
                id, first_name, middle_initial, last_name, contact_number, 
                position, committee, category, status, profile_picture_url, created_at 
            FROM barangay_officials 
            WHERE id = ?
        `; // <-- UPDATED: Added position and committee

        db.query(SQL_FETCH_NEW, [newOfficialId], (fetchErr, fetchResults) => {
            if (fetchErr || fetchResults.length === 0) {
                console.error("Database error fetching newly created official:", fetchErr);
                return res.status(500).json({ message: 'Official added, but failed to retrieve details.' });
            }

            res.status(201).json({ 
                message: 'Official added successfully!', 
                official: fetchResults[0] 
            });
        });
    });
});

// 3. Fetch All Barangay Officials
app.get('/api/admin/officials', (req, res) => {
    const SQL_FETCH_OFFICIALS = `
        SELECT 
            id, first_name, middle_initial, last_name, contact_number, 
            position, committee, category, status, profile_picture_url, created_at 
        FROM barangay_officials 
        ORDER BY last_name ASC, first_name ASC
    `; // <-- UPDATED: Added position and committee
    
    db.query(SQL_FETCH_OFFICIALS, (err, results) => {
        if (err) {
            console.error("Database error fetching officials:", err);
            return res.status(500).json({ message: 'Failed to fetch barangay officials.' });
        }
        res.status(200).json(results);
    });
});

// 4. Delete a Barangay Official
app.delete('/api/admin/officials/:id', (req, res) => {
    const officialId = parseInt(req.params.id, 10);
    if (isNaN(officialId)) {
        return res.status(400).json({ message: 'Invalid Official ID.' });
    }

    const SQL_DELETE = `DELETE FROM barangay_officials WHERE id = ?`;
    db.query(SQL_DELETE, [officialId], (err, result) => {
        if (err) {
            console.error("Database error deleting official:", err);
            return res.status(500).json({ message: 'Failed to delete official.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Official not found or already deleted.' });
        }
        res.status(200).json({ message: 'Official deleted successfully.', deletedId: officialId });
    });
});


app.put('/api/admin/officials/:id/status', (req, res) => {
    const officialId = parseInt(req.params.id, 10);
    const { status } = req.body;

    // Input Validation
    if (isNaN(officialId)) {
        return res.status(400).json({ message: 'Invalid Official ID.' });
    }
    if (!status) {
        return res.status(400).json({ message: 'Status field is required.' });
    }

    const SQL_UPDATE_STATUS = `
        UPDATE barangay_officials 
        SET status = ?, updated_at = NOW() 
        WHERE id = ?
    `;

    db.query(SQL_UPDATE_STATUS, [status, officialId], (err, result) => {
        if (err) {
            console.error("Database error updating official status:", err);
            return res.status(500).json({ message: 'Failed to update official status.' });
        }
        if (result.affectedRows === 0) {
            // 404 if ID not found, or 200 if no change was made
            return res.status(404).json({ message: 'Official not found.' });
        }
        res.status(200).json({ message: 'Official status updated successfully.', officialId: officialId, newStatus: status });
    });
});

app.put('/api/admin/officials/:id', (req, res) => {
    const officialId = parseInt(req.params.id, 10);
    const { 
        firstName, middleInitial, lastName, contactNumber, 
        category, status, position, committee, profilePictureUrl 
    } = req.body;

    if (isNaN(officialId) || !firstName || !lastName || !category || !status || !position || !committee) {
        return res.status(400).json({ message: 'Missing required official fields.' });
    }

    const SQL_FETCH_OLD_PICTURE = `
        SELECT profile_picture_url FROM barangay_officials WHERE id = ?
    `;

    const SQL_UPDATE = `
        UPDATE barangay_officials 
        SET first_name = ?, middle_initial = ?, last_name = ?, contact_number = ?, 
            category = ?, status = ?, position = ?, committee = ?, 
            profile_picture_url = ?, updated_at = NOW()
        WHERE id = ?
    `;
    
    // Begin Transaction to handle potential picture deletion
    db.beginTransaction(err => {
        if (err) {
            console.error("Transaction Begin Error:", err);
            return res.status(500).json({ message: 'Failed to start official update transaction.' });
        }

        // 1. Fetch current data to check for existing picture
        db.query(SQL_FETCH_OLD_PICTURE, [officialId], (err, results) => {
            if (err) return db.rollback(() => {
                console.error("Database error fetching old picture URL:", err);
                res.status(500).json({ message: 'Failed to update official (DB fetch error).' });
            });
            
            const oldProfilePictureUrl = results.length > 0 ? results[0].profile_picture_url : null;
            
            // 2. Perform the update
            const params = [
                firstName, middleInitial || null, lastName, contactNumber || null,
                category, status, position, committee, 
                profilePictureUrl || null, officialId
            ];

            db.query(SQL_UPDATE, params, (err, updateResult) => {
                if (err) return db.rollback(() => {
                    console.error("Database error updating official:", err);
                    res.status(500).json({ message: 'Failed to update official (DB update error).' });
                });

                if (updateResult.affectedRows === 0) return db.rollback(() => {
                    res.status(404).json({ message: 'Official not found or no changes made.' });
                });
                
                // 3. Delete old picture file if a NEW picture was uploaded (or old one was removed)
                const pictureChanged = oldProfilePictureUrl && oldProfilePictureUrl !== profilePictureUrl;
                
                if (pictureChanged) {
                    deleteFile(oldProfilePictureUrl);
                }
                
                // 4. Commit the transaction
                db.commit(commitErr => {
                    if (commitErr) return db.rollback(() => {
                        console.error("Transaction Commit Error:", commitErr);
                        res.status(500).json({ message: 'Failed to complete official update.' });
                    });
                    
                    // Respond with the updated official (by returning the fields sent)
                    res.status(200).json({ 
                        message: 'Official updated successfully!',
                        official: { 
                            id: officialId, 
                            first_name: firstName, 
                            middle_initial: middleInitial,
                            last_name: lastName,
                            contact_number: contactNumber,
                            category: category,
                            status: status,
                            position: position,
                            committee: committee,
                            profile_picture_url: profilePictureUrl,
                            // Note: created_at and updated_at will not be returned here
                        }
                    });
                });
            });
        });
    });
});


// GET /api/admin/content/all - Fetches all posts and jobs with response counts
app.get('/api/admin/content/all', (req, res) => {
    // NOTE: Implement isAdmin middleware here for security
    
    // CORRECTION APPLIED: Changed 'p.content_body' to 'p.body'
    const sql = `
        (
            SELECT
                p.id,
                p.title,
                p.body AS content_body,  -- *** CORRECTED COLUMN NAME ***
                'Post' AS content_type,
                p.created_at,
                u.name AS author_name,
                (SELECT COUNT(r.id) FROM responses r WHERE r.post_id = p.id) AS response_count
            FROM posts p
            LEFT JOIN users u ON p.user_id = u.id
        )
        UNION ALL
        (
            SELECT
                j.id,
                j.title,
                j.body AS content_body, 
                'Job' AS content_type,
                j.created_at,
                u.name AS author_name,
                (SELECT COUNT(r.id) FROM responses r WHERE r.job_id = j.id) AS response_count
            FROM jobs j
            LEFT JOIN users u ON j.user_id = u.id
        )
        ORDER BY created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Database query error for admin content:', err);
            return res.status(500).json({ message: 'Failed to retrieve content.' });
        }
        res.status(200).json({ content: results });
    });
});

// GET /api/admin/content/post/responses/:contentId - Get all responses for a thread
app.get('/api/admin/content/post/responses/:postId', (req, res) => {
    const { postId } = req.params;
    
    const sql = `
        SELECT 
            r.id,
            r.content AS response_content,
            r.created_at,
            u.name AS author_name
        FROM responses r
        JOIN users u ON r.user_id = u.id
        WHERE r.post_id = ?
        ORDER BY r.created_at ASC
    `;

    db.query(sql, [postId], (err, results) => {
        if (err) {
            console.error('Database query error for post responses:', err);
            return res.status(500).json({ message: 'Failed to retrieve post responses.' });
        }
        res.status(200).json({ responses: results });
    });
});

// GET /api/admin/content/job/responses/:contentId - Get all applications for a job
app.get('/api/admin/content/job/responses/:jobId', (req, res) => {
    const { jobId } = req.params;
    
    // Assuming job applications/responses are stored in the same 'responses' table but linked by job_id
    const sql = `
        SELECT 
            r.id,
            r.content AS response_content, -- This might contain application text or a link to a CV
            r.created_at,
            u.name AS author_name
        FROM responses r
        JOIN users u ON r.user_id = u.id
        WHERE r.job_id = ?
        ORDER BY r.created_at ASC
    `;

    db.query(sql, [jobId], (err, results) => {
        if (err) {
            console.error('Database query error for job applications:', err);
            return res.status(500).json({ message: 'Failed to retrieve job applications.' });
        }
        res.status(200).json({ responses: results });
    });
});


app.get('/api/admin/jobs/all', (req, res) => {
    
    // SQL query to fetch all jobs, including author details, contact number, 
    // and the count of applications (responses)
    const SQL_FETCH_ALL_JOBS = `
        SELECT 
            j.id, 
            j.title, 
            j.body AS content_body, 
            'Job' AS content_type, 
            j.tag, 
            j.created_at, 
            j.media_url, 
            j.contact_number, -- Key job field
            u.id AS author_id,
            u.name AS author_name,
            up.profile_picture_url AS author_picture_url, 
            CAST(COUNT(r.id) AS UNSIGNED) AS response_count 
        FROM jobs j
        JOIN users u ON j.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id 
        LEFT JOIN responses r ON j.id = r.job_id
        GROUP BY 
            j.id, j.title, j.body, j.tag, j.created_at, j.media_url, j.contact_number, 
            u.id, u.name, up.profile_picture_url
        ORDER BY j.created_at DESC
    `;

    db.query(SQL_FETCH_ALL_JOBS, (err, results) => {
        if (err) {
            console.error("Database error fetching all jobs for admin:", err);
            return res.status(500).json({ message: 'Failed to fetch job listings.' });
        }
        
        // Helper function to format media_url from JSON string to array
        const formatMediaUrls = (row) => {
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
            return mediaUrls;
        };

        const formattedResults = results.map(row => ({
            ...row,
            media_url: formatMediaUrls(row)
        }));

        res.status(200).json({ jobs: formattedResults });
    });
});


app.post('/api/admin/news', (req, res) => {
    const { 
        title, category, content, featured_image_url, 
        valid_until, posted_by, target_audience, attachments_json 
    } = req.body;

    // Basic validation
    if (!title || !category || !content || !posted_by) {
        return res.status(400).json({ message: 'Missing required news fields.' });
    }

    const SQL_INSERT_NEWS = `
        INSERT INTO barangay_news 
        (title, category, content, featured_image_url, valid_until, posted_by, target_audience, attachments_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        title, category, content, featured_image_url || null, 
        valid_until || null, posted_by, target_audience || null, attachments_json || null
    ];

    db.query(SQL_INSERT_NEWS, values, (err, result) => {
        if (err) {
            console.error("Database error adding news:", err);
            return res.status(500).json({ message: 'Failed to add news item.' });
        }
        res.status(201).json({ message: 'News item added successfully', newsId: result.insertId });
    });
});

// 2. GET: Fetch All News Items (for Admin)
app.get('/api/admin/news', (req, res) => {
    // Fetch all news items, including deleted ones (for admin view/restore logic, if needed)
    // We'll filter only non-deleted ones for simplicity in this initial fetch.
    const SQL_FETCH_ALL_NEWS = `
        SELECT 
            id, title, category, content, featured_image_url, 
            DATE_FORMAT(date_published, '%Y-%m-%d %H:%i:%s') as date_published, 
            valid_until, posted_by, target_audience, attachments_json, 
            is_deleted
        FROM barangay_news
        WHERE is_deleted = FALSE
        ORDER BY date_published DESC
    `;

    db.query(SQL_FETCH_ALL_NEWS, (err, results) => {
        if (err) {
            console.error("Database error fetching all news for admin:", err);
            return res.status(500).json({ message: 'Failed to fetch news listings.' });
        }
        
        // Helper function to format attachments_json from string to array
        const formatAttachments = (row) => {
            let attachments = [];
            if (row.attachments_json) {
                try {
                    attachments = JSON.parse(row.attachments_json);
                } catch (e) {
                    console.warn("Could not parse attachments_json:", row.attachments_json);
                }
            }
            return attachments;
        };

        const formattedResults = results.map(row => ({
            ...row,
            attachments: formatAttachments(row),
            // Remove the raw JSON string from the final output
            attachments_json: undefined 
        }));

        res.json(formattedResults);
    });
});

// 3. PUT: Update News Item
app.put('/api/admin/news/:id', (req, res) => {
    const newsId = req.params.id;
    const { 
        title, category, content, featured_image_url, 
        valid_until, posted_by, target_audience, attachments_json 
    } = req.body;

    if (!title || !category || !content || !posted_by) {
        return res.status(400).json({ message: 'Missing required news fields.' });
    }

    const SQL_UPDATE_NEWS = `
        UPDATE barangay_news SET 
            title = ?, category = ?, content = ?, featured_image_url = ?, 
            valid_until = ?, posted_by = ?, target_audience = ?, attachments_json = ?
        WHERE id = ? AND is_deleted = FALSE
    `;

    const values = [
        title, category, content, featured_image_url || null, 
        valid_until || null, posted_by, target_audience || null, attachments_json || null,
        newsId
    ];

    db.query(SQL_UPDATE_NEWS, values, (err, result) => {
        if (err) {
            console.error("Database error updating news:", err);
            return res.status(500).json({ message: 'Failed to update news item.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'News item not found or already deleted.' });
        }
        res.json({ message: 'News item updated successfully' });
    });
});

// 4. DELETE: Soft Delete News Item
app.delete('/api/admin/news/:id', (req, res) => {
    const newsId = req.params.id;
    
    // Perform a soft delete
    const SQL_DELETE_NEWS = `
        UPDATE barangay_news SET is_deleted = TRUE 
        WHERE id = ?
    `;

    db.query(SQL_DELETE_NEWS, [newsId], (err, result) => {
        if (err) {
            console.error("Database error deleting news:", err);
            return res.status(500).json({ message: 'Failed to delete news item.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'News item not found.' });
        }
        res.json({ message: 'News item successfully deleted.' });
    });
});

app.get('/api/news', (req, res) => {
    // The query is identical to the admin version, excluding 'is_deleted' for safety 
    // but relies on 'is_deleted = FALSE' to only show active news.
    const SQL_FETCH_ALL_NEWS = `
        SELECT id, title, category, content, featured_image_url, date_published, 
        valid_until, posted_by, target_audience, attachments_json 
        FROM barangay_news 
        WHERE is_deleted = FALSE 
        ORDER BY date_published DESC
    `;
    
    db.query(SQL_FETCH_ALL_NEWS, (err, results) => {
        if (err) {
            console.error("Database error fetching public news:", err);
            return res.status(500).json({ message: 'Failed to fetch news.' });
        }
        
        // Pass the results directly to the frontend
        res.status(200).json(results);
    });
});



// --- ADMIN ANNOUNCEMENT ROUTES ---

// 1. GET ALL ANNOUNCEMENTS (For Admin Dashboard)
app.get('/api/admin/announcements', (req, res) => {
    const SQL_FETCH_ALL_ANNOUNCEMENTS = `
        SELECT id, title, category, content, featured_image_url, date_published, 
        valid_until, posted_by, target_audience, attachments_json, is_deleted
        FROM barangay_announcements 
        ORDER BY date_published DESC
    `;
    
    db.query(SQL_FETCH_ALL_ANNOUNCEMENTS, (err, results) => {
        if (err) {
            console.error("Database error fetching admin announcements:", err);
            return res.status(500).json({ message: 'Failed to fetch announcement items.' });
        }
        res.json(results);
    });
});

// 2. CREATE NEW ANNOUNCEMENT (Add)
app.post('/api/admin/announcements', (req, res) => {
    const { 
        title, category, content, featured_image_url, 
        valid_until, posted_by, target_audience, attachments_json 
    } = req.body;
    
    const SQL_INSERT_ANNOUNCEMENT = `
        INSERT INTO barangay_announcements 
        (title, category, content, featured_image_url, valid_until, posted_by, target_audience, attachments_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(SQL_INSERT_ANNOUNCEMENT, [
        title, category, content, featured_image_url, 
        valid_until || null, posted_by, target_audience, attachments_json || null 
    ], (err, result) => {
        if (err) {
            console.error("Database error creating announcement:", err);
            return res.status(500).json({ message: 'Failed to create new announcement.' });
        }
        res.status(201).json({ 
            message: 'Announcement successfully created.', 
            id: result.insertId 
        });
    });
});

// 3. UPDATE ANNOUNCEMENT (Edit)
app.put('/api/admin/announcements/:id', (req, res) => {
    const announcementId = req.params.id;
    const { 
        title, category, content, featured_image_url, 
        valid_until, posted_by, target_audience, attachments_json 
    } = req.body;

    const SQL_UPDATE_ANNOUNCEMENT = `
        UPDATE barangay_announcements 
        SET title = ?, category = ?, content = ?, featured_image_url = ?, 
            valid_until = ?, posted_by = ?, target_audience = ?, attachments_json = ?
        WHERE id = ?
    `;

    db.query(SQL_UPDATE_ANNOUNCEMENT, [
        title, category, content, featured_image_url, 
        valid_until || null, posted_by, target_audience, attachments_json || null,
        announcementId
    ], (err, result) => {
        if (err) {
            console.error("Database error updating announcement:", err);
            return res.status(500).json({ message: 'Failed to update announcement item.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Announcement item not found.' });
        }
        res.json({ message: 'Announcement item successfully updated.' });
    });
});

// 4. DELETE/ARCHIVE ANNOUNCEMENT (Soft Delete)
app.delete('/api/admin/announcements/:id', (req, res) => {
    const announcementId = req.params.id;

    const SQL_DELETE_ANNOUNCEMENT = `
        UPDATE barangay_announcements SET is_deleted = TRUE 
        WHERE id = ?
    `;

    db.query(SQL_DELETE_ANNOUNCEMENT, [announcementId], (err, result) => {
        if (err) {
            console.error("Database error archiving announcement:", err);
            return res.status(500).json({ message: 'Failed to archive announcement item.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Announcement item not found.' });
        }
        res.json({ message: 'Announcement item successfully archived.' });
    });
});


app.get('/api/announcements', (req, res) => {
    // Selects all non-deleted announcements, ordered by publish date
    const SQL_FETCH_ALL_ANNOUNCEMENTS = `
        SELECT 
            id, title, category, content, featured_image_url, 
            date_published, valid_until, posted_by, target_audience, attachments_json 
        FROM barangay_announcements 
        WHERE is_deleted = FALSE
        ORDER BY date_published DESC
    `;

    db.query(SQL_FETCH_ALL_ANNOUNCEMENTS, (err, results) => {
        if (err) {
            console.error("Database error fetching public announcements:", err);
            return res.status(500).json({ message: 'Failed to fetch announcement listings.' });
        }

        // Helper function to format attachments_json from string to array
        const formatAttachments = (row) => {
            let attachments = [];
            if (row.attachments_json) {
                try {
                    attachments = JSON.parse(row.attachments_json);
                } catch (e) {
                    console.warn("Could not parse attachments_json in public route:", row.attachments_json);
                }
            }
            return attachments;
        };

        const formattedResults = results.map(row => ({
            ...row, 
            attachments: formatAttachments(row),
            // Remove the raw JSON string from the final output
            attachments_json: undefined 
        }));

        res.status(200).json(formattedResults);
    });
});



app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
