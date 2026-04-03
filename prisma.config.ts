import path from "node:path"
import { defineConfig } from "prisma/config"
import { config as loadEnv } from "dotenv"

loadEnv({ path: path.resolve(process.cwd(), ".env.local") })

// MIGRATE_TARGET=supabase  → dùng Supabase DIRECT URL (public schema)
// mặc định              → dùng local DIRECT URL (schema agarwood)
const migrationUrl =
  process.env.MIGRATE_TARGET === "supabase"
    ? process.env.SUPABASE_DIRECT_URL
    : process.env.DIRECT_URL

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: migrationUrl,
  },
})
