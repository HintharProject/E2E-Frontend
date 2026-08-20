# Database connection prep (not live yet)
#
# Status: USE_MOCK_DATA=true — all pages still read `src/lib/mock-data.ts`.
# When you have a PostgreSQL URL:
#   1. Put it in `.env` as DATABASE_URL=...
#   2. Run `npm run db:generate` then `npm run db:migrate`
#   3. Only then set USE_MOCK_DATA=false and wire pages to Prisma
#
# Do not run migrate/seed until the real URL is provided.
