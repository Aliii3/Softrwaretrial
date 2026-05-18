# Study Session Service

GraphQL service for creating, updating, joining, leaving, and cancelling study sessions.

## Database

This service uses Prisma with PostgreSQL. A fresh database is supported by the migrations in `prisma/migrations`.

For Railway, attach a PostgreSQL database to the study-session service and set:

```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<same secret used by the other services>
KAFKA_BROKER=<your Kafka broker, if deployed>
PORT=4002
```

The Dockerfile start command runs:

```bash
npx prisma migrate deploy && node src/index.js
```

So the new Railway database will be migrated automatically on deploy.

For local Docker Compose, set `STUDY_SESSION_DATABASE_URL` in the root `.env`; compose maps it into the service as `DATABASE_URL`.
