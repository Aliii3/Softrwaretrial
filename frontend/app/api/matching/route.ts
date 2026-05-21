import { createYoga, createSchema } from "graphql-yoga";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

// In-memory store — persists across warm lambda invocations
const profilesByUserId = new Map<string, UserProfile>();
const availabilityByUserId = new Map<string, AvailabilitySlot[]>();
const matchesByPair = new Map<string, Match>();

interface UserProfile {
  id: string;
  userId: string;
  courses: string[];
  topics: string[];
  studyPace?: string;
  studyMode?: string;
  groupSize?: number;
  studyStyle?: string;
}

interface AvailabilitySlot {
  userId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface Match {
  id: string;
  userId: string;
  matchedUserId: string;
  score: number;
  reasons: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

const WEIGHTS = { sharedCourse: 20, sharedTopic: 10, availability: 20, studyMode: 10, studyPace: 5, studyStyle: 5 };
const now = () => new Date().toISOString();
const pairKey = (a: string, b: string) => `${a}:${b}`;
const overlap = (a: string[] = [], b: string[] = []) => a.filter((x) => b.includes(x));

const hasAvailabilityOverlap = (s1: AvailabilitySlot[], s2: AvailabilitySlot[]) => {
  for (const a of s1) {
    for (const b of s2) {
      if (a.dayOfWeek === b.dayOfWeek && a.startTime < b.endTime && b.startTime < a.endTime)
        return true;
    }
  }
  return false;
};

const computeScore = (pA: UserProfile, pB: UserProfile, sA: AvailabilitySlot[], sB: AvailabilitySlot[]) => {
  let score = 0;
  const reasons: string[] = [];

  const sharedCourses = overlap(pA.courses, pB.courses);
  if (sharedCourses.length > 0) {
    score += Math.min(sharedCourses.length, 2) * WEIGHTS.sharedCourse;
    reasons.push(`Shared courses: ${sharedCourses.join(", ")}`);
  }

  const sharedTopics = overlap(pA.topics, pB.topics);
  if (sharedTopics.length > 0) {
    score += Math.min(sharedTopics.length, 2) * WEIGHTS.sharedTopic;
    reasons.push(`Shared topics: ${sharedTopics.join(", ")}`);
  }

  if (hasAvailabilityOverlap(sA, sB)) {
    score += WEIGHTS.availability;
    reasons.push("Overlapping availability");
  }

  if (pA.studyMode && pA.studyMode === pB.studyMode) {
    score += WEIGHTS.studyMode;
    reasons.push(`Same study mode: ${pA.studyMode}`);
  }

  if (pA.studyPace && pA.studyPace === pB.studyPace) {
    score += WEIGHTS.studyPace;
    reasons.push(`Same study pace: ${pA.studyPace}`);
  }

  if (pA.studyStyle && pA.studyStyle === pB.studyStyle) {
    score += WEIGHTS.studyStyle;
    reasons.push(`Same study style: ${pA.studyStyle}`);
  }

  return { score: Math.min(score, 100), reasons };
};

const runMatchingForUser = (userId: string): Match[] => {
  const profileA = profilesByUserId.get(userId);
  if (!profileA) return [];

  const slotsA = availabilityByUserId.get(userId) || [];
  const otherProfiles = [...profilesByUserId.values()]
    .filter((p) => p.userId !== userId)
    .sort((a, b) => a.userId.localeCompare(b.userId));

  const results: Match[] = [];

  for (const profileB of otherProfiles) {
    const slotsB = availabilityByUserId.get(profileB.userId) || [];
    const { score, reasons } = computeScore(profileA, profileB, slotsA, slotsB);
    const key = pairKey(userId, profileB.userId);

    if (score <= 0) {
      matchesByPair.delete(key);
      continue;
    }

    const existing = matchesByPair.get(key);
    const match: Match = {
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
  }

  return results.sort((a, b) => b.score - a.score);
};

const typeDefs = /* GraphQL */ `
  type Match {
    id: ID!
    userId: String!
    matchedUserId: String!
    score: Float!
    reasons: [String!]!
    status: String!
    createdAt: String!
    updatedAt: String!
  }

  type UserProfile {
    id: ID!
    userId: String!
    courses: [String!]!
    topics: [String!]!
    studyPace: String
    studyMode: String
    groupSize: Int
    studyStyle: String
  }

  type AvailabilitySlot {
    userId: String!
    dayOfWeek: String!
    startTime: String!
    endTime: String!
  }

  input AvailabilitySlotInput {
    dayOfWeek: String!
    startTime: String!
    endTime: String!
  }

  type Query {
    getRecommendedMatches(userId: String!): [Match!]!
    getMatch(id: ID!): Match
    getUserProfile(userId: String!): UserProfile
  }

  type Mutation {
    syncUserProfile(
      userId: String!
      courses: [String!]
      topics: [String!]
      studyPace: String
      studyMode: String
      groupSize: Int
      studyStyle: String
    ): UserProfile!

    syncUserAvailability(userId: String!, slots: [AvailabilitySlotInput!]!): [AvailabilitySlot!]!

    computeMatches(userId: String!): [Match!]!
  }
`;

const resolvers = {
  Query: {
    getRecommendedMatches: (_: unknown, { userId }: { userId: string }, { user }: any) => {
      if (!user) throw new Error("Not authenticated");
      return [...matchesByPair.values()]
        .filter((m) => m.userId === userId)
        .sort((a, b) => b.score - a.score);
    },
    getMatch: (_: unknown, { id }: { id: string }, { user }: any) => {
      if (!user) throw new Error("Not authenticated");
      return [...matchesByPair.values()].find((m) => m.id === id) || null;
    },
    getUserProfile: (_: unknown, { userId }: { userId: string }, { user }: any) => {
      if (!user) throw new Error("Not authenticated");
      return profilesByUserId.get(userId) || null;
    },
  },
  Mutation: {
    syncUserProfile: (
      _: unknown,
      { userId, courses, topics, studyPace, studyMode, groupSize, studyStyle }: any,
      { user }: any
    ) => {
      if (!user) throw new Error("Not authenticated");
      const existing = profilesByUserId.get(userId);
      const profile: UserProfile = {
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
    },

    syncUserAvailability: (_: unknown, { userId, slots }: any, { user }: any) => {
      if (!user) throw new Error("Not authenticated");
      const normalized: AvailabilitySlot[] = [...slots]
        .sort(
          (a: any, b: any) =>
            a.dayOfWeek.localeCompare(b.dayOfWeek) || a.startTime.localeCompare(b.startTime)
        )
        .map((slot: any) => ({ userId, dayOfWeek: slot.dayOfWeek, startTime: slot.startTime, endTime: slot.endTime }));
      availabilityByUserId.set(userId, normalized);
      return normalized;
    },

    computeMatches: (_: unknown, { userId }: { userId: string }, { user }: any) => {
      if (!user) throw new Error("Not authenticated");
      return runMatchingForUser(userId);
    },
  },
};

const { handleRequest } = createYoga({
  schema: createSchema({ typeDefs, resolvers }),
  graphqlEndpoint: "/api/matching",
  context: async ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    let user: unknown = null;
    if (token) {
      try {
        user = jwt.verify(token, process.env.JWT_SECRET || "");
      } catch {
        // invalid token — user stays null
      }
    }
    return { user };
  },
});

export { handleRequest as GET, handleRequest as POST, handleRequest as OPTIONS };
