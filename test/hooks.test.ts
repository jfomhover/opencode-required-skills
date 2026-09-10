import { expect, it } from "vitest"
import plugin from "../src/index.js"
import { pathsFor } from "../src/hooks.js"

it("blocks then permits a protected native file call", async () => {
  const input = { directory: "/repo", worktree: "/repo", client: { session: { messages: async () => ({ data: [] }) } } }
  const hooks: any = await plugin(input, { require: [{ skill: "organize", on: { path: "docs/**" } }] })
  await expect(hooks["tool.execute.before"]({ tool: "read", sessionID: "s", callID: "c" }, { args: { filePath: "docs/a.md" } })).rejects.toThrow(/organize/)
  await hooks["tool.execute.after"]({ tool: "skill", sessionID: "s", args: { name: "organize" } }, {})
  await expect(hooks["tool.execute.before"]({ tool: "read", sessionID: "s", callID: "c" }, { args: { filePath: "docs/a.md" } })).resolves.toBeUndefined()
})

it("parses the host patchText argument and all patch markers", () => {
  const patchText = [
    "*** Begin Patch",
    "*** Add File: docs/new.md",
    "+new",
    "*** Update File: docs/old.md",
    "@@",
    "-old",
    "+new",
    "*** Move to: docs/moved.md",
    "*** Delete File: docs/deleted.md",
    "*** End Patch",
  ].join("\n")
  expect(pathsFor("apply_patch", { patchText })).toEqual(["docs/new.md", "docs/old.md", "docs/moved.md", "docs/deleted.md"])
})

it("uses patch as a legacy fallback only when patchText is absent", () => {
  expect(pathsFor("apply_patch", { patch: "*** Update File: docs/old.md" })).toEqual(["docs/old.md"])
  expect(pathsFor("apply_patch", { patchText: 42, patch: "*** Update File: docs/old.md" })).toBeUndefined()
})

it("allows an unprotected patch and blocks a protected patch", async () => {
  const input = { directory: "/repo", worktree: "/repo", client: { session: { messages: async () => ({ data: [] }) } } }
  const hooks: any = await plugin(input, { require: [{ skill: "organize", on: { path: "docs/**/*.md" } }] })
  await expect(hooks["tool.execute.before"]({ tool: "apply_patch", sessionID: "s", callID: "c" }, { args: { patchText: "*** Update File: src/a.ts" } })).resolves.toBeUndefined()
  await expect(hooks["tool.execute.before"]({ tool: "apply_patch", sessionID: "s", callID: "c" }, { args: { patchText: "*** Update File: docs/a.md" } })).rejects.toThrow(/organize/)
})

it("blocks missing or malformed patch text", async () => {
  const input = { directory: "/repo", worktree: "/repo", client: { session: { messages: async () => ({ data: [] }) } } }
  const hooks: any = await plugin(input, { require: [{ skill: "organize", on: { path: "docs/**/*.md" } }] })
  await expect(hooks["tool.execute.before"]({ tool: "apply_patch", sessionID: "s", callID: "c" }, { args: {} })).rejects.toThrow(/could not be parsed safely/)
  await expect(hooks["tool.execute.before"]({ tool: "apply_patch", sessionID: "s", callID: "c" }, { args: { patchText: "not a patch" } })).rejects.toThrow(/could not be parsed safely/)
})

it("is a no-op when no policies are configured", async () => {
  const input = { directory: "/repo", worktree: "/repo", client: { session: { messages: async () => ({ data: [] }) } } }
  const hooks: any = await plugin(input)
  expect(hooks).toEqual({})
})

it("ignores external reads but rejects external mutations", async () => {
  const input = { directory: "/repo", worktree: "/repo", client: { session: { messages: async () => ({ data: [] }) } } }
  const hooks: any = await plugin(input, { require: [{ skill: "organize", on: { path: "docs/**/*.md" } }] })
  await expect(hooks["tool.execute.before"]({ tool: "read", sessionID: "s", callID: "c" }, { args: { filePath: "/other-repository/notes.md" } })).resolves.toBeUndefined()
  await expect(hooks["tool.execute.before"]({ tool: "edit", sessionID: "s", callID: "c" }, { args: { filePath: "/other-repository/notes.md" } })).rejects.toThrow(/outside the worktree/)
})
