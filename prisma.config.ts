import path from "node:path"
import { defineConfig } from "prisma/config"
import { config as loadEnv } from "dotenv"

loadEnv({ path: path.resolve(process.cwd(), ".env.local") })

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL,
  },
})
