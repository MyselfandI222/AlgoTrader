import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// @ts-ignore - No official types available for passport-yahoo-oauth2
import { Strategy as YahooStrategy } from 'passport-yahoo-oauth2';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { storage } from './storage';
import type { Express, RequestHandler } from 'express';

const pgStore = connectPg(session);

export function setupSession(app: Express) {
  // Use memory store for now since we're having issues with PostgreSQL session store
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }));
}

export function setupAuth(app: Express) {
  setupSession(app);
  
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        // Check if user exists by provider ID
        let user = await storage.getUserByProvider('google', profile.id);
        
        if (!user) {
          // Check if user exists by email
          user = await storage.getUserByEmail(profile.emails?.[0]?.value || '');
          
          if (!user) {
            // Create new user
            user = await storage.createOAuthUser({
              email: profile.emails?.[0]?.value || '',
              name: profile.displayName,
              avatar: profile.photos?.[0]?.value,
              provider: 'google',
              providerId: profile.id,
            });
          } else {
            // Link existing user to Google
            await storage.updateUser(user.id, {
              provider: 'google',
              providerId: profile.id,
              name: user.name || profile.displayName,
              avatar: user.avatar || profile.photos?.[0]?.value,
            });
          }
        }
        
        return done(null, user);
      } catch (error) {
        return done(error, undefined);
      }
    }));
  }

  // Yahoo OAuth Strategy
  if (process.env.YAHOO_CLIENT_ID && process.env.YAHOO_CLIENT_SECRET) {
    passport.use(new YahooStrategy({
      clientID: process.env.YAHOO_CLIENT_ID,
      clientSecret: process.env.YAHOO_CLIENT_SECRET,
      callbackURL: "/api/auth/yahoo/callback"
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        // Check if user exists by provider ID
        let user = await storage.getUserByProvider('yahoo', profile.id);
        
        if (!user) {
          // Check if user exists by email
          user = await storage.getUserByEmail(profile.emails?.[0]?.value || '');
          
          if (!user) {
            // Create new user
            user = await storage.createOAuthUser({
              email: profile.emails?.[0]?.value || '',
              name: profile.displayName,
              avatar: profile.photos?.[0]?.value,
              provider: 'yahoo',
              providerId: profile.id,
            });
          } else {
            // Link existing user to Yahoo
            await storage.updateUser(user.id, {
              provider: 'yahoo',
              providerId: profile.id,
              name: user.name || profile.displayName,
              avatar: user.avatar || profile.photos?.[0]?.value,
            });
          }
        }
        
        return done(null, user);
      } catch (error) {
        return done(error, undefined);
      }
    }));
  }

  // Serialize/Deserialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Authentication routes
  app.get('/api/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login?error=google' }),
    (req, res) => {
      res.redirect('/');
    }
  );

  app.get('/api/auth/yahoo',
    passport.authenticate('yahoo', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/yahoo/callback',
    passport.authenticate('yahoo', { failureRedirect: '/login?error=yahoo' }),
    (req, res) => {
      res.redirect('/');
    }
  );

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  });

  app.get('/api/auth/user', (req, res) => {
    if (req.isAuthenticated() && req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });
}

export const requireAuth: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};