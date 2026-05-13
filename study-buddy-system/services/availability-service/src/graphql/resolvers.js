import {
  getAllSlots,
  getOneSlot,
  createSlot,
  updateSlot,
  deleteSlot,
} from '../services/availability.service.js';

const formatSlot = (slot) => ({
  ...slot,
  dayOfWeek: slot.dayOfWeek,
  startTime: slot.startTime,
  endTime: slot.endTime,
});

const getUserId = (user) => user?.userId || user?.id;

const resolvers = {
  Query: {
    getAvailability: async (_, __, context) => {
      const userId = getUserId(context.user);

      if (!userId) {
        throw new Error('Unauthorized');
      }

      const slots = await getAllSlots(userId);
      return slots.map(formatSlot);
    },

    getSlotById: async (_, { id }, context) => {
      const userId = getUserId(context.user);

      if (!userId) {
        throw new Error('Unauthorized');
      }

      const slot = await getOneSlot(id);

      if (!slot) {
        throw new Error('Slot not found');
      }

      if (slot.userId !== userId) {
        throw new Error('Forbidden');
      }

      return formatSlot(slot);
    },
  },

  Mutation: {
    createSlot: async (_, { dayOfWeek, startTime, endTime }, context) => {
      const userId = getUserId(context.user);

      if (!userId) {
        throw new Error('Unauthorized');
      }

      const slot = await createSlot(userId, dayOfWeek, startTime, endTime);
      return formatSlot(slot);
    },

    updateSlot: async (_, { id, dayOfWeek, startTime, endTime }, context) => {
      const userId = getUserId(context.user);

      if (!userId) {
        throw new Error('Unauthorized');
      }

      const slot = await getOneSlot(id);

      if (!slot) {
        throw new Error('Slot not found');
      }

      if (slot.userId !== userId) {
        throw new Error('Forbidden');
      }

      const updated = await updateSlot(id, { dayOfWeek, startTime, endTime });
      return formatSlot(updated);
    },

    deleteSlot: async (_, { id }, context) => {
      const userId = getUserId(context.user);

      if (!userId) {
        throw new Error('Unauthorized');
      }

      const slot = await getOneSlot(id);

      if (!slot) {
        throw new Error('Slot not found');
      }

      if (slot.userId !== userId) {
        throw new Error('Forbidden');
      }

      const deleted = await deleteSlot(id);
      return formatSlot(deleted);
    },
  },
};

export default resolvers;
