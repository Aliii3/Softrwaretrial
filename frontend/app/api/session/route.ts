import { createYoga, createSchema } from "graphql-yoga";
import prisma from "@/lib/sessionDb";

const VALID_SESSION_TYPES = ["ONLINE", "IN_PERSON"];
const ACTIVE_STATUSES = ["SCHEDULED", "UPDATED"];

const now = () => new Date().toISOString();

const normalizeSessionType = (sessionType = "ONLINE") => {
  const normalized = sessionType.trim().toUpperCase();
  if (!VALID_SESSION_TYPES.includes(normalized))
    throw new Error("Session type must be ONLINE or IN_PERSON");
  return normalized;
};

const normalizeDateRange = (startTime: string, endTime: string) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()))
    throw new Error("Session start and end time must be valid dates");
  if (end <= start)
    throw new Error("Session end time must be after start time");
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    durationMinutes: Math.round((end.getTime() - start.getTime()) / 60000),
  };
};

const assertActive = (session: any) => {
  if (!session) throw new Error("Study session not found");
  if (!ACTIVE_STATUSES.includes(session.status))
    throw new Error("Study session is not active");
};

const serialize = (s: any) => ({
  ...s,
  createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
  updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : s.updatedAt,
  participants: s.participants ?? [],
});

const typeDefs = /* GraphQL */ `
  type StudySessionParticipant {
    id: ID!
    sessionId: String!
    userId: String!
    contactInfo: String
    joinedAt: String!
  }

  type StudySession {
    id: ID!
    title: String!
    description: String
    topic: String!
    startTime: String!
    endTime: String!
    durationMinutes: Int!
    sessionType: String!
    status: String!
    creatorId: String!
    receiverId: String
    creatorContact: String!
    receiverContact: String
    userId: String!
    subject: String!
    participants: [StudySessionParticipant!]!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    getStudySessions: [StudySession!]!
    getStudySession(id: ID!): StudySession
  }

  type Mutation {
    createStudySession(
      title: String!
      description: String
      topic: String!
      startTime: String!
      endTime: String!
      userId: String!
      subject: String!
      sessionType: String!
      creatorContact: String!
      receiverId: String
      receiverContact: String
    ): StudySession!

    updateStudySession(
      id: ID!
      title: String
      description: String
      topic: String
      startTime: String
      endTime: String
      subject: String
      sessionType: String
      receiverId: String
      creatorContact: String
      receiverContact: String
    ): StudySession

    joinStudySession(id: ID!, userId: String!, contactInfo: String): StudySession!
    leaveStudySession(id: ID!, userId: String!): StudySession!
    cancelStudySession(id: ID!): StudySession!
    deleteStudySession(id: ID!): Boolean!
  }
`;

const resolvers = {
  Query: {
    getStudySessions: async () => {
      const sessions = await prisma.studySession.findMany({
        include: { participants: true },
        orderBy: { startTime: "asc" },
      });
      return sessions.map(serialize);
    },
    getStudySession: async (_: unknown, { id }: { id: string }) => {
      const session = await prisma.studySession.findUnique({
        where: { id },
        include: { participants: true },
      });
      return session ? serialize(session) : null;
    },
  },
  Mutation: {
    createStudySession: async (_: unknown, args: any) => {
      const { start, end, durationMinutes } = normalizeDateRange(args.startTime, args.endTime);
      const creatorId = args.creatorId || args.userId;
      if (!creatorId) throw new Error("Session creator is required");
      if (!args.creatorContact) throw new Error("Session creator contact info is required");

      const session = await prisma.studySession.create({
        data: {
          title: args.title,
          description: args.description || null,
          topic: args.topic || args.subject,
          startTime: start,
          endTime: end,
          durationMinutes,
          sessionType: normalizeSessionType(args.sessionType),
          status: "SCHEDULED",
          creatorId,
          receiverId: args.receiverId || null,
          creatorContact: args.creatorContact,
          receiverContact: args.receiverContact || null,
          userId: creatorId,
          subject: args.subject,
          participants: {
            create: [{ userId: creatorId, contactInfo: args.creatorContact, joinedAt: now() }],
          },
        },
        include: { participants: true },
      });

      return serialize(session);
    },

    updateStudySession: async (_: unknown, { id, ...updates }: any) => {
      const existing = await prisma.studySession.findUnique({
        where: { id },
        include: { participants: true },
      });
      assertActive(existing);

      const range =
        updates.startTime || updates.endTime
          ? normalizeDateRange(
              updates.startTime || existing!.startTime,
              updates.endTime || existing!.endTime
            )
          : null;

      const updated = await prisma.studySession.update({
        where: { id },
        data: {
          title: updates.title ?? existing!.title,
          description: updates.description ?? existing!.description,
          topic: updates.topic ?? existing!.topic,
          subject: updates.subject ?? existing!.subject,
          startTime: range?.start ?? existing!.startTime,
          endTime: range?.end ?? existing!.endTime,
          durationMinutes: range?.durationMinutes ?? existing!.durationMinutes,
          sessionType: updates.sessionType
            ? normalizeSessionType(updates.sessionType)
            : existing!.sessionType,
          receiverId: updates.receiverId ?? existing!.receiverId,
          creatorContact: updates.creatorContact ?? existing!.creatorContact,
          receiverContact: updates.receiverContact ?? existing!.receiverContact,
          status: "UPDATED",
        },
        include: { participants: true },
      });

      return serialize(updated);
    },

    joinStudySession: async (_: unknown, { id, userId, contactInfo }: any) => {
      const session = await prisma.studySession.findUnique({
        where: { id },
        include: { participants: true },
      });
      assertActive(session);
      if (!userId) throw new Error("Participant user id is required");

      const existing = session!.participants.find((p) => p.userId === userId);
      if (existing) {
        await prisma.studySessionParticipant.update({
          where: { id: existing.id },
          data: { contactInfo },
        });
      } else {
        await prisma.studySessionParticipant.create({
          data: { sessionId: id, userId, contactInfo, joinedAt: now() },
        });
      }

      const receiverId =
        session!.receiverId || (userId !== session!.creatorId ? userId : session!.receiverId);
      const receiverContact =
        session!.receiverContact ||
        (userId !== session!.creatorId ? contactInfo : session!.receiverContact);

      const updated = await prisma.studySession.update({
        where: { id },
        data: { receiverId, receiverContact, status: "UPDATED" },
        include: { participants: true },
      });

      return serialize(updated);
    },

    leaveStudySession: async (_: unknown, { id, userId }: any) => {
      const session = await prisma.studySession.findUnique({
        where: { id },
        include: { participants: true },
      });
      assertActive(session);
      if (userId === session!.creatorId)
        throw new Error("Creator cannot leave their own session. Cancel it instead.");

      const participant = session!.participants.find((p) => p.userId === userId);
      if (!participant) throw new Error("Participant is not in this session");

      await prisma.studySessionParticipant.delete({ where: { id: participant.id } });

      const updated = await prisma.studySession.update({
        where: { id },
        data: {
          receiverId: session!.receiverId === userId ? null : session!.receiverId,
          receiverContact: session!.receiverId === userId ? null : session!.receiverContact,
          status: "UPDATED",
        },
        include: { participants: true },
      });

      return serialize(updated);
    },

    cancelStudySession: async (_: unknown, { id }: { id: string }) => {
      const session = await prisma.studySession.findUnique({
        where: { id },
        include: { participants: true },
      });
      assertActive(session);

      const updated = await prisma.studySession.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: { participants: true },
      });

      return serialize(updated);
    },

    deleteStudySession: async (_: unknown, { id }: { id: string }) => {
      const session = await prisma.studySession.findUnique({
        where: { id },
        include: { participants: true },
      });
      assertActive(session);

      await prisma.studySession.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: { participants: true },
      });
      await prisma.studySession.delete({ where: { id } });
      return true;
    },
  },
};

const { handleRequest } = createYoga({
  schema: createSchema({ typeDefs, resolvers }),
  graphqlEndpoint: "/api/session",
});

export { handleRequest as GET, handleRequest as POST, handleRequest as OPTIONS };
