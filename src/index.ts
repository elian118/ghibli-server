import * as dotenv from 'dotenv';
import 'reflect-metadata';
import express from 'express';
import http from 'http';
import { createDB } from './db/db-clients';
import createApolloServer from './apollo/createApolloServer';

async function main() {
  dotenv.config();
  await createDB();
  const app = express();

  const apolloServer = await createApolloServer();
  await apolloServer.start();
  apolloServer.applyMiddleware({
    app,
    cors: {
      origin: ['http://localhost:3000', 'https://studio.apollographql.com'],
      credentials: true,
    },
  });

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
