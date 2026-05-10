ALTER TABLE "StudySession"
ADD COLUMN "topic" TEXT,
ADD COLUMN "durationMinutes" INTEGER,
ADD COLUMN "sessionType" TEXT NOT NULL DEFAULT 'ONLINE',
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
ADD COLUMN "creatorId" TEXT,
ADD COLUMN "receiverId" TEXT,
ADD COLUMN "creatorContact" TEXT,
ADD COLUMN "receiverContact" TEXT;

UPDATE "StudySession"
SET
  "topic" = "subject",
  "durationMinutes" = GREATEST(1, CEIL(EXTRACT(EPOCH FROM (COALESCE("endTime", "startTime" + INTERVAL '1 hour') - "startTime")) / 60.0)::INTEGER),
  "creatorId" = "userId",
  "creatorContact" = '',
  "endTime" = COALESCE("endTime", "startTime" + INTERVAL '1 hour');

ALTER TABLE "StudySession" ALTER COLUMN "topic" SET NOT NULL;
ALTER TABLE "StudySession" ALTER COLUMN "durationMinutes" SET NOT NULL;
ALTER TABLE "StudySession" ALTER COLUMN "creatorId" SET NOT NULL;
ALTER TABLE "StudySession" ALTER COLUMN "creatorContact" SET NOT NULL;
ALTER TABLE "StudySession" ALTER COLUMN "endTime" SET NOT NULL;

CREATE TABLE "StudySessionParticipant" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "contactInfo" TEXT,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudySessionParticipant_pkey" PRIMARY KEY ("id")
);

INSERT INTO "StudySessionParticipant" ("id", "sessionId", "userId", "contactInfo")
SELECT "id" || '-creator', "id", "creatorId", "creatorContact"
FROM "StudySession";

CREATE UNIQUE INDEX "StudySessionParticipant_sessionId_userId_key"
ON "StudySessionParticipant"("sessionId", "userId");

ALTER TABLE "StudySessionParticipant"
ADD CONSTRAINT "StudySessionParticipant_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "StudySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
