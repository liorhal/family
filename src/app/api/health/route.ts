import { appendFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";

const LOG_PATH = join(process.cwd(), "debug.log");

export async function GET() {
  try {
    const dir = dirname(LOG_PATH);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const line = JSON.stringify({ location: "api/health", message: "health_check", data: { ok: true }, timestamp: Date.now() }) + "\n";
    appendFileSync(LOG_PATH, line);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
  return Response.json({ ok: true });
}
