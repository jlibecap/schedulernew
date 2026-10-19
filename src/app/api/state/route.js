import { readState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await readState();
  return Response.json({ ...db, pinRequired: Boolean(process.env.SCHEDULER_PIN) });
}
