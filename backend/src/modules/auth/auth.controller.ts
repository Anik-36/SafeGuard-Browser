import type { Request, Response } from "express";

import {
  registerAdmin,
  loginAdmin,
  refreshAdminSession,
  logoutAdmin,
} from "./auth.service.js";

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body ?? {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name must not exceed 100 characters",
      });
    }

    if (password.length < 12) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 12 characters long",
      });
    }

    const admin = await registerAdmin({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    return res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      data: admin,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    console.error("Admin registration failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to register admin",
    });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    const result = await loginAdmin({
      email: normalizedEmail,
      password,
    });

    if (!result) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    console.error("Admin login failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login",
    });
  }
};

// POST /api/auth/refresh
export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body ?? {};

    if (typeof refreshToken !== "string" || !refreshToken.trim()) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const result = await refreshAdminSession(refreshToken);

    if (!result) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Session refreshed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Token refresh failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to refresh session",
    });
  }
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body ?? {};

    if (typeof refreshToken !== "string" || !refreshToken.trim()) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const revoked = await logoutAdmin(refreshToken);

    if (!revoked) {
      return res.status(401).json({
        success: false,
        message: "Invalid or already revoked refresh token",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Admin logout failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to logout",
    });
  }
};
