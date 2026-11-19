-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('ANDROID', 'IOS');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ACTIVE', 'OFFLINE', 'PAUSED', 'REMOVED');

-- CreateEnum
CREATE TYPE "DomainAction" AS ENUM ('ALLOW', 'BLOCK');

-- CreateEnum
CREATE TYPE "PermissionStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "HistoryDecision" AS ENUM ('ALLOWED', 'BLOCKED', 'APPROVAL_PENDING', 'APPROVED');

-- CreateEnum
CREATE TYPE "SecurityEventType" AS ENUM ('DOMAIN_BLOCKED', 'PERMISSION_REQUESTED', 'PERMISSION_APPROVED', 'PERMISSION_DENIED', 'UNSAFE_REDIRECT_BLOCKED', 'INVALID_URL_BLOCKED');

-- CreateEnum
CREATE TYPE "SecuritySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrowserDevice" (
    "id" UUID NOT NULL,
    "adminUserId" UUID NOT NULL,
    "deviceIdentifier" VARCHAR(255) NOT NULL,
    "deviceName" VARCHAR(150) NOT NULL,
    "platform" "DevicePlatform" NOT NULL DEFAULT 'ANDROID',
    "osVersion" VARCHAR(100),
    "appVersion" VARCHAR(50),
    "status" "DeviceStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSeenAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "BrowserDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrowserPolicy" (
    "id" UUID NOT NULL,
    "deviceId" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "safeSearch" BOOLEAN NOT NULL DEFAULT true,
    "approvalRequiredForUnknown" BOOLEAN NOT NULL DEFAULT true,
    "blockUnsafeRedirects" BOOLEAN NOT NULL DEFAULT true,
    "allowDownloads" BOOLEAN NOT NULL DEFAULT false,
    "policyVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "BrowserPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainRule" (
    "id" UUID NOT NULL,
    "policyId" UUID NOT NULL,
    "domain" VARCHAR(253) NOT NULL,
    "action" "DomainAction" NOT NULL,
    "category" VARCHAR(100),
    "reason" VARCHAR(300),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "DomainRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermissionRequest" (
    "id" UUID NOT NULL,
    "deviceId" UUID NOT NULL,
    "domain" VARCHAR(253) NOT NULL,
    "requestedUrl" VARCHAR(2048) NOT NULL,
    "reason" VARCHAR(500),
    "status" "PermissionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMPTZ(6),
    "approvedUntil" TIMESTAMPTZ(6),
    "expiresAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PermissionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrowserHistory" (
    "id" UUID NOT NULL,
    "deviceId" UUID NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "domain" VARCHAR(253) NOT NULL,
    "pageTitle" VARCHAR(500),
    "decision" "HistoryDecision" NOT NULL,
    "category" VARCHAR(100),
    "visitedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrowserHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" UUID NOT NULL,
    "deviceId" UUID NOT NULL,
    "eventType" "SecurityEventType" NOT NULL,
    "severity" "SecuritySeverity" NOT NULL DEFAULT 'MEDIUM',
    "domain" VARCHAR(253),
    "message" VARCHAR(500) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL,
    "adminUserId" UUID NOT NULL,
    "deviceId" UUID,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "revokedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminUser_isActive_idx" ON "AdminUser"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BrowserDevice_deviceIdentifier_key" ON "BrowserDevice"("deviceIdentifier");

-- CreateIndex
CREATE INDEX "BrowserDevice_adminUserId_status_idx" ON "BrowserDevice"("adminUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BrowserPolicy_deviceId_key" ON "BrowserPolicy"("deviceId");

-- CreateIndex
CREATE INDEX "DomainRule_domain_action_idx" ON "DomainRule"("domain", "action");

-- CreateIndex
CREATE UNIQUE INDEX "DomainRule_policyId_domain_key" ON "DomainRule"("policyId", "domain");

-- CreateIndex
CREATE INDEX "PermissionRequest_deviceId_status_createdAt_idx" ON "PermissionRequest"("deviceId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PermissionRequest_domain_status_idx" ON "PermissionRequest"("domain", "status");

-- CreateIndex
CREATE INDEX "BrowserHistory_deviceId_visitedAt_idx" ON "BrowserHistory"("deviceId", "visitedAt");

-- CreateIndex
CREATE INDEX "BrowserHistory_domain_visitedAt_idx" ON "BrowserHistory"("domain", "visitedAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_deviceId_createdAt_idx" ON "SecurityEvent"("deviceId", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_eventType_severity_createdAt_idx" ON "SecurityEvent"("eventType", "severity", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_adminUserId_expiresAt_idx" ON "RefreshToken"("adminUserId", "expiresAt");

-- CreateIndex
CREATE INDEX "RefreshToken_deviceId_expiresAt_idx" ON "RefreshToken"("deviceId", "expiresAt");

-- AddForeignKey
ALTER TABLE "BrowserDevice" ADD CONSTRAINT "BrowserDevice_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrowserPolicy" ADD CONSTRAINT "BrowserPolicy_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "BrowserDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DomainRule" ADD CONSTRAINT "DomainRule_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "BrowserPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionRequest" ADD CONSTRAINT "PermissionRequest_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "BrowserDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionRequest" ADD CONSTRAINT "PermissionRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrowserHistory" ADD CONSTRAINT "BrowserHistory_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "BrowserDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "BrowserDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "BrowserDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
