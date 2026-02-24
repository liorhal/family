import { NextRequest } from "next/server";
import { appendFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";

const LOG_PATH = join(process.cwd(), "debug.log");

export async function POST(request: NextRequest) {
  try {
    const dir = dirname(LOG_PATH);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const body = await request.json();
    const line = JSON.stringify({ ...body, timestamp: Date.now() }) + "\n";
    appendFileSync(LOG_PATH, line);
  } catch {
    // ignore
  }
  return new Response(null, { status: 204 });
}
