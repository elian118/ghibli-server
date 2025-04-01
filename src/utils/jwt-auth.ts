import jwt from 'jsonwebtoken';
import User from '../entities/User';
import { AuthenticationError } from 'apollo-server-express';
import { IncomingHttpHeaders } from 'http';

export const DEFAULT_JWT_SECRET_KEY = 'secret-key';

export interface JwtVerifiedUser {
  userId: User['id'];
}

export const createAccessToken = (user: User): string => {
  const userData: JwtVerifiedUser = { userId: user.id };
  return jwt.sign(userData, process.env.JWT_SECRET_KEY || DEFAULT_JWT_SECRET_KEY, { expiresIn: '30m' });
};

export const verifyAccessToken = (accessToken?: string): JwtVerifiedUser | null => {
  if (!accessToken) return null;
  try {
    return jwt.verify(accessToken, process.env.JWT_SECRET_KEY || DEFAULT_JWT_SECRET_KEY) as JwtVerifiedUser;
  } catch (err) {
    console.error(`access token expired: ${err.expiredAt}`);
    throw new AuthenticationError('Access token expired');
  }
};

export const verifyAccessTokenFromReqHeaders = (headers: IncomingHttpHeaders): JwtVerifiedUser | null => {
  const { authorization } = headers;
  if (!authorization) return null;

  const accessToken = authorization.split(' ')[1];
  try {
    return verifyAccessToken(accessToken);
  } catch (err) {
    return null;
  }
};

export const createRefreshToken = (user: User): string => {
  const userData: JwtVerifiedUser = { userId: user.id };
  return jwt.sign(userData, process.env.JWT_SECRET_KEY || DEFAULT_JWT_SECRET_KEY, { expiresIn: '14d' });
};
