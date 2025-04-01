import jwt from 'jsonwebtoken';
import User from '../entities/User';
import { AuthenticationError } from 'apollo-server-express';
import { IncomingHttpHeaders } from 'http';
import { Response } from 'express';

export const DEFAULT_JWT_SECRET_KEY = process.env.DEFAULT_JWT_SECRET_KEY;
export const REFRESH_JWT_SECRET_KET = process.env.REFRESH_JWT_SECRET_KET;

export interface JwtVerifiedUser {
  userId: User['id'];
}

export const createAccessToken = (user: User): string => {
  const userData: JwtVerifiedUser = { userId: user.id };
  return jwt.sign(userData, process.env.JWT_SECRET_KEY || DEFAULT_JWT_SECRET_KEY, { expiresIn: '10s' });
};

export const verifyAccessToken = (accessToken?: string): JwtVerifiedUser | null => {
  if (!accessToken) return null;
  try {
    return jwt.verify(accessToken, process.env.JWT_SECRET_KEY || DEFAULT_JWT_SECRET_KEY) as JwtVerifiedUser;
  } catch (err) {
    console.error(`access token expired: ${err.expiredAt}`);
    throw new AuthenticationError('access token expired');
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

export const setRefreshTokenHeader = (res: Response, refreshToken: string): void => {
  res.cookie('refreshtoken', refreshToken, {
    httpOnly: true, // 자바스크립트로 접근 불가능하도록 설정
    secure: process.env.NODE_ENV === 'production', // 프로덕션 환경은 https 프로토콜에서만 작동
    sameSite: 'lax', // 사이트 내 요청만 허용
  });
};
