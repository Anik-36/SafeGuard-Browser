import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import prisma from './config/prisma.js';
import authRoutes from './modules/auth/auth.routes.js';
const app = express();
const PORT = Number(process.env.PORT) || 4000;
app.use(helmet());
app.use(cors());
app.use(express.json());
// Health check
app.get('/api/health', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'SafeGuard Browser API is running',
    });
});
// Database health check
app.get('/api/health/db', async (_req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        res.status(200).json({
            success: true,
            message: 'PostgreSQL database connected successfully',
        });
    }
    catch (error) {
        console.error('Database connection failed:', error);
        res.status(503).json({
            success: false,
            message: 'Database connection failed',
        });
    }
});
// Authentication routes
app.use('/api/auth', authRoutes);
// Start server
app.listen(PORT, () => {
    console.log(`SafeGuard Backend running at http://localhost:${PORT}`);
});
