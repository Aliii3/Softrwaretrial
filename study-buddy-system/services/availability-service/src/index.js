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
console.log("JWT SECRET LOADED:", process.env.JWT_SECRET);
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
  
  context: async ({ req }) => {
    const rawHeader = req.headers.authorization || req.headers.Authorization || "";
    const authHeader = rawHeader.replace(/^"+|"+$/g, "");

  console.log("HEADERS:", req.headers);


  const token = authHeader.startsWith("Bearer ")
  ? authHeader.split(" ")[1]
  : null;
  
  const user = token ? getUserFromToken(token) : null;

  if (!user) {
    console.log("No valid user from token");
    return { user: null };
  }

  console.log("AUTHENTICATED USER:", user);
  return { user, isDevUser: false };
},
});

console.log(`🚀 Server ready at ${url}`);