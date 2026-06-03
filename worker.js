import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const candidatePaths = [
  "./src/worker.js",
  "../src/worker.js",
  "./worker.js",
  "../../src/worker.js"
].map((entry) => path.resolve(process.cwd(), entry));

const resolvedPath = candidatePaths.find((candidate) => fs.existsSync(candidate));

if (!resolvedPath) {
  const candidates = candidatePaths.join("\n  ");
  throw new Error(`Missing worker entrypoint. Checked paths:\n  ${candidates}`);
}

await import(pathToFileURL(resolvedPath).href);
