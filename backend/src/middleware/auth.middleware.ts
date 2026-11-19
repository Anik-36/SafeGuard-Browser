import type { Request, Response, NextFunction } from "express";

import jwt from "jsonwebtoken";

import prisma from "../config/prisma.js";

// Verify admin access token
export const authenticateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // Read Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Access token is required",
    });
    return;
  }

  // Extract token
  const accessToken = authHeader.split(" ")[1];

  if (!accessToken) {
    res.status(401).json({
      success: false,
      message: "Invalid authorization header",
    });
    return;
  }

  // Read JWT secret
  const jwtSecret = process.env.JWT_ACCESS_SECRET;

  if (!jwtSecret || jwtSecret.length < 32) {
    console.error("JWT_ACCESS_SECRET is missing or too short");

    res.status(500).json({
      success: false,
      message: "Authentication configuration error",
    });
    return;
  }

  // Verify token signature and expiration
  let decoded: jwt.JwtPayload;

  try {
    const verified = jwt.verify(accessToken, jwtSecret);

    if (
      typeof verified === "string" ||
      verified.role !== "ADMIN" ||
      typeof verified.sub !== "string"
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid access token",
      });
      return;
    }

    decoded = verified;
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
    return;
  }

  // Confirm that the admin account is still active
  try {
    const admin = await prisma.adminUser.findUnique({
      where: {
        id: decoded.sub,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });

    if (!admin || !admin.isActive) {
      res.status(401).json({
        success: false,
        message: "Admin account is inactive or unavailable",
      });
      return;
    }

    // Make admin information available to protected routes
    res.locals.admin = admin;

    next();
  } catch (error) {
    console.error("Admin authentication failed:", error);

    res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};
