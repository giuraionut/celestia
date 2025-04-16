import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import 'dotenv/config';
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  if (!process.env.TURSO_DATABASE_URL) {
    throw new Error('TURSO_DATABASE_URL is not set in environment variables');
  }
  if (!process.env.TURSO_AUTH_TOKEN) {
    console.warn('TURSO_AUTH_TOKEN is not set. Assuming local file or no auth required.');
  }

  const adapter = new PrismaLibSQL({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  return new PrismaClient({ adapter });
};

const globalForPrisma = globalThis as typeof globalThis & {
  prisma: PrismaClient | undefined;
};

const db = globalForPrisma.prisma ?? prismaClientSingleton();

export default db;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}