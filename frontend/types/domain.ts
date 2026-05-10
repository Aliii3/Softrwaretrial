export type User = {
  id: string;
  name: string;
  email: string;
  university: string;
  academicYear: number;
  phone?: string | null;
};

export type Profile = {
  userId: string;
  courses: string[];
  topics: string[];
  studyPace?: string | null;
  studyMode?: string | null;
  groupSize?: number | null;
  studyStyle?: string | null;
};

export type AvailabilitySlot = {
  id: string;
  userId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
};

export type StudySession = {
  id: string;
  title: string;
  description?: string | null;
  topic: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  sessionType: string;
  status: string;
  creatorId: string;
  receiverId?: string | null;
  creatorContact: string;
  receiverContact?: string | null;
  userId: string;
  subject: string;
  participants: StudySessionParticipant[];
  createdAt: string;
  updatedAt: string;
};

export type StudySessionParticipant = {
  id: string;
  sessionId: string;
  userId: string;
  contactInfo?: string | null;
  joinedAt: string;
};

export type Match = {
  id: string;
  userId: string;
  matchedUserId: string;
  score: number;
  reasons: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type NotificationItem = {
  id: string;
  userId: string;
  type: string;
  message: string;
  isRead: boolean;
  metadata?: string | null;
  createdAt: string;
};

export type ServiceKey =
  | "user"
  | "availability"
  | "session"
  | "notification"
  | "matching"
  | "profile";
