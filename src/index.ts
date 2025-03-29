import 'reflect-metadata';
import express from "express";
import {ApolloServer, gql} from "apollo-server-express";
import {ApolloServerPluginLandingPageLocalDefault} from "apollo-server-core";
import http from "http";

async function main() {
    const app = express();

    const apolloServer = new ApolloServer({
        typeDefs: gql`
            type Query {hello: String}
        `,
        resolvers: {
            Query: {
                hello: () => `Hello World!`
            }
        },
        plugins: [ApolloServerPluginLandingPageLocalDefault()],
    });

    await apolloServer.start();
    apolloServer.applyMiddleware({ app });

    const httpServer = http.createServer(app);

    httpServer.listen(process.env.PORT || 4000, () => {
        process.env.NODE_ENV !== "production"
            ? console.log(`Server started on => http://localhost:${process.env.PORT || 4000}\ngraphql playground => http://localhost:${process.env.PORT || 4000}/graphql`)
            : console.log('Production server started...');
    });
}

main().catch((err) => console.error(err));