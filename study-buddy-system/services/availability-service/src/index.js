import dotenv from "dotenv";
dotenv.config();
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { connectProducer } from "./config/kafka.js";
import typeDefs from "./graphql/schema.js";
import resolvers from "./graphql/resolvers.js";
import { getUserFromToken } from "./middleware/authMiddleware.js";


try {
  await connectProducer();
  console.log("Kafka connected");
} catch (err) {
  console.log("Kafka not running, skipping...");
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  
});
const port = parseInt(process.env.PORT || "4000", 10);
const { url } = await startStandaloneServer(server, {
  listen: { port, host: "0.0.0.0" },
  
  context: async ({ req }) => {
    const rawHeader = req.headers.authorization || req.headers.Authorization || "";
    const authHeader = rawHeader.replace(/^"+|"+$/g, "");

  const token = authHeader.startsWith("Bearer ")
  ? authHeader.split(" ")[1]
  : null;
  
  const user = token ? getUserFromToken(token) : null;

  if (!user) {
    console.log("No valid user from token");
    return { user: null };
  }

  return { user, isDevUser: false };
},
});

console.log(`🚀 Server ready at ${url}`);
