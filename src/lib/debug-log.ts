import { appendFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";

const LOG_PATH = join(process.cwd(), "debug.log");

export function debugLog(location: string, message: string, data: object) {
  try {
    const dir = dirname(LOG_PATH);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const line = JSON.stringify({ location, message, data, timestamp: Date.now() }) + "\n";
    appendFileSync(LOG_PATH, line);
  } catch {
    // ignore
  }
}
