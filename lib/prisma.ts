import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

import { Pool } from "pg"

function createPrismaClient() {
  const isProduction = process.env.NODE_ENV === "production"
  
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL!,
    max: 20,
    // Cấu hình SSL tường minh cho môi trường production/cloud
    ssl: isProduction ? { rejectUnauthorized: false } : undefined
  })
  
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
