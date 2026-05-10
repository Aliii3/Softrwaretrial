import { ApolloServer } from "apollo-server";
import { typeDefs } from "./graphql/schema.js";
import { resolvers } from "./graphql/resolvers.js";
import { getUserFromToken } from "./middleware/authMiddleware.js";
import { connectProducer } from "./config/kafka.js";

// ✅ PUT IT HERE (before server starts)
try {
  await connectProducer();
  console.log("Kafka connected");
} catch (err) {
  console.log("Kafka not running, skipping...");
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const token = req.headers.authorization || "";
    const user = getUserFromToken(token);
    return { user };
  },
});

server.listen({ port: 4002 }).then(({ url }) => {
  console.log(`Study Session Server ready at ${url}`);
});