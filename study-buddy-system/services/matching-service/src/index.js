import "dotenv/config";
import { ApolloServer } from "apollo-server";
import { typeDefs } from "./graphql/schema.js";
import { resolvers } from "./graphql/resolvers.js";
import { getUserFromToken } from "./middleware/authMiddleware.js";
import { connectProducer, connectConsumer } from "./config/kafka.js";
import { handleKafkaMessage } from "./services/matchingService.js";

try {
  await connectProducer();
  console.log("Kafka producer connected");
} catch {
  console.log("Kafka producer not available, skipping...");
}

try {
  await connectConsumer(handleKafkaMessage);
  console.log("Kafka consumer connected — listening for UserPreferencesUpdated, availability-events");
} catch {
  console.log("Kafka consumer not available, skipping...");
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

server.listen({ port: parseInt(process.env.PORT || "4004", 10), host: "0.0.0.0" }).then(({ url }) => {
  console.log(`Matching Service ready at ${url}`);
});
