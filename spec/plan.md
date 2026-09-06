# Implementation Plan

## Files

```text
src/
  index.ts              Plugin entry point.
  config.ts             Validate plugin options.
  opencode-api.ts       Adapt OpenCode API types.
  policy.ts             Match paths and return required skills.
  paths.ts              Normalize paths and apply globs.
  session-state.ts      Store and restore session state.
  history.ts            Read session history and tool parts.
  hooks.ts              Register OpenCode hooks.

test/
  config.test.ts
  paths.test.ts
  policy.test.ts
  history.test.ts
  hooks.test.ts
  fixtures/

package.json
tsconfig.json
README.md
LICENSE
spec/
  intent.md
  spec.md
  plan.md
.github/workflows/ci.yml
```

## Phase 1: Package

- Create an ESM TypeScript package named `opencode-required-skills`.
- Export the default plugin from `src/index.ts`.
- Add `@opencode-ai/plugin` as a peer and development dependency.
- Add the package entry in `exports`.
- Test local file loading and tuple options.

## Phase 2: Configuration

`src/config.ts` will convert plugin options to this model:

```ts
type Policy = {
  require: Array<{ skill: string; path: string }>
}
```

It will reject:

- Bad `require` values.
- Policies without one string `skill` and one string `on.path`.
- Unknown condition fields.
- Unknown top-level options.
- Empty skill names.
- Empty paths.

It will remove duplicate policy entries.

## Phase 3: Paths and Policy

`src/paths.ts` will use a maintained glob library with fixed options.

It will:

- Normalize separators.
- Resolve paths against the worktree.
- Reject outside-worktree paths.
- Reject lexical traversal.
- Define case behavior.
- Handle Windows drive and UNC paths.
- Handle `./`, `/`, dotfiles, symlinks, `*`, and `**`.

`src/policy.ts` will:

- Match one or more paths.
- Combine matching rules.
- Return skills in stable order.
- Return the normalized paths and rules for the error message.

The first tool adapter will support `read`, `write`, `edit`, and `apply_patch`. It will parse add, update, move, and delete markers. A move protects both paths. It will block a multi-path call when any path matches. Shell, MCP, custom-tool, and subagent access is out of scope and must have an explicit bypass test.

## Phase 4: Session History

`src/history.ts` will return this internal event type:

```ts
type SessionEvent =
  | { type: "skill-completed"; name: string; time: number }
  | { type: "compaction"; time: number }
```

It will:

- Read every page from `client.session.messages`.
- Follow `x-next-cursor`.
- Support `Link` or `before` pagination for the selected current API version.
- Reject a repeated cursor.
- Retry one transient request failure.
- Parse legacy and current tool-part shapes.
- Ignore failed and pending skill calls.
- Use completion time, then message time, for order.
- Use message order and part order as tie-breakers for equal timestamps.
- Test equal timestamps and compaction order.

`src/session-state.ts` will:

- Key state by session ID.
- Restore on first protected call.
- Serialize restore work with a promise map.
- Record completed skill calls.
- Clear state on live compaction.
- Clear state at persisted compaction parts.
- Avoid parent-session inheritance.
- Use a per-session epoch. A restore may commit only when its epoch is unchanged. Compaction increments the epoch and invalidates active restore work.

## Phase 5: Hooks

`src/hooks.ts` will register:

- `tool.execute.before` for protected file calls.
- `tool.execute.after` for successful native skill calls.
- `event` for compaction reset and session cleanup.

The hook layer will not scan skill directories or parse skill files. It will use native OpenCode skill calls and session history.

The hook layer will return stable, redacted errors. Block supported protected tools when path arguments cannot be parsed. Ignore only tools outside the supported adapter set.

## Phase 6: Tests

Add tests for:

- Valid and invalid options.
- Unknown options and conditions.
- Duplicate rules.
- All path normalization cases.
- Glob matching.
- Overlapping rules.
- All supported file tools.
- `apply_patch` marker parsing, including moves and deletes.
- Shell, MCP, custom-tool, and subagent bypass behavior.
- Multi-path calls.
- Blocking and error text.
- Successful skill calls.
- Failed skill calls.
- Session restoration.
- History pagination.
- Cursor failure.
- Compaction restore and live reset.
- Concurrent restore and compaction races.
- Concurrent skill completion and restore races.
- Session isolation.
- Forks without implicit inheritance.
- Legacy and current tool-part fixtures.
- Tuple options through the OpenCode plugin loader.
- Installation from the built npm tarball.
- Disabled, denied, interrupted, unresolved, and malformed skill calls.

## Phase 7: Developer Smoke Test

For manual local testing, use a temporary project configuration and a free Zen model when available. This is a developer smoke test only.

Test these cases:

1. Access a protected file without the skill. The plugin must block the call.
2. Load the skill and access the file. The call must succeed.

Do not use Zen for integration tests, release gates, or CI. Use deterministic plugin-loader tests and fake clients for those gates.

## Phase 8: Documentation

Update `README.md` with:

- Purpose and limits.
- Config syntax.
- Supported `require` policy list with `on.path` conditions.
- Session behavior.
- Compaction behavior.
- Local setup.
- npm setup.
- Supported OpenCode versions.

## Phase 9: npm Release

- Use package name `opencode-required-skills`.
- Add keyword `opencode-plugin`.
- Add repository, bugs, homepage, license, and engine fields.
- Select and document Node.js and OpenCode version ranges.
- Pin the first OpenCode baseline to `1.18.x`, first tested at `1.18.15`.
- Define ESM output and declaration files.
- Define `exports` and `files`.
- Use `npm pack --dry-run` in CI.
- Exclude tests and local fixtures from the package.
- Test the packed tarball in a clean OpenCode project.
- Test the packed tarball under the OpenCode/Bun runtime, not only Node.
- Add `build`, `typecheck`, `test`, `lint`, and `prepublishOnly` scripts.
- Add CI for pull requests and release tags.
- Use a prerelease while the OpenCode plugin API changes.

## Later Work

- Content conditions.
- Automatic policy discovery from skill metadata.
- Plugin-owned durable state.
- Parent-session inheritance.
- A dedicated OpenCode skill lifecycle hook.
