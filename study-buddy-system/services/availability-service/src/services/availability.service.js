import prisma from '../config/db.js';
import { Prisma } from '@prisma/client';
import { sendEvent } from '../config/kafka.js';
import { v4 as uuidv4 } from 'uuid';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const normalizeDayOfWeek = (dayOfWeek) => {
  if (typeof dayOfWeek !== 'string') {
    throw new Error('Day of week is required');
  }

  const normalized = DAYS.find((day) => day.toLowerCase() === dayOfWeek.trim().toLowerCase());

  if (!normalized) {
    throw new Error('Invalid day of week');
  }

  return normalized;
};

const normalizeTime = (time, fieldName) => {
  if (typeof time !== 'string' || !TIME_PATTERN.test(time.trim())) {
    throw new Error(`${fieldName} must use HH:mm format`);
  }

  return time.trim();
};

const validateTimeRange = (startTime, endTime) => {
  const start = normalizeTime(startTime, 'Start time');
  const end = normalizeTime(endTime, 'End time');

  if (start >= end) {
    throw new Error('Start time must be before end time');
  }

  return { start, end };
};

const toMatchingFormat = (slot) => ({
  dayOfWeek: slot.dayOfWeek,
  startTime: slot.startTime,
  endTime: slot.endTime,
});

const publishAvailabilityEvent = async (userId, slotId, action) => {
  const allSlots = await prisma.availabilitySlot.findMany({
    where: { userId },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });

  await sendEvent('availability-events', {
    eventName: 'AvailabilityUpdated',
    timestamp: new Date().toISOString(),
    producer: 'availability-service',
    correlationId: uuidv4(),
    payload: {
      userId,
      slotId,
      action,
      slots: allSlots.map(toMatchingFormat),
    },
  });
};

export const getAllSlots = async (userId) => {
  return prisma.availabilitySlot.findMany({
    where: { userId },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
};

export const getOneSlot = async (id) => {
  return prisma.availabilitySlot.findUnique({
    where: { id },
  });
};

export const createSlot = async (userId, dayOfWeek, startTime, endTime) => {
  const normalizedDay = normalizeDayOfWeek(dayOfWeek);
  const { start, end } = validateTimeRange(startTime, endTime);

  const slot = await prisma.$transaction(
    async (tx) => {
      await assertNoOverlap(tx, userId, normalizedDay, start, end);

      return tx.availabilitySlot.create({
        data: {
          userId,
          dayOfWeek: normalizedDay,
          startTime: start,
          endTime: end,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );

  await publishAvailabilityEvent(userId, slot.id, 'CREATED');

  return slot;
};

export const deleteSlot = async (id) => {
  const deleted = await prisma.availabilitySlot.delete({
    where: { id },
  });

  await publishAvailabilityEvent(deleted.userId, id, 'DELETED');

  return deleted;
};

export const updateSlot = async (id, updates) => {
  const exists = await getOneSlot(id);

  if (!exists) {
    throw new Error('Slot not found');
  }

  const normalizedDay = updates.dayOfWeek ? normalizeDayOfWeek(updates.dayOfWeek) : exists.dayOfWeek;
  const { start, end } = validateTimeRange(updates.startTime || exists.startTime, updates.endTime || exists.endTime);

  const updated = await prisma.$transaction(
    async (tx) => {
      await assertNoOverlap(tx, exists.userId, normalizedDay, start, end, id);

      return tx.availabilitySlot.update({
        where: { id },
        data: {
          dayOfWeek: normalizedDay,
          startTime: start,
          endTime: end,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );

  await publishAvailabilityEvent(exists.userId, id, 'UPDATED');

  return updated;
};

const assertNoOverlap = async (db, userId, dayOfWeek, startTime, endTime, excludedSlotId) => {
  const existingSlots = await db.availabilitySlot.findMany({
    where: {
      userId,
      dayOfWeek,
      ...(excludedSlotId && { NOT: { id: excludedSlotId } }),
    },
  });

  for (const slot of existingSlots) {
    if (startTime < slot.endTime && endTime > slot.startTime) {
      throw new Error('Time slot overlaps with an existing weekly slot');
    }
  }
};

