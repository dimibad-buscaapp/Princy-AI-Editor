/**
 * Export UI assets from official reference PNGs in public/princy/refs/.
 * Run: node scripts/export-princy-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const refsDir = path.join(root, "apps/frontend/public/princy/refs");
const outDir = path.join(root, "apps/frontend/public/princy");

const crops = [
  { ref: "03-index.png", name: "hero-alien.png", left: 38, top: 5, width: 62, height: 55 },
  { ref: "06-swarm.png", name: "swarm-brain.png", left: 22, top: 18, width: 56, height: 62 },
  { ref: "06-swarm.png", name: "galaxy-bg.webp", left: 0, top: 0, width: 72, height: 100 },
  { ref: "08-statusbar.png", name: "ship-statusbar.png", left: 0, top: 0, width: 28, height: 100 },
  { ref: "02-sidebar.png", name: "logo-alien.png", left: 4, top: 3, width: 18, height: 8 },
  { ref: "02-sidebar.png", name: "avatar-alien.png", left: 4, top: 3, width: 18, height: 8 },
  { ref: "04-chat.png", name: "chat-avatar.png", left: 28, top: 22, width: 8, height: 8 }
];

if (!fs.existsSync(refsDir)) {
  console.error("Missing refs dir:", refsDir);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.warn("[export-princy-assets] sharp not available; copying refs as fallbacks.");
  for (const crop of crops) {
    const src = path.join(refsDir, crop.ref);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(outDir, crop.name));
      console.log("Copied", crop.name, "from", crop.ref);
    }
  }
  process.exit(0);
}

for (const crop of crops) {
  const src = path.join(refsDir, crop.ref);
  if (!fs.existsSync(src)) {
    console.warn("Skip missing ref:", crop.ref);
    continue;
  }
  const meta = await sharp(src).metadata();
  const w = meta.width ?? 1200;
  const h = meta.height ?? 800;
  const left = Math.max(0, Math.round((crop.left / 100) * w));
  const top = Math.max(0, Math.round((crop.top / 100) * h));
  const width = Math.min(Math.round((crop.width / 100) * w), w - left);
  const height = Math.min(Math.round((crop.height / 100) * h), h - top);
  const dest = path.join(outDir, crop.name);
  const pipeline = sharp(src).extract({ left, top, width, height });
  if (crop.name.endsWith(".webp")) {
    await pipeline.webp({ quality: 82 }).toFile(dest);
  } else {
    await pipeline.png().toFile(dest);
  }
  console.log("Wrote", dest);
}
