import { registerUser, loginUser } from "../services/authService.js";
import { getUserById } from "../services/userService.js";

export const resolvers = {
  Query: {
    getMe: async (_, __, { user }) => {
      if (!user) throw new Error("Not authenticated");

      return await getUserById(user.userId);
    },
  },

  Mutation: {
    register: async (_, args) => {
      return await registerUser(args);
    },

    login: async (_, { email, password }) => {
      return await loginUser(email, password);
    },
  },
};