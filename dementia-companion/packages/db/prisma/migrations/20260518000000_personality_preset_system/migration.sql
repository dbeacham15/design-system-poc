-- CreateEnum
CREATE TYPE "PersonalityPreset" AS ENUM ('WARM_NURTURER', 'CHEERFUL_FRIEND', 'CALM_PRESENCE', 'WISE_COMPANION');

-- AlterTable: add personalityPreset with default, then drop old columns
ALTER TABLE "Companion" ADD COLUMN "personalityPreset" "PersonalityPreset" NOT NULL DEFAULT 'WARM_NURTURER';

ALTER TABLE "Companion" DROP COLUMN "personalityStyle",
DROP COLUMN "engagementLevel",
DROP COLUMN "genderPresentation",
DROP COLUMN "speakingStyle";
