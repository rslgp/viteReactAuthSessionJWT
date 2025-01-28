import express from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import UserController from './modules/google/UserController.js';

// Assuming UserController is an instance exported as default
let users = UserController;

const isPROD = false;

const app = express();
const PORT = 3001;
const SECRET_KEY = 'your-secret-key'; // Replace with a secure key in production
const REFRESH_SECRET_KEY = 'your-refresh-secret-key'; // Separate key for refresh tokens

// Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Allow cookies to be sent with requests
}));

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());

let valid_refreshtoken_set = new Set();
// Middleware to verify JWT access token
const authenticateToken = (req, res, next) => {
    const { accessToken, refreshToken } = req.cookies;

    if (!accessToken) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(accessToken, SECRET_KEY);
        req.user = decoded;


        console.log(valid_refreshtoken_set);
        if (valid_refreshtoken_set.has(refreshToken) === false) {
            logout(res);
            return res.status(403).json({ message: "Invalid or expired token." });
        }

        next();
    } catch (error) {
        return res.status(403).json({ message: "Invalid or expired token." });
    }
};

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

    let sessions = await users.getUserSessions(user.username);
    console.log("sessions", sessions);

    const accessToken = jwt.sign({ userId: user.id, username: user.username }, SECRET_KEY, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id, username: user.username }, REFRESH_SECRET_KEY, { expiresIn: '7d' });
    valid_refreshtoken_set.add(refreshToken);
    await users.addContent({ username: user.username, refresh_token: refreshToken }, 1);


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
app.get('/revoke_token', authenticateToken, async (req, res) => {
    const { username } = req.user;
    if (username) {
        const sessions = await users.getUserSessions(username);
        for (const s of sessions) {
            valid_refreshtoken_set.delete(s.refresh_token);
        }
        await users.deleteAllSessions(username);
    }

    res.json({ message: 'revoke sucess!', user: username });
});

// Protected route example
app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'You have access to this protected route!', user: req.user });
});

const logout = (res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
}

// Logout route
app.post('/logout', (req, res) => {
    logout(res);
    res.json({ message: "Logout successful" });
});

// on start
app.listen(PORT, async () => {
    users = UserController;
    await users.init();
    const global_var = await users.getRows(2);
    console.log(global_var);
    valid_refreshtoken_set = new Set(JSON.parse(global_var[0].content || '[]'));
    console.log(`Server is running on http://localhost:${PORT}`);
});

// on exit
const doBeforeClose = async () => {
    const valid_refreshtoken = JSON.stringify(Array.from(valid_refreshtoken_set));
    await users.updateContent({ variable: "valid_refreshtoken", content: valid_refreshtoken }, "variable", "valid_refreshtoken", 2);
    process.exit(0);
};

process.on('SIGINT', doBeforeClose);
process.on('SIGTERM', doBeforeClose);
