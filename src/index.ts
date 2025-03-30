import 'reflect-metadata';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import express from 'express';
import http from 'http';
import { buildSchema } from 'type-graphql';
import { FilmResolver } from './resolvers/Film';
import { CutResolver } from './resolvers/Cut';

async function main() {
  const app = express();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [FilmResolver, CutResolver],
    }),
    plugins: [ApolloServerPluginLandingPageLocalDefault()],
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  const httpServer = http.createServer(app);

  httpServer.listen(process.env.PORT || 4000, () => {
    process.env.NODE_ENV !== 'production'
      ? console.log(
          `Server started on => http://localhost:${process.env.PORT || 4000}\ngraphql playground => http://localhost:${process.env.PORT || 4000}/graphql`,
        )
      : console.log('Production server started...');
  });
}

main().catch((err) => console.error(err));
