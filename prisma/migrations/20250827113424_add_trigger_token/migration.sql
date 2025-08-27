/*
  Warnings:

  - A unique constraint covering the columns `[triggerToken]` on the table `Callback` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Callback" ADD COLUMN     "triggerToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Callback_triggerToken_key" ON "public"."Callback"("triggerToken");
