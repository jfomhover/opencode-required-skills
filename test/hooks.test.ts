import { expect, it } from "vitest"
import plugin from "../src/index.js"

it("blocks then permits a protected native file call", async () => {
  const input = { directory: "/repo", worktree: "/repo", client: { session: { messages: async () => ({ data: [] }) } } }
  const hooks: any = await plugin(input, { require: [{ skill: "organize", on: { path: "docs/**" } }] })
  await expect(hooks["tool.execute.before"]({ tool: "read", sessionID: "s", callID: "c" }, { args: { filePath: "docs/a.md" } })).rejects.toThrow(/organize/)
  await hooks["tool.execute.after"]({ tool: "skill", sessionID: "s", args: { name: "organize" } }, {})
  await expect(hooks["tool.execute.before"]({ tool: "read", sessionID: "s", callID: "c" }, { args: { filePath: "docs/a.md" } })).resolves.toBeUndefined()
})
