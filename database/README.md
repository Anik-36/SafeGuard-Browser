# SafeGuard Browser — Database Phase 1

This is a standalone development database, intentionally separate from the existing Parent-Child application database.

## Requirements
- Node.js 20+ (your Node.js v24 is suitable)
- npm
- Docker Engine and Docker Compose plugin

## 1. Start PostgreSQL
Run from the project root (the folder containing docker-compose.yml):

```bash
docker compose up -d postgres
docker compose ps
```

Wait until the postgres service reports `healthy`.

## 2. Configure Prisma
```bash
cd database
cp .env.example .env
npm install
```

For local development, `.env` connects to the PostgreSQL container on localhost:5432.

## 3. Validate and generate
```bash
npm run db:validate
npm run db:generate
```

## 4. Create the initial database migration
```bash
npm run db:migrate
```

## 5. Inspect tables
```bash
npm run db:studio
```

Prisma Studio opens a local browser page. Stop it with Ctrl+C.

## Stop PostgreSQL
From project root:
```bash
docker compose down
```

This preserves database data in the named Docker volume. To permanently delete the local database data, use `docker compose down -v` (destructive; do not run unless you intentionally want to reset everything).

## Important
The password in this compose file is for local development only. Do not reuse it in production or commit real credentials. This database is a prototype database and is not yet connected to the existing Parent-Child backend.
