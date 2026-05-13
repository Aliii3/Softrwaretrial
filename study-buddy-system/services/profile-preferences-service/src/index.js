import 'dotenv/config';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

import { typeDefs } from './graphql/schema.js';
import { resolvers } from './graphql/resolvers.js';
import { connectProducer } from './config/kafka.js';
import { authenticate } from './middleware/authMiddleware.js';

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const startServer = async () => {
  try {
    await connectProducer();
    console.log('Kafka producer connected');
  } catch {
    console.log('Kafka not available, skipping...');
  }

  const port = parseInt(process.env.PORT) || 4005;
  const { url } = await startStandaloneServer(server, {
    listen: { port, host: "0.0.0.0" },
    context: async ({ req }) => {
      const user = authenticate(req);
      return { user };
    },
  });

  console.log(`Profile Service ready at ${url}`);
};

startServer();
