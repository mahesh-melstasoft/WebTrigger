-- AlterTable
ALTER TABLE "public"."Callback" ADD COLUMN     "cachePeriod" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Log" ADD COLUMN     "responseTime" INTEGER,
ADD COLUMN     "statusCode" INTEGER,
ADD COLUMN     "success" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "public"."RateLimit" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "requestsPerSecond" INTEGER NOT NULL DEFAULT 1,
    "requestsPerMinute" INTEGER NOT NULL DEFAULT 60,
    "requestsPerHour" INTEGER NOT NULL DEFAULT 1000,
    "requestsPerMonth" INTEGER NOT NULL DEFAULT 10000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RateLimitLog" (
    "id" TEXT NOT NULL,
    "callbackId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitLog_callbackId_period_periodStart_key" ON "public"."RateLimitLog"("callbackId", "period", "periodStart");

-- AddForeignKey
ALTER TABLE "public"."RateLimit" ADD CONSTRAINT "RateLimit_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RateLimitLog" ADD CONSTRAINT "RateLimitLog_callbackId_fkey" FOREIGN KEY ("callbackId") REFERENCES "public"."Callback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RateLimitLog" ADD CONSTRAINT "RateLimitLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
