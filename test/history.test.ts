import { expect, it } from "vitest"
import { readHistory } from "../src/history.js"

it("restores completed skills and resets at compaction", async () => {
  const pages = [
    [{ type: "assistant", time: { created: 1 }, parts: [{ tool: "skill", state: { status: "completed", input: { name: "old" } } }] }],
    [{ type: "compaction", time: { created: 2 } }, { type: "assistant", time: { created: 3 }, parts: [{ tool: "skill", state: { status: "completed", input: { name: "new" } } }] }],
  ]
  const client = { session: { messages: async ({ before }: any) => { const data = before ? pages[1] : pages[0]; return { data, headers: new Headers(before ? {} : { "x-next-cursor": "next" }) } } } }
  await expect(readHistory(client, "s")).resolves.toEqual([{ type: "skill-completed", name: "old", time: 1 }, { type: "compaction", time: 2 }, { type: "skill-completed", name: "new", time: 3 }])
})
