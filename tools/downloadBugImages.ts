/**
 * Batch download screenshots from ZenTao bugs.
 *
 * Usage:
 *   npx tsx scripts/downloadBugImages.ts <bugId1> <bugId2> ... --out <output-dir>
 *
 * How it works:
 *   Bug steps/results fields contain screenshot references in Markdown format:
 *   ![xxx](/zentao/file-read-123.png)
 *
 *   This script extracts all file-read-N.png references, where N is the ZenTao
 *   file ID (fileID). It then uses an authenticated ZentaoClient to call the
 *   REST API /files/{fileId} to download files to disk.
 *
 * Credentials: ~/.claude/config/zentao-mcp.env
 *   ZENTAO_BASE_URL / ZENTAO_ACCOUNT / ZENTAO_PASSWORD
 */
import * as dotenv from "dotenv";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { ZentaoClient } from "../src/zentaoClient";

dotenv.config({ path: path.join(os.homedir(), ".claude", "config", "zentao-mcp.env") });

function parseArgs(argv: string[]): { bugIds: string[]; outDir: string } {
  const outIdx = argv.indexOf("--out");
  const outDir = outIdx >= 0 ? argv[outIdx + 1] : path.join(process.cwd(), "zentao-bug-images");
  const bugIds = argv.filter((a, i) => a !== "--out" && argv[i - 1] !== "--out");
  return { bugIds, outDir };
}

function extractFileIds(stepsHtml: string): string[] {
  const regex = /file-read-(\d+)\.png/g;
  const ids = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(stepsHtml)) !== null) {
    ids.add(match[1]);
  }
  return [...ids];
}

async function main() {
  const { bugIds, outDir } = parseArgs(process.argv.slice(2));
  if (bugIds.length === 0) {
    console.error("Usage: npx tsx scripts/downloadBugImages.ts <bugId...> [--out <directory>]");
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const client = new ZentaoClient();
  console.log("Logging in to Zentao...");
  await client.login();
  console.log("Logged in.\n");

  for (const bugId of bugIds) {
    const bugDir = path.join(outDir, `#${bugId}`);
    fs.mkdirSync(bugDir, { recursive: true });

    let bug: any;
    try {
      bug = await client.getBugDetails(bugId);
    } catch (e: any) {
      console.error(`bug #${bugId}: Failed to fetch details - ${e.message}`);
      continue;
    }

    const steps = bug?.steps || "";
    const fileIds = extractFileIds(steps);

    if (fileIds.length === 0) {
      console.log(`bug #${bugId}: No screenshot attachments found`);
      continue;
    }

    for (const fileId of fileIds) {
      const target = path.join(bugDir, `file-read-${fileId}.png`);
      try {
        await client.downloadFile(fileId, target);
        const size = fs.statSync(target).size;
        console.log(`bug #${bugId}: file-read-${fileId}.png -> ${target} (${size} bytes)`);
      } catch (e: any) {
        console.error(`bug #${bugId}: file-read-${fileId}.png download failed - ${e.message}`);
      }
    }
  }
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
