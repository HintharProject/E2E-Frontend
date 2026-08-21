/**
 * When true (default): mock data for all content, mock user for auth.
 * No calls to the Django API or DATABASE_URL / Prisma.
 *
 * Set USE_MOCK_DATA=false to enable Clerk + API backend + database later.
 */
export function isMockMode(): boolean {
  const flag = process.env.USE_MOCK_DATA?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  return true;
}

export const isUsingMockData = isMockMode;
export const useMockData = isMockMode;

export function assertReadyForDatabase(): void {
  if (isMockMode()) {
    throw new Error(
      "Still on mock data (USE_MOCK_DATA=true). Set USE_MOCK_DATA=false before using the database.",
    );
  }
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is missing.");
  }
}
