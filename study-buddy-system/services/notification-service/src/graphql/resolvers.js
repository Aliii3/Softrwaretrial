import {
  getNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
} from "../services/notificationService.js";

export const resolvers = {
  Query: {
    getNotifications: async (_, { userId }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return await getNotifications(userId);
    },

    getUnreadNotifications: async (_, { userId }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return await getUnreadNotifications(userId);
    },
  },

  Mutation: {
    markNotificationAsRead: async (_, { id }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return await markAsRead(id, user.userId);
    },

    markAllNotificationsAsRead: async (_, { userId }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return await markAllAsRead(userId);
    },
  },
};
