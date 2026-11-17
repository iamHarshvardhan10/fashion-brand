import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Used by the Prisma CLI (migrate, db push, studio).
  // Supabase session pooler (port 5432) — migrations don't work through pgbouncer (6543).
  datasource: {
    url: env("DIRECT_URL"),
  },
});
