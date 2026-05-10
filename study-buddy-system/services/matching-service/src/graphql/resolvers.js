import {
  getRecommendedMatches,
  getMatchById,
  syncUserProfile,
  syncUserAvailability,
  runMatchingForUser,
} from "../services/matchingService.js";
import prisma from "../config/db.js";

export const resolvers = {
  Query: {
    getRecommendedMatches: async (_, { userId }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return await getRecommendedMatches(userId);
    },

    getMatch: async (_, { id }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return await getMatchById(id);
    },

    getUserProfile: async (_, { userId }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return await prisma.userProfile.findUnique({ where: { userId } });
    },
  },

  Mutation: {
    syncUserProfile: async (_, { userId, courses, topics, studyPace, studyMode, groupSize, studyStyle }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return await syncUserProfile(userId, courses, topics, studyPace, studyMode, groupSize, studyStyle);
    },

    syncUserAvailability: async (_, { userId, slots }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return await syncUserAvailability(userId, slots);
    },

    computeMatches: async (_, { userId }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return await runMatchingForUser(userId);
    },
  },
};
