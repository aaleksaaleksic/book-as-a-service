import { rm } from "node:fs/promises";
import { resolve } from "node:path";

const nextDir = resolve(process.cwd(), ".next");

try {
    await rm(nextDir, { recursive: true, force: true });
    console.log("[dev] Removed stale .next build artifacts.");
} catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code !== "ENOENT") {
        console.warn("[dev] Unable to clean .next directory:", error);
    }
}
