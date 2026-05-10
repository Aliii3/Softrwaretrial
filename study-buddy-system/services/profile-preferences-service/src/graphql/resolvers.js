import { updatePreferences } from '../services/profileService.js';
import prisma from '../config/db.js';

export const resolvers = {
  Query: {
    getProfile: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return prisma.profile.findUnique({ where: { userId: user.userId } });
    },
  },

  Mutation: {
    updateProfile: async (_, args, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return updatePreferences(user.userId, args);
    },
  },
};
