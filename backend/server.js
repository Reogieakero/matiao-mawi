// backend/server.js
require('dotenv').config(); 
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 5000;
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10) || 10;

// Middleware Setup
app.use(cors({
    // Allow requests from your React development server (running on 3000 in your case)
    origin: 'http://localhost:3000', 
    methods: 'GET,POST',
    credentials: true,
}));
app.use(bodyParser.json());

// MySQL Connection Configuration (using .env variables)
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE // Correctly using DB_DATABASE key
});

// Connect to MySQL with enhanced error handling
db.connect(err => {
    if (err) {
        console.error('--- MYSQL CONNECTION FAILED! ---'); 
        console.error('Check your .env credentials (DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE).');
        console.error('Database Error:', err.code, err.message);
        // Do NOT exit the process, but log the failure
        return; 
    }
    console.log('Connected to MySQL as id ' + db.threadId);
});

// =========================================================
// API ROUTES
// =========================================================

// POST /api/register - Handles user signup
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!db.threadId) {
        return res.status(503).json({ message: 'Server is unable to connect to the database service.' });
    }

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // 1. Hash the password securely
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // 2. SQL Query to insert the new user (with HASHED password)
        const SQL_INSERT = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        
        db.query(SQL_INSERT, [name, email, hashedPassword], (err, result) => {
            if (err) {
                // Check for duplicate email error (ER_DUP_ENTRY is common MySQL code)
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ message: 'Email already exists. Please login.' });
                }
                console.error('Database insertion error:', err);
                return res.status(500).json({ message: 'Internal server error during registration.' });
            }
            
            // 3. Success Response
            res.status(201).json({ 
                message: 'Account created successfully! Redirecting to login.', 
                userId: result.insertId 
            });
        });

    } catch (error) {
        console.error('Error during password hashing:', error);
        res.status(500).json({ message: 'An unexpected error occurred.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});