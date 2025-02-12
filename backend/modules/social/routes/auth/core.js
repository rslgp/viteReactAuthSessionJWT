import Router from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import session from './persistence/session.js';

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
  if (!req.isAuthenticated()) {
      return res.redirect("/");
  }
  next();
}

const initAuth = (app) => {  
  //init middleware
  app.use(session);
  
  // Initialize Passport globally
  app.use(passport.initialize());
  app.use(passport.session());
}


export { authRouter, initAuth, isAuthRoute };
