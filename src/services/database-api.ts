import { showErrorToast } from "@/utils/toast";

export type DatabaseHealth = {
  status: "ok";
  databaseTime: string | null;
};

export async function checkDatabaseConnection(): Promise<DatabaseHealth> {
  try {
    const response = await fetch("/api/health");

    if (!response.ok) {
      throw new Error("Database service is unavailable");
    }

    return (await response.json()) as DatabaseHealth;
  } catch (error) {
    showErrorToast(
      "Connection error",
      "Unable to connect to the database. Please try again.",
    );

    throw error;
  }
}
