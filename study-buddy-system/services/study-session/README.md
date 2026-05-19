# Study Session Service

GraphQL service for creating, updating, joining, leaving, and cancelling study sessions.

## Runtime state

This service keeps session state in memory and emits Kafka events. It does not connect to PostgreSQL or run Prisma migrations.

## Environment

```bash
JWT_SECRET=<same secret used by the other services>
KAFKA_BROKER=<your Kafka broker, if deployed>
PORT=4002
```

## Start

```bash
node src/index.js
```
