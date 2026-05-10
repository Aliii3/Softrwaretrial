import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;

// Create a connection pool
const pool = new Pool({ connectionString });

// Create the Prisma Client with the adapter
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    // Test the connection
    await prisma.$connect();
    console.log('Connected to the database successfully!');

    // Example: Create a study session
    const studySession = await prisma.studySession.create({
      data: {
        title: 'Sample Study Session',
        description: 'Testing the new Prisma setup',
        startTime: new Date(),
        userId: 'user-123',
        subject: 'Mathematics',
      },
    });
    console.log('Created study session:', studySession);

    // Example: Fetch all study sessions
    const sessions = await prisma.studySession.findMany();
    console.log('All study sessions:', sessions);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();