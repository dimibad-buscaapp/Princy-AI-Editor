#!/usr/bin/env node
/**
 * Princy performance benchmark against VPS gateway.
 * Usage: node scripts/princy-perf-benchmark.mjs [--endpoint URL]
 */
const endpoint = process.argv.includes("--endpoint")
  ? process.argv[process.argv.indexOf("--endpoint") + 1]
  : "http://13.140.129.77:3407/api";

async function timed(name, fn) {
  const start = performance.now();
  try {
    const result = await fn();
    const ms = Math.round(performance.now() - start);
    return { name, ms, ok: true, result };
  } catch (err) {
    const ms = Math.round(performance.now() - start);
    return { name, ms, ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function main() {
  const report = { endpoint, timestamp: new Date().toISOString(), metrics: [] };

  report.metrics.push(
    await timed("systemHealth", () =>
      fetch(`${endpoint}/system/health`).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
    )
  );

  report.metrics.push(
    await timed("memoryUsage", () =>
      fetch(`${endpoint}/memory/usage`).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
    )
  );

  report.metrics.push(
    await timed("ghostText", () =>
      fetch(`${endpoint}/code/ghost-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefix: "function hello() {\n  console.log(", language: "typescript" })
      }).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
    )
  );

  console.log(JSON.stringify(report, null, 2));

  const ghost = report.metrics.find((m) => m.name === "ghostText");
  const memory = report.metrics.find((m) => m.name === "memoryUsage");
  if (ghost?.ok && ghost.ms > 300) console.warn(`WARN: ghost p95 target <300ms, got ${ghost.ms}ms`);
  if (memory?.ok && memory.ms > 1000) console.warn(`WARN: memory load target <1s, got ${memory.ms}ms`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
