import prisma from "../config/db.js";
import { sendEvent } from "../config/kafka.js";

const VALID_SESSION_TYPES = ["ONLINE", "IN_PERSON"];
const ACTIVE_STATUSES = ["SCHEDULED", "UPDATED"];
const includeParticipants = { participants: true };

const publishSessionEvent = async (eventName, session) => {
  try {
    await sendEvent(eventName, {
      eventName,
      timestamp: new Date().toISOString(),
      producer: "study-session-service",
      correlationId: session.id,
      payload: {
        sessionId: session.id,
        title: session.title,
        topic: session.topic,
        subject: session.subject,
        startTime: session.startTime,
        endTime: session.endTime,
        durationMinutes: session.durationMinutes,
        sessionType: session.sessionType,
        status: session.status,
        creatorId: session.creatorId,
        receiverId: session.receiverId,
        userId: session.creatorId,
        hostUserId: session.creatorId,
        participantIds: session.participants?.map((participant) => participant.userId) || [],
      },
    });
  } catch {
    console.log("Kafka not running, skipping study session event...");
  }
};

const normalizeSessionType = (sessionType = "ONLINE") => {
  const normalized = sessionType.trim().toUpperCase();
  if (!VALID_SESSION_TYPES.includes(normalized)) throw new Error("Session type must be ONLINE or IN_PERSON");
  return normalized;
};

const normalizeDateRange = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) throw new Error("Session start and end time must be valid dates");
  if (end <= start) throw new Error("Session end time must be after start time");
  return { start, end, durationMinutes: Math.round((end.getTime() - start.getTime()) / 60000) };
};

const assertActiveSession = (session) => {
  if (!session) throw new Error("Study session not found");
  if (!ACTIVE_STATUSES.includes(session.status)) throw new Error("Study session is not active");
};

export const createStudySession = async (data) => {
  const { start, end, durationMinutes } = normalizeDateRange(data.startTime, data.endTime);
  const creatorId = data.creatorId || data.userId;
  if (!creatorId) throw new Error("Session creator is required");
  if (!data.creatorContact) throw new Error("Session creator contact info is required");

  const session = await prisma.studySession.create({
    data: {
      title: data.title,
      description: data.description,
      topic: data.topic || data.subject,
      startTime: start,
      endTime: end,
      durationMinutes,
      sessionType: normalizeSessionType(data.sessionType),
      status: "SCHEDULED",
      creatorId,
      receiverId: data.receiverId || null,
      creatorContact: data.creatorContact,
      receiverContact: data.receiverContact || null,
      userId: creatorId,
      subject: data.subject,
      participants: { create: [{ userId: creatorId, contactInfo: data.creatorContact }] },
    },
    include: includeParticipants,
  });

  await publishSessionEvent("StudySessionCreated", session);
  return session;
};

export const getStudySessions = async () => {
  return prisma.studySession.findMany({ orderBy: { startTime: "asc" }, include: includeParticipants });
};

export const getStudySessionById = async (id) => {
  return prisma.studySession.findUnique({ where: { id }, include: includeParticipants });
};

export const updateStudySession = async (id, updates) => {
  const existing = await getStudySessionById(id);
  assertActiveSession(existing);
  const range = updates.startTime || updates.endTime ? normalizeDateRange(updates.startTime || existing.startTime, updates.endTime || existing.endTime) : null;

  const updated = await prisma.studySession.update({
    where: { id },
    data: {
      title: updates.title ?? undefined,
      description: updates.description ?? undefined,
      topic: updates.topic ?? undefined,
      subject: updates.subject ?? undefined,
      startTime: range?.start,
      endTime: range?.end,
      durationMinutes: range?.durationMinutes,
      sessionType: updates.sessionType ? normalizeSessionType(updates.sessionType) : undefined,
      receiverId: updates.receiverId ?? undefined,
      creatorContact: updates.creatorContact ?? undefined,
      receiverContact: updates.receiverContact ?? undefined,
      status: "UPDATED",
    },
    include: includeParticipants,
  });

  await publishSessionEvent("StudySessionUpdated", updated);
  return updated;
};

export const joinStudySession = async (id, userId, contactInfo) => {
  const session = await getStudySessionById(id);
  assertActiveSession(session);
  if (!userId) throw new Error("Participant user id is required");

  await prisma.studySessionParticipant.upsert({
    where: { sessionId_userId: { sessionId: id, userId } },
    create: { sessionId: id, userId, contactInfo },
    update: { contactInfo },
  });

  const updated = await prisma.studySession.update({
    where: { id },
    data: {
      receiverId: session.receiverId || (userId !== session.creatorId ? userId : session.receiverId),
      receiverContact: session.receiverContact || (userId !== session.creatorId ? contactInfo : session.receiverContact),
      status: "UPDATED",
    },
    include: includeParticipants,
  });

  await publishSessionEvent("StudySessionJoined", updated);
  return updated;
};

export const leaveStudySession = async (id, userId) => {
  const session = await getStudySessionById(id);
  assertActiveSession(session);
  if (userId === session.creatorId) throw new Error("Creator cannot leave their own session. Cancel it instead.");

  await prisma.studySessionParticipant.delete({ where: { sessionId_userId: { sessionId: id, userId } } });

  const updated = await prisma.studySession.update({
    where: { id },
    data: {
      receiverId: session.receiverId === userId ? null : session.receiverId,
      receiverContact: session.receiverId === userId ? null : session.receiverContact,
      status: "UPDATED",
    },
    include: includeParticipants,
  });

  await publishSessionEvent("StudySessionLeft", updated);
  return updated;
};

export const cancelStudySession = async (id) => {
  const session = await getStudySessionById(id);
  assertActiveSession(session);
  const updated = await prisma.studySession.update({ where: { id }, data: { status: "CANCELLED" }, include: includeParticipants });
  await publishSessionEvent("StudySessionCancelled", updated);
  return updated;
};

export const deleteStudySession = async (id) => {
  await cancelStudySession(id);
  return true;
};
