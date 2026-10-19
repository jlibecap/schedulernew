import crypto from "crypto";
import { applyAction, UserError } from "@/lib/store";

export const dynamic = "force-dynamic";

function pinOk(given) {
  const pin = process.env.SCHEDULER_PIN;
  if (!pin) return true;
  const a = crypto.createHash("sha256").update(String(given || "")).digest();
  const b = crypto.createHash("sha256").update(pin).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function POST(request) {
  if (!pinOk(request.headers.get("x-manager-pin"))) {
    return Response.json({ error: "Wrong manager PIN." }, { status: 401 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  if (body.action === "verify") return Response.json({ ok: true });
  try {
    const db = await applyAction(body.action, body.payload);
    return Response.json({ ...db, pinRequired: Boolean(process.env.SCHEDULER_PIN) });
  } catch (e) {
    if (e instanceof UserError) return Response.json({ error: e.message }, { status: 400 });
    console.error(e);
    return Response.json({ error: "Server error." }, { status: 500 });
  }
}
