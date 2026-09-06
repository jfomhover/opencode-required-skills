import { parseOptions } from "./config.js"
import { createHooks } from "./hooks.js"

/** Enforce configured native skill requirements at OpenCode file-tool boundaries. */
export default async function requiredSkills(input: any, options?: unknown) {
  return createHooks(input, parseOptions(options))
}
