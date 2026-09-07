import assert from "node:assert/strict"
import requiredSkills from "../dist/index.js"

const input = {
  directory: process.cwd(),
  worktree: process.cwd(),
  client: { session: { messages: async () => ({ data: [] }) } },
}

const hooks = await requiredSkills(input, {
  require: [{ skill: "smoke-test-skill", on: { path: "protected/**/*.md" } }],
})

const before = { tool: "apply_patch", sessionID: "smoke", callID: "call" }

await hooks["tool.execute.before"](before, {
  args: { patchText: "*** Begin Patch\n*** Update File: public.md\n*** End Patch" },
})

await assert.rejects(
  hooks["tool.execute.before"](before, {
    args: { patchText: "*** Begin Patch\n*** Update File: protected/secret.md\n*** End Patch" },
  }),
  /smoke-test-skill/,
)

await assert.rejects(
  hooks["tool.execute.before"](before, { args: { patchText: "not a patch" } }),
  /could not be parsed safely/,
)

await hooks["tool.execute.before"](before, {
  args: { patch: "*** Begin Patch\n*** Update File: public-legacy.md\n*** End Patch" },
})

console.log("apply_patch patchText smoke test passed")
