-- AlterTable: add avatar, unlock, and session-silence fields to Companion
ALTER TABLE "Companion"
  ADD COLUMN "portraitUrl"      TEXT,
  ADD COLUMN "idleLoopVideoUrl" TEXT,
  ADD COLUMN "introAudioUrl"    TEXT,
  ADD COLUMN "avatarUnlocked"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "sessionSilenceMs" INTEGER NOT NULL DEFAULT 45000;
