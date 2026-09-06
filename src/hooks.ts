import type { Policy } from "./config.js"
import { createPolicy } from "./policy.js"
import { SessionState } from "./session-state.js"

const tools = new Set(["read", "write", "edit", "apply_patch"])
function pathsFor(tool: string, args: any): string[] | undefined {
  if (tool === "apply_patch") {
    if (typeof args?.patch !== "string") return undefined
    const result: string[] = []; const lines = args.patch.split(/\r?\n/)
    let currentMoveSource: string | undefined
    for (const line of lines) {
      const marker = line.match(/^\*\*\* (Add File|Update File|Move to|Delete File): (.+)$/)
      if (marker) {
        const [, kind, rawPath] = marker; const target = rawPath.trim()
        if (!target) return undefined
        if (kind === "Move to") { if (!currentMoveSource) return undefined; result.push(target) } else { result.push(target); currentMoveSource = kind === "Update File" ? target : undefined }
        continue
      }
      const source = line.match(/^\*\*\* Move from: (.+)$/)
      if (source) { if (currentMoveSource) return undefined; currentMoveSource = source[1].trim(); if (!currentMoveSource) return undefined; result.push(currentMoveSource) }
    }
    return result.length ? result : undefined
  }
  const value = args?.filePath ?? args?.path ?? args?.filename
  return typeof value === "string" ? [value] : undefined
}
function error(tool: string, match: ReturnType<ReturnType<typeof createPolicy>["forPaths"]>, missing: string[]): Error {
  return new Error(`[required-skills] Blocked ${tool} for ${match.path}. Rules: ${match.rules.join(", ") || "none"}. Missing skills: ${missing.join(", ")}. Call the native skill tool for ${missing.map((name) => `"${name}"`).join(", ")} before retrying.`)
}

export function createHooks(input: any, policy: Policy) {
  const matcher = createPolicy(policy); const state = new SessionState(); const worktree = input.worktree ?? input.directory
  return {
    async event({ event }: { event: any }) { const type = event?.type; if (type === "session.compacted" || type === "session.next.compaction.ended") state.compact(event.sessionID) },
    async "tool.execute.before"(toolInput: any, output: any) {
      if (!tools.has(toolInput.tool)) return
      const paths = pathsFor(toolInput.tool, output.args); if (!paths) throw new Error(`[required-skills] Blocked ${toolInput.tool}: file paths could not be parsed safely.`)
      const match = matcher.forPaths(paths, worktree); if (!match.skills.length) return
      const known = await state.restore(toolInput.sessionID, input.client); const missing = match.skills.filter((skill) => !known.has(skill)); if (missing.length) throw error(toolInput.tool, match, missing)
    },
    async "tool.execute.after"(toolInput: any, output: any) { if (toolInput.tool !== "skill") return; if (output?.error) return; const name = toolInput.args?.name; if (typeof name === "string" && name) state.complete(toolInput.sessionID, name) },
    dispose: async () => { /* state is intentionally process-local and session-scoped */ },
  }
}
