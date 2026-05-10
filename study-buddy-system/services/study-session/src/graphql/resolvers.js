import {
  cancelStudySession,
  createStudySession,
  deleteStudySession,
  getStudySessionById,
  getStudySessions,
  joinStudySession,
  leaveStudySession,
  updateStudySession,
} from "../services/studySessionService.js";

export const resolvers = {
  Query: {
    getStudySessions: async () => {
      return await getStudySessions();
    },

    getStudySession: async (_, { id }) => {
      return await getStudySessionById(id);
    },
  },

  Mutation: {
    createStudySession: async (_, args) => {
      return await createStudySession(args);
    },

    updateStudySession: async (_, { id, ...updates }) => {
      return await updateStudySession(id, updates);
    },

    joinStudySession: async (_, { id, userId, contactInfo }) => {
      return await joinStudySession(id, userId, contactInfo);
    },

    leaveStudySession: async (_, { id, userId }) => {
      return await leaveStudySession(id, userId);
    },

    cancelStudySession: async (_, { id }) => {
      return await cancelStudySession(id);
    },

    deleteStudySession: async (_, { id }) => {
      return await deleteStudySession(id);
    },
  },
};
