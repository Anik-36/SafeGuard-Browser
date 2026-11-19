import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

// Load database environment variables from database/.env
dotenv.config({
  path: fileURLToPath(new URL('../../../database/.env', import.meta.url)),
});

// Create one shared Prisma Client instance
const prisma = new PrismaClient();

export default prisma;
