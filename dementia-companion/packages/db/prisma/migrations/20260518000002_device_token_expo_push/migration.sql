-- AlterTable: add Expo push token to DeviceToken
ALTER TABLE "DeviceToken" ADD COLUMN "expoPushToken" TEXT;
