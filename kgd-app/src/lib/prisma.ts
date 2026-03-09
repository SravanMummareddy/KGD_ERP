// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client')
type PrismaClientType = ReturnType<typeof PrismaClient>

// Prevent multiple Prisma client instances in development (hot reload)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClientType }

export const prisma: PrismaClientType =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
