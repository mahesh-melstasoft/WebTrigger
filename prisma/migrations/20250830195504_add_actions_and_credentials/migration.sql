-- CreateEnum
CREATE TYPE "public"."ActionType" AS ENUM ('HTTP_POST', 'SLACK', 'EMAIL', 'SMS', 'STORE', 'QUEUE', 'DISCORD');

-- CreateEnum
CREATE TYPE "public"."ActionExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."ServiceProvider" AS ENUM ('SENDGRID', 'TWILIO', 'SLACK', 'DISCORD', 'GENERIC');

-- CreateTable
CREATE TABLE "public"."Action" (
    "id" TEXT NOT NULL,
    "callbackId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."ActionType" NOT NULL,
    "config" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "parallel" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ActionExecution" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "callbackId" TEXT NOT NULL,
    "status" "public"."ActionExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "response" JSONB,
    "error" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServiceCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" "public"."ServiceProvider" NOT NULL,
    "secret" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCredential_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Action" ADD CONSTRAINT "Action_callbackId_fkey" FOREIGN KEY ("callbackId") REFERENCES "public"."Callback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Action" ADD CONSTRAINT "Action_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActionExecution" ADD CONSTRAINT "ActionExecution_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "public"."Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActionExecution" ADD CONSTRAINT "ActionExecution_callbackId_fkey" FOREIGN KEY ("callbackId") REFERENCES "public"."Callback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServiceCredential" ADD CONSTRAINT "ServiceCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
