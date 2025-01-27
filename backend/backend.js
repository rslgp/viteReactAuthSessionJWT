const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;
const SECRET_KEY = 'your-secret-key'; // Replace with a secure key in production
const REFRESH_SECRET_KEY = 'your-refresh-secret-key'; // Separate key for refresh tokens

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Mock user database
const users = [
    { id: 1, username: 'user1', password: 'password1' },
    { id: 2, username: 'user2', password: 'password2' },
];

// Mock refresh token storage (in production, use a database)
let refreshTokens = [];

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Find user in the mock database
    const user = users.find(
        (u) => u.username === username && u.password === password
    );

    if (user) {
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
});

// Logout endpoint
app.post('/logout', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ message: 'No refresh token provided' });
    }

    // Remove the refresh token from the list
    refreshTokens = refreshTokens.filter(token => token !== refreshToken);

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
        const accessToken = jwt.sign({ userId: decoded.userId, username: decoded.username }, SECRET_KEY, {
            expiresIn: '15m', // New short-lived access token
        });

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