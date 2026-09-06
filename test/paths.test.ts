import { describe, expect, it } from "vitest"
import { matches, normalizePath, normalizeRule } from "../src/paths.js"

describe("paths", () => {
  it("normalizes separators and absolute worktree paths", () => expect(normalizePath("C:\\repo\\src\\a.ts", "C:\\repo")).toBe("src/a.ts"))
  it("rejects traversal and outside paths", () => { expect(() => normalizePath("../secret", "/repo")).toThrow(); expect(() => normalizeRule("/src/**")).toThrow() })
  it("matches component-aware globs", () => { expect(matches("src/a/b.ts", "src/**/*.ts")).toBe(true); expect(matches("src/a/b.ts", "src/*.ts")).toBe(false) })
})
