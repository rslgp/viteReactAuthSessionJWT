const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs'); // Import bcryptjs for password hashing

const app = express();
const PORT = 3001;
const SECRET_KEY = 'your-secret-key'; // Replace with a secure key in production
const REFRESH_SECRET_KEY = 'your-refresh-secret-key'; // Separate key for refresh tokens

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Mock user database
const users = [
    { id: 1, username: 'user1', password: '$2a$10$GJrDkWxzC1t3ttQvX4knfu9ESHqFlu7.ZZ7WxwsBkdPp8n61p4YRW' }, // Hashed password
    { id: 2, username: 'user2', password: '$2a$10$GJrDkWxzC1t3ttQvX4knfu9ESHqFlu7.ZZ7WxwsBkdPp8n61p4YRW' }, // Hashed password
];

// Mock refresh token storage (in production, use a database)
let refreshTokens = [];

// Register endpoint (to simulate user registration)
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Check if user already exists
    if (users.some((user) => user.username === username)) {
        return res.status(400).json({ message: 'Username already exists' });
    }

    try {
        // Hash the password using bcryptjs
        const hashedPassword = await bcrypt.hash(password, 10);

        // Store the new user (in a real app, you'd store this in a database)
        const newUser = { id: users.length + 1, username, password: hashedPassword };
        users.push(newUser);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        // If there was an error during hashing, send an error response
        res.status(500).json({ message: 'Error registering user' });
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Find user in the mock database
    const user = users.find((u) => u.username === username);

    if (user) {
        // Compare provided password with the hashed password in the database
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (isPasswordValid) {
            // Generate access token
            const accessToken = jwt.sign({ userId: user.id, username: user.username }, SECRET_KEY, {
                expiresIn: '15m', // Short-lived access token
            });

            // Generate refresh token
            const refreshToken = jwt.sign({ userId: user.id }, REFRESH_SECRET_KEY, {
                expiresIn: '7d', // Long-lived refresh token
            });

            // Store the refresh token
            refreshTokens.push(refreshToken);

            res.json({ accessToken, refreshToken });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Logout endpoint
app.post('/logout', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ message: 'No refresh token provided' });
    }

    // Remove the refresh token from the list
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);

    res.json({ message: 'Logout successful' });
});

// Refresh token endpoint
app.post('/refresh', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }

    if (!refreshTokens.includes(refreshToken)) {
        return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Verify the refresh token
    jwt.verify(refreshToken, REFRESH_SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired refresh token' });
        }

        // Generate a new access token
        const accessToken = jwt.sign(
            { userId: decoded.userId, username: decoded.username },
            SECRET_KEY,
            {
                expiresIn: '15m', // New short-lived access token
            }
        );

        res.json({ accessToken });
    });
});

// Protected endpoint
app.get('/protected', (req, res) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    // Verify JWT
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        res.json({ message: 'Welcome to the protected route!', user: decoded });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
