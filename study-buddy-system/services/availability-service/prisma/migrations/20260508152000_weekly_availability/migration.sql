ALTER TABLE "AvailabilitySlot" ADD COLUMN "dayOfWeek" TEXT;

UPDATE "AvailabilitySlot"
SET "dayOfWeek" = trim(to_char("date", 'Day'));

ALTER TABLE "AvailabilitySlot" ALTER COLUMN "dayOfWeek" SET NOT NULL;

ALTER TABLE "AvailabilitySlot"
ALTER COLUMN "startTime" TYPE TEXT USING to_char("startTime", 'HH24:MI'),
ALTER COLUMN "endTime" TYPE TEXT USING to_char("endTime", 'HH24:MI');

ALTER TABLE "AvailabilitySlot" DROP COLUMN "date";

CREATE UNIQUE INDEX "AvailabilitySlot_userId_dayOfWeek_startTime_key"
ON "AvailabilitySlot"("userId", "dayOfWeek", "startTime");
