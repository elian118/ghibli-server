import { Request, Response } from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { FilmResolver } from '../resolvers/Film';
import { CutResolver } from '../resolvers/Cut';
import { UserResolver } from '../resolvers/User';
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import { JwtVerifiedUser, verifyAccessTokenFromReqHeaders } from '../utils/jwt-auth';

export interface MyContext {
  req: Request;
  res: Response;
  verifiedUser?: JwtVerifiedUser;
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
