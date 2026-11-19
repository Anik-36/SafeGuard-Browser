import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "node:crypto";
import prisma from "../../config/prisma.js";
// Register a new admin user
export const registerAdmin = async (data) => {
    const passwordHash = await bcrypt.hash(data.password, 12);
    return prisma.adminUser.create({
        data: {
            name: data.name,
            email: data.email,
            passwordHash,
        },
        select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            createdAt: true,
        },
    });
};
// Login an existing admin user
export const loginAdmin = async (data) => {
    const admin = await prisma.adminUser.findUnique({
        where: {
            email: data.email,
        },
    });
    if (!admin || !admin.isActive) {
        return null;
    }
    const passwordIsValid = await bcrypt.compare(data.password, admin.passwordHash);
    if (!passwordIsValid) {
        return null;
    }
    const jwtSecret = process.env.JWT_ACCESS_SECRET;
    if (!jwtSecret || jwtSecret.length < 32) {
        throw new Error("JWT_ACCESS_SECRET is missing or too short");
    }
    const accessToken = jwt.sign({ role: "ADMIN" }, jwtSecret, {
        subject: admin.id,
        expiresIn: 15 * 60,
    });
    const refreshToken = randomBytes(64).toString("hex");
    const tokenHash = createHash("sha256").update(refreshToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
        data: {
            adminUserId: admin.id,
            tokenHash,
            expiresAt,
        },
    });
    return {
        admin: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            isActive: admin.isActive,
            createdAt: admin.createdAt,
        },
        accessToken,
        refreshToken,
    };
};
// Refresh an admin session using a valid refresh token
export const refreshAdminSession = async (refreshToken) => {
    const tokenHash = createHash("sha256").update(refreshToken).digest("hex");
    const storedToken = await prisma.refreshToken.findUnique({
        where: {
            tokenHash,
        },
        include: {
            adminUser: true,
        },
    });
    if (!storedToken ||
        storedToken.revokedAt ||
        storedToken.expiresAt <= new Date() ||
        !storedToken.adminUser.isActive) {
        return null;
    }
    const jwtSecret = process.env.JWT_ACCESS_SECRET;
    if (!jwtSecret || jwtSecret.length < 32) {
        throw new Error("JWT_ACCESS_SECRET is missing or too short");
    }
    const accessToken = jwt.sign({ role: "ADMIN" }, jwtSecret, {
        subject: storedToken.adminUser.id,
        expiresIn: 15 * 60,
    });
    const newRefreshToken = randomBytes(64).toString("hex");
    const newTokenHash = createHash("sha256")
        .update(newRefreshToken)
        .digest("hex");
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const result = await prisma.$transaction(async (tx) => {
        const revoked = await tx.refreshToken.updateMany({
            where: {
                id: storedToken.id,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
            },
        });
        if (revoked.count !== 1) {
            return null;
        }
        await tx.refreshToken.create({
            data: {
                adminUserId: storedToken.adminUser.id,
                tokenHash: newTokenHash,
                expiresAt: newExpiresAt,
            },
        });
        return {
            admin: {
                id: storedToken.adminUser.id,
                name: storedToken.adminUser.name,
                email: storedToken.adminUser.email,
                isActive: storedToken.adminUser.isActive,
            },
            accessToken,
            refreshToken: newRefreshToken,
        };
    });
    return result;
};
// Logout an admin by revoking the refresh token
export const logoutAdmin = async (refreshToken) => {
    const tokenHash = createHash("sha256").update(refreshToken).digest("hex");
    const result = await prisma.refreshToken.updateMany({
        where: {
            tokenHash,
            revokedAt: null,
        },
        data: {
            revokedAt: new Date(),
        },
    });
    return result.count === 1;
};
