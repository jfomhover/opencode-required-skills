import path from "node:path"
import { minimatch } from "minimatch"

export class PathError extends Error { constructor(message: string) { super(`[required-skills] Invalid path: ${message}`); this.name = "PathError" } }

export function normalizeRule(value: string): string {
  let rule = value.replaceAll("\\", "/")
  if (rule.startsWith("/")) throw new PathError("a rule may not start with /")
  if (rule.startsWith("./")) rule = rule.slice(2)
  if (!rule || rule.split("/").some((part) => part === "..")) throw new PathError("a rule may not be empty or escape with ..")
  return rule
}

export function normalizePath(value: unknown, worktree: string): string {
  if (typeof value !== "string" || !value.trim()) throw new PathError("file path must be a non-empty string")
  const input = value.replaceAll("\\", "/")
  const root = path.resolve(worktree)
  const absolute = path.isAbsolute(input) ? path.resolve(input) : path.resolve(root, input)
  const relative = path.relative(root, absolute).replaceAll("\\", "/")
  if (relative === "" || relative === "." || relative === ".." || relative.startsWith("../") || path.isAbsolute(relative)) throw new PathError("path is outside the worktree")
  if (input.split("/").some((part) => part === "..")) {
    const lexical = path.posix.normalize(input)
    if (lexical === ".." || lexical.startsWith("../")) throw new PathError("path escapes the worktree")
  }
  return relative.startsWith("./") ? relative.slice(2) : relative
}

export function matches(file: string, rule: string): boolean {
  return minimatch(file, normalizeRule(rule), { dot: true, nocase: false, nocomment: true, nonegate: true })
}
