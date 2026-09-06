export type PluginInput = { client: { session: { messages: (input: { sessionID: string; limit?: number; before?: string }) => Promise<unknown> } }; worktree?: string; directory: string }
export type BeforeInput = { tool: string; sessionID: string; callID: string }
export type BeforeOutput = { args: unknown }
export type AfterInput = { tool: string; sessionID: string; callID: string; args: unknown }
export type EventInput = { event: unknown }

export function isObject(value: unknown): value is Record<string, any> { return !!value && typeof value === "object" }
