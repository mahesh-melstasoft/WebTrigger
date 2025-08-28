/*
  Warnings:

  - A unique constraint covering the columns `[customPath]` on the table `Callback` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Callback" ADD COLUMN     "customPath" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Callback_customPath_key" ON "public"."Callback"("customPath");
