import prisma from "../config/db.js";
import { sendEvent } from "../config/kafka.js";

// ─── Scoring weights (total = 100) ───────────────────────────────────────────
const WEIGHTS = {
  sharedCourse: 20,   // up to 2 courses = 40 pts
  sharedTopic: 10,    // up to 2 topics  = 20 pts
  availability: 20,   // any overlap     = 20 pts
  studyMode: 10,
  studyPace: 5,
  studyStyle: 5,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const overlap = (arr1 = [], arr2 = []) =>
  arr1.filter((x) => arr2.includes(x));

const hasAvailabilityOverlap = (slots1 = [], slots2 = []) => {
  for (const a of slots1) {
    for (const b of slots2) {
      if (
        a.dayOfWeek === b.dayOfWeek &&
        a.startTime < b.endTime &&
        b.startTime < a.endTime
      ) {
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

// ─── Kafka event handlers ─────────────────────────────────────────────────────

export const handleKafkaMessage = async (topic, data) => {
  if (topic === "UserPreferencesUpdated") {
    const { userId, courses, topics, studyPace, studyMode, groupSize, studyStyle } = data.payload || data;
    await prisma.userProfile.upsert({
      where: { userId },
      create: { userId, courses: courses || [], topics: topics || [], studyPace, studyMode, groupSize, studyStyle },
      update: { courses: courses || [], topics: topics || [], studyPace, studyMode, groupSize, studyStyle },
    });
    console.log(`UserProfile cached for user ${userId}`);
    await runMatchingForUser(userId);
  }

  if (topic === "availability-events") {
    const { userId, slots } = data.payload || data;
    // Replace all slots for this user
    await prisma.userAvailability.deleteMany({ where: { userId } });
    if (slots && slots.length > 0) {
      await prisma.userAvailability.createMany({
        data: slots.map((s) => ({ userId, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime })),
      });
    }
    console.log(`Availability cached for user ${userId}`);
    await runMatchingForUser(userId);
  }
};

// ─── Core matching logic ──────────────────────────────────────────────────────

export const runMatchingForUser = async (userId) => {
  const profileA = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profileA) return [];

  const [slotsA, otherProfiles] = await Promise.all([
    prisma.userAvailability.findMany({ where: { userId }, orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] }),
    prisma.userProfile.findMany({ where: { userId: { not: userId } }, orderBy: { userId: "asc" } }),
  ]);

  const otherUserIds = otherProfiles.map((profile) => profile.userId);
  const allOtherSlots = otherUserIds.length
    ? await prisma.userAvailability.findMany({
        where: { userId: { in: otherUserIds } },
        orderBy: [{ userId: "asc" }, { dayOfWeek: "asc" }, { startTime: "asc" }],
      })
    : [];
  const slotsByUserId = allOtherSlots.reduce((map, slot) => {
    if (!map.has(slot.userId)) map.set(slot.userId, []);
    map.get(slot.userId).push(slot);
    return map;
  }, new Map());

  const results = [];

  for (const profileB of otherProfiles) {
    const slotsB = slotsByUserId.get(profileB.userId) || [];
    const { score, reasons } = computeScore(profileA, profileB, slotsA, slotsB);

    if (score > 0) {
      const match = await prisma.match.upsert({
        where: { userId_matchedUserId: { userId, matchedUserId: profileB.userId } },
        create: { userId, matchedUserId: profileB.userId, score, reasons },
        update: { score, reasons },
      });
      results.push(match);

      try {
        await sendEvent("MatchFound", {
          event: "MatchFound",
          timestamp: new Date(),
          producerService: "matching-service",
          correlationId: match.id,
          payload: { userId, matchedUserId: profileB.userId, score, reasons },
        });
      } catch {
        console.log("Kafka not running, skipping MatchFound event...");
      }
    }
  }

  return results;
};

// ─── GraphQL-facing functions ─────────────────────────────────────────────────

export const getRecommendedMatches = async (userId) => {
  return prisma.match.findMany({
    where: { userId },
    orderBy: { score: "desc" },
  });
};

export const getMatchById = async (id) => {
  return prisma.match.findUnique({ where: { id } });
};

export const syncUserProfile = async (userId, courses, topics, studyPace, studyMode, groupSize, studyStyle) => {
  return prisma.userProfile.upsert({
    where: { userId },
    create: { userId, courses: courses || [], topics: topics || [], studyPace, studyMode, groupSize, studyStyle },
    update: { courses: courses || [], topics: topics || [], studyPace, studyMode, groupSize, studyStyle },
  });
};

export const syncUserAvailability = async (userId, slots) => {
  await prisma.userAvailability.deleteMany({ where: { userId } });
  if (slots && slots.length > 0) {
    await prisma.userAvailability.createMany({
      data: slots.map((s) => ({ userId, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime })),
    });
  }
  return prisma.userAvailability.findMany({ where: { userId } });
};
