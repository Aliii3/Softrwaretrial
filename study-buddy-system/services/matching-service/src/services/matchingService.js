import { randomUUID } from "node:crypto";
import { sendEvent } from "../config/kafka.js";

const WEIGHTS = {
  sharedCourse: 20,
  sharedTopic: 10,
  availability: 20,
  studyMode: 10,
  studyPace: 5,
  studyStyle: 5,
};

const profilesByUserId = new Map();
const availabilityByUserId = new Map();
const matchesByPair = new Map();

const now = () => new Date().toISOString();
const pairKey = (userId, matchedUserId) => `${userId}:${matchedUserId}`;

const overlap = (arr1 = [], arr2 = []) => arr1.filter((x) => arr2.includes(x));

const sortSlots = (slots = []) =>
  [...slots].sort((a, b) => a.dayOfWeek.localeCompare(b.dayOfWeek) || a.startTime.localeCompare(b.startTime));

const hasAvailabilityOverlap = (slots1 = [], slots2 = []) => {
  for (const a of slots1) {
    for (const b of slots2) {
      if (a.dayOfWeek === b.dayOfWeek && a.startTime < b.endTime && b.startTime < a.endTime) {
        return true;
      }
    }
  }
  return false;
};

const computeScore = (profileA, profileB, slotsA, slotsB) => {
  let score = 0;
  const reasons = [];

  const sharedCourses = overlap(profileA.courses, profileB.courses);
  if (sharedCourses.length > 0) {
    const pts = Math.min(sharedCourses.length, 2) * WEIGHTS.sharedCourse;
    score += pts;
    reasons.push(`Shared courses: ${sharedCourses.join(", ")}`);
  }

  const sharedTopics = overlap(profileA.topics, profileB.topics);
  if (sharedTopics.length > 0) {
    const pts = Math.min(sharedTopics.length, 2) * WEIGHTS.sharedTopic;
    score += pts;
    reasons.push(`Shared topics: ${sharedTopics.join(", ")}`);
  }

  if (hasAvailabilityOverlap(slotsA, slotsB)) {
    score += WEIGHTS.availability;
    reasons.push("Overlapping availability");
  }

  if (profileA.studyMode && profileA.studyMode === profileB.studyMode) {
    score += WEIGHTS.studyMode;
    reasons.push(`Same study mode: ${profileA.studyMode}`);
  }

  if (profileA.studyPace && profileA.studyPace === profileB.studyPace) {
    score += WEIGHTS.studyPace;
    reasons.push(`Same study pace: ${profileA.studyPace}`);
  }

  if (profileA.studyStyle && profileA.studyStyle === profileB.studyStyle) {
    score += WEIGHTS.studyStyle;
    reasons.push(`Same study style: ${profileA.studyStyle}`);
  }

  return { score: Math.min(score, 100), reasons };
};

export const handleKafkaMessage = async (topic, data) => {
  if (topic === "UserPreferencesUpdated") {
    const { userId, courses, topics, studyPace, studyMode, groupSize, studyStyle } = data.payload || data;
    await syncUserProfile(userId, courses, topics, studyPace, studyMode, groupSize, studyStyle);
    console.log(`UserProfile cached in memory for user ${userId}`);
    await runMatchingForUser(userId);
  }

  if (topic === "availability-events") {
    const { userId, slots } = data.payload || data;
    await syncUserAvailability(userId, slots || []);
    console.log(`Availability cached in memory for user ${userId}`);
    await runMatchingForUser(userId);
  }
};

export const runMatchingForUser = async (userId) => {
  const profileA = profilesByUserId.get(userId);
  if (!profileA) return [];

  const slotsA = availabilityByUserId.get(userId) || [];
  const otherProfiles = [...profilesByUserId.values()]
    .filter((profile) => profile.userId !== userId)
    .sort((a, b) => a.userId.localeCompare(b.userId));

  const results = [];

  for (const profileB of otherProfiles) {
    const slotsB = availabilityByUserId.get(profileB.userId) || [];
    const { score, reasons } = computeScore(profileA, profileB, slotsA, slotsB);
    const key = pairKey(userId, profileB.userId);

    if (score <= 0) {
      matchesByPair.delete(key);
      continue;
    }

    const existing = matchesByPair.get(key);
    const match = {
      id: existing?.id || randomUUID(),
      userId,
      matchedUserId: profileB.userId,
      score,
      reasons,
      status: existing?.status || "PENDING",
      createdAt: existing?.createdAt || now(),
      updatedAt: now(),
    };

    matchesByPair.set(key, match);
    results.push(match);

    try {
      await sendEvent("MatchFound", {
        event: "MatchFound",
        timestamp: new Date().toISOString(),
        producerService: "matching-service",
        correlationId: match.id,
        payload: { userId, matchedUserId: profileB.userId, score, reasons },
      });
    } catch {
      console.log("Kafka not running, skipping MatchFound event...");
    }
  }

  return results.sort((a, b) => b.score - a.score);
};

export const getRecommendedMatches = async (userId) => {
  return [...matchesByPair.values()]
    .filter((match) => match.userId === userId)
    .sort((a, b) => b.score - a.score);
};

export const getMatchById = async (id) => {
  return [...matchesByPair.values()].find((match) => match.id === id) || null;
};

export const getUserProfile = async (userId) => {
  return profilesByUserId.get(userId) || null;
};

export const syncUserProfile = async (userId, courses, topics, studyPace, studyMode, groupSize, studyStyle) => {
  const existing = profilesByUserId.get(userId);
  const profile = {
    id: existing?.id || randomUUID(),
    userId,
    courses: courses || [],
    topics: topics || [],
    studyPace,
    studyMode,
    groupSize,
    studyStyle,
  };

  profilesByUserId.set(userId, profile);
  return profile;
};

export const syncUserAvailability = async (userId, slots) => {
  const normalized = sortSlots(slots).map((slot) => ({
    userId,
    dayOfWeek: slot.dayOfWeek,
    startTime: slot.startTime,
    endTime: slot.endTime,
  }));

  availabilityByUserId.set(userId, normalized);
  return normalized;
};
