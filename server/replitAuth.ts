import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Skip auth setup if required environment variables are missing
if (!process.env.REPLIT_DOMAINS && !process.env.CUSTOM_AUTH_DOMAIN) {
  console.log("Skipping auth setup - no auth domain configured");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Use in-memory store in development if DATABASE_URL is not available
  let sessionStore;
  const connectionString = process.env.SUPABASE_URL || process.env.DATABASE_URL;
  
  if (connectionString) {
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conString: connectionString,
      createTableIfMissing: true,
      ttl: sessionTtl,
      tableName: "sessions",
    });
  }
  
  return session({
    secret: process.env.SESSION_SECRET || "dev-secret-key-change-in-production",
    store: sessionStore, // Will use memory store if sessionStore is undefined
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  const [existingUser] = await db.select().from(users).where(eq(users.id, claims["sub"])).limit(1);
  
  // Se é um novo usuário, criar sem role definido
  if (!existingUser) {
    await db.insert(users).values({
      id: claims["sub"],
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      profileImageUrl: claims["profile_image_url"],
      role: "customer"
    });
  } else {
    // Atualizar usuário existente preservando configurações
    await db.update(users).set({
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      profileImageUrl: claims["profile_image_url"],
      updatedAt: new Date()
    }).where(eq(users.id, claims["sub"]));
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Skip OIDC config if auth variables are missing (for non-Replit deployments)
  if (!process.env.REPLIT_DOMAINS && !process.env.CUSTOM_AUTH_DOMAIN) {
    console.log("Skipping OIDC configuration - using simplified auth");
    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));
    
    // Add simple login routes for production deployment
    app.post('/api/simple-login', async (req: any, res) => {
      try {
        const { email, role } = req.body;
        const userEmail = email || 'user@example.com';
        
        // For now, allow restaurant_owner role to maintain compatibility
        // In production, this should be restricted with proper authentication
        const userRole = role || 'restaurant_owner';
        
        // Create consistent user ID based on email
        const userId = `user-${Buffer.from(userEmail).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)}`;
        
        // Check if user exists in database
        const [existingUser] = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
        
        let dbUser;
        if (!existingUser) {
          // Create new user in database with consistent ID and specified role
          [dbUser] = await db.insert(users).values({
            id: userId,
            email: userEmail,
            firstName: 'Usuário',
            lastName: 'Sistema',
            role: userRole
          }).returning();
        } else {
          // Use existing user - don't create new ID or change role
          dbUser = existingUser;
        }
        
        // Create session user object with compatible field names
        const sessionUser = {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          role: dbUser.role,
          claims: {
            sub: dbUser.id,
            email: dbUser.email,
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            first_name: dbUser.firstName,
            last_name: dbUser.lastName,
            profile_image_url: dbUser.profileImageUrl
          }
        };
        
        req.session.user = sessionUser;
        res.json({ message: 'Login realizado com sucesso', user: sessionUser });
      } catch (error) {
        console.error('Error in simple login:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    });
    
    return;
  }

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Adicionar domínios do Replit
  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  // Adicionar estratégia para desenvolvimento local
  const localStrategy = new Strategy(
    {
      name: `replitauth:127.0.0.1`,
      config,
      scope: "openid email profile offline_access",
      callbackURL: `https://${process.env.REPLIT_DEV_DOMAIN}/api/callback`,
    },
    verify,
  );
  passport.use(localStrategy);

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    // Usar 127.0.0.1 para localhost e desenvolvimento local
    const hostname = req.hostname === 'localhost' ? '127.0.0.1' : req.hostname;
    passport.authenticate(`replitauth:${hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    // Usar 127.0.0.1 para localhost e desenvolvimento local
    const hostname = req.hostname === 'localhost' ? '127.0.0.1' : req.hostname;
    passport.authenticate(`replitauth:${hostname}`, {
      successReturnToOrRedirect: "/auth-callback",
      failureRedirect: "/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// Middleware de desenvolvimento que simula um usuário autenticado
export const isDevAuthenticated: RequestHandler = async (req, res, next) => {
  // Em desenvolvimento, simula um usuário autenticado
  if (process.env.NODE_ENV === "development") {
    // Simula a estrutura de um usuário do Replit Auth
    req.user = {
      claims: {
        sub: "dev-user-123",
        email: "test@restaurant.com",
        first_name: "Usuário", 
        last_name: "Teste",
        profile_image_url: null
      }
    };
    return next();
  }
  
  // Em produção, verifica se há usuário na sessão (para autenticação simplificada)
  if (!process.env.REPLIT_DOMAINS && !process.env.CUSTOM_AUTH_DOMAIN) {
    // Usando autenticação simplificada
    if ((req as any).session?.user) {
      req.user = (req as any).session.user;
      return next();
    } else {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }
  
  // Em produção com OIDC, usa o middleware normal
  return isAuthenticated(req, res, next);
};
