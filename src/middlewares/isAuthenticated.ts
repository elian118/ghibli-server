import { MyContext } from '../apollo/createApolloServer';
import { MiddlewareFn } from 'type-graphql';
import { AuthenticationError } from 'apollo-server-express';
import { verifyAccessToken } from '../utils/jwt-auth';

export const isAuthenticated: MiddlewareFn<MyContext> = async ({ context }, next) => {
  const { authorization } = context.req.headers;
  if (!authorization) throw new AuthenticationError('unautenticated');

  const accessToken = authorization.split(' ')[1];
  verifyAccessToken(accessToken);

  if (!context.verifiedUser) throw new AuthenticationError('unautenticated');

  return next();
};
