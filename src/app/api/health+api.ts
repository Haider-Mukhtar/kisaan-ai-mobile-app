import { getDatabase } from "@/lib/db.server";

type DatabaseTimeRow = {
  database_time: string;
};

export async function GET() {
  try {
    const sql = getDatabase();
    const rows = (await sql`
      SELECT NOW()::text AS database_time
    `) as DatabaseTimeRow[];

    return Response.json({
      status: "ok",
      databaseTime: rows[0]?.database_time ?? null,
    });
  } catch (error) {
    console.error("Neon database health check failed", error);

    return Response.json(
      {
        status: "error",
        message: "Database connection failed",
      },
      { status: 503 },
    );
  }
}
