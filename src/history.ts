import { isObject } from "./opencode-api.js"

export type SessionEvent = { type: "skill-completed"; name: string; time: number } | { type: "compaction"; time: number }
export class HistoryError extends Error { constructor(message: string) { super(`[required-skills] Unable to restore session history: ${message}`); this.name = "HistoryError" } }

function header(response: any, name: string): string | undefined { return response?.headers?.get?.(name) ?? response?.headers?.[name] ?? response?.response?.headers?.get?.(name) }
function messagesOf(page: any): any[] { const value = page?.data ?? page?.items ?? page; return Array.isArray(value) ? value : [] }
function timestamp(message: any, part: any): number { return part?.state?.time?.completed ?? part?.time?.completed ?? message?.time?.created ?? message?.timestamp ?? 0 }

export async function readHistory(client: { session: { messages: (input: any) => Promise<any> } }, sessionID: string): Promise<SessionEvent[]> {
  const all: Array<{ message: any; index: number }> = []; let cursor: string | undefined; const seen = new Set<string>(); let pageIndex = 0
  do {
    let page: any
    try { page = await client.session.messages({ sessionID, limit: 100, before: cursor }) } catch (error) {
      try { page = await client.session.messages({ sessionID, limit: 100, ...(cursor ? { before: cursor } : {}) }) } catch { throw new HistoryError(error instanceof Error ? error.message : "history request failed") }
    }
    for (const [index, message] of messagesOf(page).entries()) all.push({ message, index: pageIndex * 100 + index })
    const next = header(page, "x-next-cursor") ?? header(page, "Link")?.match(/[?&]before=([^>;]+)/)?.[1] ?? (page?.nextCursor as string | undefined)
    if (next && seen.has(next)) throw new HistoryError("pagination cursor repeated")
    if (next) seen.add(next)
    cursor = next; pageIndex++
  } while (cursor)
  const events: Array<SessionEvent & { order: number }> = []
  for (const { message, index } of all) {
    if (message?.type === "compaction" || message?.info?.type === "compaction") events.push({ type: "compaction", time: message?.time?.created ?? message?.info?.time?.created ?? message?.timestamp ?? 0, order: index })
    const parts = message?.parts ?? message?.content ?? []
    for (const part of parts) {
      const tool = part?.tool ?? part?.name
      const state = part?.state
      const name = state?.input?.name ?? state?.input?.skill ?? part?.input?.name
      if (tool === "skill" && state?.status === "completed" && typeof name === "string" && name) events.push({ type: "skill-completed", name, time: timestamp(message, part), order: index })
    }
  }
  return events.sort((a, b) => a.time - b.time || a.order - b.order).map(({ order: _order, ...event }) => event)
}
