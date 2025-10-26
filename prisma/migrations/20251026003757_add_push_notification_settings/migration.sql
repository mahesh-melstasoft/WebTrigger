-- AlterTable
ALTER TABLE "public"."NotificationSettings" ADD COLUMN     "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pushOnFailure" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pushOnSuccess" BOOLEAN NOT NULL DEFAULT false;
