import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

function findMonorepoRoot(startDir) {
  let dir = path.resolve(startDir);
  const root = path.parse(dir).root;
  while (dir !== root) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        if (pkg.workspaces) {
          return dir;
        }
      }
      catch {
        // ignore invalid package.json
      }
    }
    dir = path.dirname(dir);
  }
  return startDir;
}

const repoRoot = findMonorepoRoot(process.cwd());
const envPath = path.join(repoRoot, ".env");
dotenv.config({ path: envPath, quiet: true });
