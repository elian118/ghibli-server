import { Request, Response } from 'express';
import { ApolloServer, AuthenticationError } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { FilmResolver } from '../resolvers/Film';
import { CutResolver } from '../resolvers/Cut';
import { UserResolver } from '../resolvers/User';
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import { DEFAULT_JWT_SECRET_KEY, JwtVerifiedUser } from '../utils/jwt-auth';
import jwt from 'jsonwebtoken';
import { IncomingHttpHeaders } from 'http';

export interface MyContext {
  req: Request;
  res: Response;
}

const createApolloServer = async (): Promise<ApolloServer> =>
  new ApolloServer<MyContext>({
    schema: await buildSchema({
      resolvers: [FilmResolver, CutResolver, UserResolver],
    }),
    plugins: [ApolloServerPluginLandingPageLocalDefault()],
    context: ({ req, res }) => {
      // 액세스 토큰 검증
      const verified = verifyAccessTokenFromReqHeaders(req.headers);
      return { req, res, verifiedUser: verified };
    },
  });

export default createApolloServer;

export const verifyAccessToken = (accessToken?: string): JwtVerifiedUser | null => {
  if (accessToken) return null;
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
