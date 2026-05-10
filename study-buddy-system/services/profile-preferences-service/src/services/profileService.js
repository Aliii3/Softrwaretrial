import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/db.js';
import { publishEvent } from '../config/kafka.js';

export const updatePreferences = async (userId, data) => {
  const profile = await prisma.profile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });

  const event = {
    eventName: 'UserPreferencesUpdated',
    timestamp: new Date().toISOString(),
    producer: 'profile-service',
    correlationId: uuidv4(),
    payload: { userId, ...data },
  };

  console.log('Publishing event:', event);
  await publishEvent('UserPreferencesUpdated', event);

  return profile;
};
