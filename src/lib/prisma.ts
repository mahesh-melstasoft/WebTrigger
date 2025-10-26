import { PrismaClient } from '../generated/prisma'
import { withAccelerate } from '@prisma/extension-accelerate'
import { ensureStartupRequirements } from './startup';

// Use a concrete type for the extended Prisma client to avoid `any` and satisfy eslint
// We create the Prisma client and apply the accelerate extension. The result of
// `$extends` has a different compile-time shape which can make model delegates
// appear as `unknown`. To keep strong typings for `prisma.model` callers while
// still using the extension at runtime we cast the extended client back to the
// generated `PrismaClient` type via `as unknown as PrismaClient`.

const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClient
}

// Perform startup checks (will throw in production if required env vars are missing)
ensureStartupRequirements();

const _client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
}).$extends(withAccelerate())

// Cast back to the generated PrismaClient type to preserve delegate typings
export const prisma: PrismaClient = globalForPrisma.prisma ?? (_client as unknown as PrismaClient)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
