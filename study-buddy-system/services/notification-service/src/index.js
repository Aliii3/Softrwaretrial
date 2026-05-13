import "dotenv/config";
import { ApolloServer } from "apollo-server";
import { typeDefs } from "./graphql/schema.js";
import { resolvers } from "./graphql/resolvers.js";
import { getUserFromToken } from "./middleware/authMiddleware.js";
import { connectConsumer } from "./config/kafka.js";
import { handleKafkaMessage } from "./services/notificationService.js";

try {
  await connectConsumer(handleKafkaMessage);
  console.log("Kafka consumer connected — listening for MatchFound, StudySessionCreated, StudySessionJoined, BuddyRequestCreated");
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

server.listen({ port: parseInt(process.env.PORT || "4003", 10), host: "0.0.0.0" }).then(({ url }) => {
  console.log(`Notification Service ready at ${url}`);
});
