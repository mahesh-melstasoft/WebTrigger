-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."ActionType" ADD VALUE 'MQTT_PUBLISH';
ALTER TYPE "public"."ActionType" ADD VALUE 'AMQP_PUBLISH';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."ServiceProvider" ADD VALUE 'MQTT_BROKER';
ALTER TYPE "public"."ServiceProvider" ADD VALUE 'AMQP_BROKER';

-- AlterTable
ALTER TABLE "public"."Callback" ADD COLUMN     "authConfig" JSONB,
ADD COLUMN     "authType" TEXT,
ADD COLUMN     "httpBody" JSONB,
ADD COLUMN     "httpHeaders" JSONB,
ADD COLUMN     "httpMethod" TEXT NOT NULL DEFAULT 'GET',
ADD COLUMN     "queryParams" JSONB,
ADD COLUMN     "requestDetails" JSONB,
ADD COLUMN     "responseDetails" JSONB;

-- CreateTable
CREATE TABLE "public"."CallbackHttpTemplate" (
    "id" TEXT NOT NULL,
    "callbackId" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "templateName" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallbackHttpTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CallbackMqtt" (
    "id" TEXT NOT NULL,
    "callbackId" TEXT NOT NULL,
    "broker" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "qos" INTEGER NOT NULL DEFAULT 1,
    "retain" BOOLEAN NOT NULL DEFAULT false,
    "username" TEXT,
    "password" TEXT,
    "clientId" TEXT,
    "payloadFormat" TEXT NOT NULL DEFAULT 'JSON',
    "payloadTemplate" JSONB,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "retryDelayMs" INTEGER NOT NULL DEFAULT 1000,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastTestAt" TIMESTAMP(3),
    "lastTestStatus" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallbackMqtt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MqttPublishLog" (
    "id" TEXT NOT NULL,
    "callbackId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "qos" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "duration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MqttPublishLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CallbackAmqp" (
    "id" TEXT NOT NULL,
    "callbackId" TEXT NOT NULL,
    "brokerUrl" TEXT NOT NULL,
    "exchangeName" TEXT NOT NULL,
    "routingKey" TEXT NOT NULL,
    "exchangeType" TEXT NOT NULL DEFAULT 'topic',
    "durable" BOOLEAN NOT NULL DEFAULT true,
    "autoDelete" BOOLEAN NOT NULL DEFAULT false,
    "username" TEXT,
    "password" TEXT,
    "messageFormat" TEXT NOT NULL DEFAULT 'JSON',
    "messageTemplate" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "persistent" BOOLEAN NOT NULL DEFAULT true,
    "contentType" TEXT NOT NULL DEFAULT 'application/json',
    "messageExpiry" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastTestAt" TIMESTAMP(3),
    "lastTestStatus" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallbackAmqp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AmqpPublishLog" (
    "id" TEXT NOT NULL,
    "callbackId" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "routingKey" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "duration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AmqpPublishLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CallbackMqtt_callbackId_key" ON "public"."CallbackMqtt"("callbackId");

-- CreateIndex
CREATE UNIQUE INDEX "CallbackAmqp_callbackId_key" ON "public"."CallbackAmqp"("callbackId");

-- AddForeignKey
ALTER TABLE "public"."CallbackHttpTemplate" ADD CONSTRAINT "CallbackHttpTemplate_callbackId_fkey" FOREIGN KEY ("callbackId") REFERENCES "public"."Callback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CallbackMqtt" ADD CONSTRAINT "CallbackMqtt_callbackId_fkey" FOREIGN KEY ("callbackId") REFERENCES "public"."Callback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MqttPublishLog" ADD CONSTRAINT "MqttPublishLog_callbackId_fkey" FOREIGN KEY ("callbackId") REFERENCES "public"."Callback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CallbackAmqp" ADD CONSTRAINT "CallbackAmqp_callbackId_fkey" FOREIGN KEY ("callbackId") REFERENCES "public"."Callback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AmqpPublishLog" ADD CONSTRAINT "AmqpPublishLog_callbackId_fkey" FOREIGN KEY ("callbackId") REFERENCES "public"."Callback"("id") ON DELETE CASCADE ON UPDATE CASCADE;
