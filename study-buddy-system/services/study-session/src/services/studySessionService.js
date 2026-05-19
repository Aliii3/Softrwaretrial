import { randomUUID } from "node:crypto";
import { sendEvent } from "../config/kafka.js";

const VALID_SESSION_TYPES = ["ONLINE", "IN_PERSON"];
const ACTIVE_STATUSES = ["SCHEDULED", "UPDATED"];
const sessionsById = new Map();

const now = () => new Date().toISOString();

const publishSessionEvent = async (eventName, session) => {
  try {
    await sendEvent(eventName, {
      eventName,
      timestamp: now(),
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
  return { start: start.toISOString(), end: end.toISOString(), durationMinutes: Math.round((end.getTime() - start.getTime()) / 60000) };
};

const assertActiveSession = (session) => {
  if (!session) throw new Error("Study session not found");
  if (!ACTIVE_STATUSES.includes(session.status)) throw new Error("Study session is not active");
};

const saveSession = (session) => {
  sessionsById.set(session.id, { ...session, updatedAt: now() });
  return sessionsById.get(session.id);
};

export const createStudySession = async (data) => {
  const { start, end, durationMinutes } = normalizeDateRange(data.startTime, data.endTime);
  const creatorId = data.creatorId || data.userId;
  if (!creatorId) throw new Error("Session creator is required");
  if (!data.creatorContact) throw new Error("Session creator contact info is required");

  const createdAt = now();
  const session = {
    id: randomUUID(),
    title: data.title,
    description: data.description || null,
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
    participants: [{ id: randomUUID(), sessionId: "", userId: creatorId, contactInfo: data.creatorContact, joinedAt: createdAt }],
    createdAt,
    updatedAt: createdAt,
  };
  session.participants[0].sessionId = session.id;

  sessionsById.set(session.id, session);
  await publishSessionEvent("StudySessionCreated", session);
  return session;
};

export const getStudySessions = async () => {
  return [...sessionsById.values()].sort((a, b) => a.startTime.localeCompare(b.startTime));
};

export const getStudySessionById = async (id) => {
  return sessionsById.get(id) || null;
};

export const updateStudySession = async (id, updates) => {
  const existing = await getStudySessionById(id);
  assertActiveSession(existing);
  const range = updates.startTime || updates.endTime ? normalizeDateRange(updates.startTime || existing.startTime, updates.endTime || existing.endTime) : null;

  const updated = saveSession({
    ...existing,
    title: updates.title ?? existing.title,
    description: updates.description ?? existing.description,
    topic: updates.topic ?? existing.topic,
    subject: updates.subject ?? existing.subject,
    startTime: range?.start ?? existing.startTime,
    endTime: range?.end ?? existing.endTime,
    durationMinutes: range?.durationMinutes ?? existing.durationMinutes,
    sessionType: updates.sessionType ? normalizeSessionType(updates.sessionType) : existing.sessionType,
    receiverId: updates.receiverId ?? existing.receiverId,
    creatorContact: updates.creatorContact ?? existing.creatorContact,
    receiverContact: updates.receiverContact ?? existing.receiverContact,
    status: "UPDATED",
  });

  await publishSessionEvent("StudySessionUpdated", updated);
  return updated;
};

export const joinStudySession = async (id, userId, contactInfo) => {
  const session = await getStudySessionById(id);
  assertActiveSession(session);
  if (!userId) throw new Error("Participant user id is required");

  const participants = [...session.participants];
  const existingParticipant = participants.find((participant) => participant.userId === userId);

  if (existingParticipant) {
    existingParticipant.contactInfo = contactInfo;
  } else {
    participants.push({ id: randomUUID(), sessionId: id, userId, contactInfo, joinedAt: now() });
  }

  const updated = saveSession({
    ...session,
    participants,
    receiverId: session.receiverId || (userId !== session.creatorId ? userId : session.receiverId),
    receiverContact: session.receiverContact || (userId !== session.creatorId ? contactInfo : session.receiverContact),
    status: "UPDATED",
  });

  await publishSessionEvent("StudySessionJoined", updated);
  return updated;
};

export const leaveStudySession = async (id, userId) => {
  const session = await getStudySessionById(id);
  assertActiveSession(session);
  if (userId === session.creatorId) throw new Error("Creator cannot leave their own session. Cancel it instead.");

  const participants = session.participants.filter((participant) => participant.userId !== userId);
  if (participants.length === session.participants.length) throw new Error("Participant is not in this session");

  const updated = saveSession({
    ...session,
    participants,
    receiverId: session.receiverId === userId ? null : session.receiverId,
    receiverContact: session.receiverId === userId ? null : session.receiverContact,
    status: "UPDATED",
  });

  await publishSessionEvent("StudySessionLeft", updated);
  return updated;
};

export const cancelStudySession = async (id) => {
  const session = await getStudySessionById(id);
  assertActiveSession(session);
  const updated = saveSession({ ...session, status: "CANCELLED" });
  await publishSessionEvent("StudySessionCancelled", updated);
  return updated;
};

export const deleteStudySession = async (id) => {
  const session = await cancelStudySession(id);
  sessionsById.delete(session.id);
  return true;
};
