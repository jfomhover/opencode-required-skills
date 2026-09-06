export type Policy = { require: Array<{ skill: string; path: string }> }

export class ConfigurationError extends Error {
  constructor(message: string) { super(`[required-skills] Invalid plugin options: ${message}`); this.name = "ConfigurationError" }
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ConfigurationError(`${label} must be an object`)
  return value as Record<string, unknown>
}

export function parseOptions(options: unknown): Policy {
  if (options === undefined) return { require: [] }
  const root = object(options, "options")
  for (const key of Object.keys(root)) if (key !== "require") throw new ConfigurationError(`unknown option "${key}"`)
  if (root.require === undefined) return { require: [] }
  if (!Array.isArray(root.require)) throw new ConfigurationError("require must be an array")
  const unique = new Map<string, { skill: string; path: string }>()
  for (const [index, raw] of root.require.entries()) {
    const item = object(raw, `require[${index}]`)
    if (typeof item.skill !== "string" || !item.skill.trim()) throw new ConfigurationError(`require[${index}].skill must be a non-empty string`)
    const condition = object(item.on, `require[${index}].on`)
    for (const key of Object.keys(condition)) if (key !== "path") throw new ConfigurationError(`require[${index}].on has unknown condition "${key}"`)
    if (typeof condition.path !== "string" || !condition.path.trim()) throw new ConfigurationError(`require[${index}].on.path must be a non-empty string`)
    const entry = { skill: item.skill.trim(), path: condition.path }
    unique.set(`${entry.skill}\0${entry.path}`, entry)
  }
  return { require: [...unique.values()] }
}
