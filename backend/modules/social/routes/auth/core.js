import Router from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { OAuth2Client } from "google-auth-library";

import session from './persistence/session.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); // Initialize Google Auth Client LOGIN USING /token

const authRouter = Router();

// Configure Passport Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
  // Store user profile in session
  return done(null, profile);
}));

// Serialize user (store in session)
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user (retrieve from session)
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Google token verification endpoint
authRouter.post("/google/token", async (req, res) => {
  console.log(req.body);
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    // Verify the token using Google's OAuth2 client
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID, // Ensure the token is for your app
    });

    const payload = ticket.getPayload();
    // Payload will contain user data (e.g., email, name, picture)
    console.log("Google JWT payload:", payload);

    // Find or create the user in your database
    // You can now use the payload to find or create the user
    // For simplicity, let's assume the user is created

    // Simulate user object (You can store this in your DB)
    const user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
    };

    // Serialize user into session (store in session or JWT)
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ error: "Login failed" });
      }
      res.status(200).json({ user });
    });
  } catch (error) {
    console.error("Error verifying Google token:", error);
    res.status(401).json({ error: "Invalid token" });
  }
});

// Google OAuth login
authRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Google OAuth callback
authRouter.get("/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/dashboard");
  }
);

// Logout route
authRouter.get("/logout", (req, res) => {
    req.logout(() => {
        req.session.destroy(); // clear session on redis
        res.redirect("/");
    });
});


const isAuthRoute = (req, res, next) => {
  // middleware
    if (req.isAuthenticated()) {
      next();   
    }else{
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
}

// Check user session
authRouter.get("/user", isAuthRoute, (req, res) => {
  res.json(req.user);
});


const initAuth = (app) => {  
  //init middleware
  app.use(session);
  
  // Initialize Passport globally
  app.use(passport.initialize());
  app.use(passport.session());
}


export { authRouter, initAuth, isAuthRoute };
