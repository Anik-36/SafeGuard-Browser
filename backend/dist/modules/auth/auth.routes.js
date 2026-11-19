import { Router } from "express";
import { register, login, refresh, logout } from "./auth.controller.js";
import { authenticateAdmin } from "../../middleware/auth.middleware.js";
const router = Router();
// Admin registration
router.post("/register", register);
// Admin login
router.post("/login", login);
// Refresh access and refresh tokens
router.post("/refresh", refresh);
// Logout and revoke refresh token
router.post("/logout", logout);
// Get the currently authenticated admin
router.get("/me", authenticateAdmin, (_req, res) => {
    return res.status(200).json({
        success: true,
        message: "Authenticated admin",
        data: res.locals.admin,
    });
});
export default router;
