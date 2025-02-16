import express from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
//import UserControllerPostgre from './modules/postgre/UserController.js';
//import UserControllerFirebase from './modules/firebase/UserController.js';
//import UserControllerGoogle from './modules/firebase/UserController.js';
import UserControllerRedis from './modules/redis/UserController.js';

let users = {};

const isPROD = false;

const app = express();
const PORT = 3001;
const SECRET_KEY = 'your-secret-key'; // Replace with a secure key in production
const REFRESH_SECRET_KEY = 'your-refresh-secret-key'; // Separate key for refresh tokens

// Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'jwt_api_token'],
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
        return res.status(401).json({ message: "Access denied. No token provided" });
    }

    try {
        const decoded = jwt.verify(accessToken, SECRET_KEY);
        req.user = decoded;


        console.log(valid_refreshtoken_set);
        if (valid_refreshtoken_set.has(refreshToken) === false) {
            logout(res);
            return res.status(403).json({ message: "Invalid or expired token" });
        }

        next();
    } catch (error) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};

const useAPIToken = (req, res, next) => {
    const { jwt_api_token } = req.headers;
    if (!jwt_api_token) return res.status(403).json({ message: "No jwt_api_token header" });

    req.sheetID = jwt_api_token;
    if (!users[req.sheetID]) return res.status(403).json({ message: "No valid jwt_api_token header" });
    next();
}

// Register endpoint (simulate user registration)
app.post('/register', useAPIToken, async (req, res) => {
    const { username, password } = req.body;
    console.log("reg", await users[req.sheetID].has(username));
    if (await users[req.sheetID].has(username)) {
        return res.status(400).json({ message: 'Username already exists' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { username, password: hashedPassword };
        await users[req.sheetID].push(newUser);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Error registering user' });
    }
});

// Login endpoint
app.post('/login', useAPIToken, async (req, res) => {
    console.log(req.headers['x-real-ip'] , req.headers['x-forwarded-for'] , req.socket.remoteAddress);
    //on front can be done https://api.ipify.org/?format=json
    
    const { username, password } = req.body;
    const user = await users[req.sheetID].get(username);
    console.log(user);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
        return res.status(401).json({ message: 'Invalid password' });
    }

    const accessToken = jwt.sign({ userId: user.id, username: user.username, API_TOKEN: req.sheetID }, SECRET_KEY, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id, username: user.username, API_TOKEN: req.sheetID }, REFRESH_SECRET_KEY, { expiresIn: '7d' });
    valid_refreshtoken_set.add(refreshToken);
    await users[req.sheetID].addContent({ username: user.username, refreshToken }, 1);


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
app.get('/revoke_token', authenticateToken, useAPIToken, async (req, res) => {
    const { username } = req.user;
    if (username) {
        const sessions = await users[req.sheetID].getUserSessions(username);
        for (const s of sessions) {
            console.log("revoke_token", s);
            valid_refreshtoken_set.delete(s.refreshToken || s.refreshtoken); // postgre dont support case sensitive
        }
        await users[req.sheetID].deleteAllSessions(username);
    }

    res.json({ message: 'revoke sucess!', user: username });
});

// Protected route example
app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'You have access to this protected route!', user: req.user });
});

const logout = async (res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
}

// Logout route
app.post('/logout', useAPIToken, async (req, res) => {
    const { refreshToken } = req.cookies;
    valid_refreshtoken_set.delete(refreshToken);
    await users[req.sheetID].deleteContent('refreshToken', refreshToken, 1);
    logout(res);
    res.json({ message: "Logout successful" });
});

app.get('/', async (req,res) => {
    res.json({ message: "im alive" });
});

// Error handling middleware for CORS
app.use((err, req, res, next) => {
    console.log(err);
    if (err && err.code === 'CORS') {
        console.error('CORS error: ', err);
        res.status(403).json({ error: 'CORS error: Request blocked' });
    } else {
        console.error('error: ', err);
        next(err);
    }
});

// on start
const admin_sheetID = "13LpsvbsydOoM_aKsjJO3HMmikVutRFnMq-dFsL_LvVc";
const GLOBAL_VAR_INDEX = 2;
const REGISTERED_INDEX = 3;
app.listen(PORT, async () => {
    //POSTGRE
    users[admin_sheetID] = new UserControllerRedis();
    await users[admin_sheetID].init();

    // GOOGLESHEETS
    // const config = { sheetID: admin_sheetID, worker: UserController.generateWorker() };
    // users[admin_sheetID] = new UserController(config);
    // await users[admin_sheetID].init();

    // const global_var = await users[admin_sheetID].getRows(GLOBAL_VAR_INDEX);
    // valid_refreshtoken_set = new Set(JSON.parse(global_var[0].content || '[]'));

    // const registered = await users[admin_sheetID].getRows(REGISTERED_INDEX);
    // for (const row of registered) {
    //     const { sheetID, email, key, need_firstSetup } = row;

    //     const config = { sheetID, worker: UserController.generateWorker(email, key.replace(/\\n/g, "\n")) };
    //     users[sheetID] = new UserController(config);
    //     await users[sheetID].init();
    //     if (need_firstSetup) await users[sheetID].firstSetup();

    //     row.need_firstSetup = false;
    //     row.instance.assign(row);
    //     await row.instance.save()
    // }

    // FIREBASE
    // users[admin_sheetID] = new UserControllerFirebase();

    console.log(`Server is running on http://localhost:${PORT}`);
});

// on exit
const doBeforeClose = async () => {
    const valid_refreshtoken = JSON.stringify(Array.from(valid_refreshtoken_set));
    // save valid_refreshtoken
    process.exit(0);
};

process.on('SIGINT', doBeforeClose);
process.on('SIGTERM', doBeforeClose);
