import type { Policy } from "./config.js"
import { matches, normalizePath, normalizeRule } from "./paths.js"

export type Match = { path: string; rules: string[]; skills: string[] }

export function createPolicy(policy: Policy) {
  const rules = policy.require.map((entry) => ({ ...entry, path: normalizeRule(entry.path) }))
  return {
    forPaths(paths: string[], worktree: string): Match {
      const normalized = [...new Set(paths.map((value) => normalizePath(value, worktree)))].sort()
      const matching = rules.filter((rule) => normalized.some((file) => matches(file, rule.path)))
      const protectedPaths = normalized.filter((file) => matching.some((rule) => matches(file, rule.path)))
      return { path: protectedPaths.join(", "), rules: [...new Set(matching.map((rule) => rule.path))].sort(), skills: [...new Set(matching.map((rule) => rule.skill))].sort() }
    },
  }
}
