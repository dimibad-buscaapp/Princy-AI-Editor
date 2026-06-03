import path from "node:path";

const DENIED_DIRS = new Set(["node_modules", ".git", ".svn", ".hg", "dist", "build"]);

export function isDeniedPath(relativePath: string) {
  const segments = relativePath.split(/[/\\]/).filter(Boolean);
  return segments.some((segment) => DENIED_DIRS.has(segment));
}

export function resolveSafePath(root: string, target: string) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(resolvedRoot, target);
  if (!resolvedTarget.startsWith(resolvedRoot)) {
    throw new Error("Path traversal detected.");
  }
  const relative = path.relative(resolvedRoot, resolvedTarget);
  if (isDeniedPath(relative)) {
    throw new Error("Access to path is denied.");
  }
  return resolvedTarget;
}
