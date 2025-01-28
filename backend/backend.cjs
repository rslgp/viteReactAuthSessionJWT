const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
const bcrypt = require('bcryptjs');

const path = require('path'); // CommonJS path module
let esm_modules = {};
let esm_paths = ["./modules/google/UserController.js"];
const esm_imports = async () => {
    console.log("loaded compatible import");
    for (const relativePath of esm_paths) {
        const absolutePath = path.resolve(__dirname, relativePath);
        const folders = relativePath.split('/');
        const className = folders[folders.length - 2] + path.basename(relativePath, '.js');
        esm_modules[className] = await import(absolutePath);
        esm_modules[className] = esm_modules[className].default;
        // console.log(esm_modules[className]);
        console.log(relativePath);
    }
};

let users; // database

const isPROD = false;

const app = express();
const PORT = 3001;
const SECRET_KEY = 'your-secret-key'; // Replace with a secure key in production
const REFRESH_SECRET_KEY = 'your-refresh-secret-key'; // Separate key for refresh tokens

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Allow cookies to be sent with requests
}));

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());

// Middleware to verify JWT access token
const authenticateToken = (req, res, next) => {
    const { accessToken } = req.cookies;

    if (!accessToken) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(accessToken, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: "Invalid or expired token." });
    }
};

// Mock user database
// const users = [
//     { id: 1, username: 'user1', password: '$2a$10$GJrDkWxzC1t3ttQvX4knfu9ESHqFlu7.ZZ7WxwsBkdPp8n61p4YRW' }, // Hashed password
//     { id: 2, username: 'user2', password: '$2a$10$GJrDkWxzC1t3ttQvX4knfu9ESHqFlu7.ZZ7WxwsBkdPp8n61p4YRW' }, // Hashed password
// ];

// Register endpoint (simulate user registration)
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    console.log("reg", await users.has(username));
    if (await users.has(username)) {
        return res.status(400).json({ message: 'Username already exists' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { username, password: hashedPassword };
        await users.push(newUser);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error registering user' });
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await users.get(username);
    console.log(user);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
        return res.status(401).json({ message: 'Invalid password' });
    }

    const accessToken = jwt.sign({ userId: user.id, username: user.username }, SECRET_KEY, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id, username: user.username }, REFRESH_SECRET_KEY, { expiresIn: '7d' });

    // Set the access token as HttpOnly cookie for security
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isPROD,
        sameSite: 'Strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isPROD, // Use true in production for secure cookies over HTTPS
        sameSite: 'Strict', // Prevent CSRF attacks
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Send the refresh token in response (frontend can store it securely in cookies or local storage)
    res.json({ message: 'Login successful' });
});

// Refresh token endpoint
app.post('/refresh', (req, res) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        return res.status(403).json({ message: "Refresh token required" });
    }

    jwt.verify(refreshToken, REFRESH_SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        const newAccessToken = jwt.sign(
            { userId: decoded.userId, username: decoded.username },
            SECRET_KEY,
            { expiresIn: '15m' }
        );

        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: isPROD,
            sameSite: 'Strict',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.json({ message: "Access token refreshed" });
    });
});

// Protected route example
app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'You have access to this protected route!', user: req.user });
});

// Logout route
app.post('/logout', (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: "Logout successful" });
});

app.listen(PORT, async () => {
    await esm_imports();
    console.log(esm_modules);

    users = esm_modules.googleUserController;
    console.log(`Server is running on http://localhost:${PORT}`);
});
