import type { Request, Response, NextFunction } from 'express';

export interface AuthUserToken {
  uid: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

export type AuthRequest = Request & {
  user?: AuthUserToken;
};

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
  }

  try {
    // Integration point: Decode and verify authentication token
    req.user = { uid: token, email: 'authenticated-user@icmrs.gov' };
    next();
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (token) {
    try {
      // Integration point: Decode optional bearer token
      req.user = { uid: token };
    } catch (error) {
      console.warn('Optional auth token could not be verified:', error);
    }
  }
  next();
};
