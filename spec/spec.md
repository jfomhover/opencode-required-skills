# Specification

## Configuration

The plugin reads its rules from OpenCode plugin options. The plugin does not read rules from skill frontmatter.

```json
{
  "plugin": [
    [
      "opencode-required-skills",
      {
        "require": [
          {
            "skill": "project-organization",
            "on": {
              "path": "workspace/projects/**/*.md"
            }
          },
          {
            "skill": "typescript-review",
            "on": {
              "path": "src/**/*.ts"
            }
          }
        ]
      }
    ]
  ]
}
```

`require` is a list of policies. Each policy names one skill and one condition.

`on.path` is the first condition type. It contains one repository-relative glob. Add more policies when several skills are required for one path.

The following rules apply:

- `require` is optional.
- `on.path` is the only supported condition in release 1.
- Unknown condition fields cause a startup error.
- Unknown top-level plugin options cause a startup error.
- Empty rules are valid and disable enforcement.
- Duplicate policies are kept once.
- Empty skill names and empty paths cause a startup error.

## Path Rules

- Convert `\` to `/`.
- Resolve absolute paths against the OpenCode worktree.
- Match worktree-relative paths.
- Reject paths outside the worktree.
- Reject paths that escape with `..`.
- Use case-sensitive matching on all systems.
- Do not resolve symlinks in release 1.
- Remove a leading `./`.
- Reject a leading `/`.
- Use a tested glob library.
- Use `*` for one path part and `**` for multiple path parts.
- If several rules match, require the combined skill list.

Release 1 checks these tools:

- `read`
- `write`
- `edit`
- `apply_patch`

For `read`, `write`, and `edit`, use the file path arguments supplied by the tool.

For `apply_patch`, parse these patch markers:

- `*** Add File: path`
- `*** Update File: path`
- `*** Move to: path`
- `*** Delete File: path`

For a move, protect both the source and destination. For a malformed or ambiguous patch, block the call when the policy could apply. If one call contains several paths, block the full call when one path is protected. Report all matching paths and missing skills.

Release 1 does not check paths inside `bash`, `cmd`, PowerShell, shell commands, MCP tools, custom tools, subagents, `glob`, or `grep`. This is a native-tool guard, not a complete file security boundary. The bypass is documented and tested.

## Tool Hooks

### `tool.execute.before`

Use this hook for file access.

1. Read the tool name and arguments.
2. Extract the file paths for the supported tool.
3. Normalize each path.
4. Find matching rules.
5. Restore session state if needed.
6. Find missing skills.
7. Throw an error when a skill is missing.

Example error:

```text
[required-skills] Blocked edit for workspace/projects/demo/intent.md.
Call the native skill tool for "project-organization" before retrying.
```

The error must include the tool, path, rule, missing skills, and retry action. The error must not include file content or secrets.

Sort paths, rules, and skill names. Limit error length. Use a separate error when session history cannot be restored.

### `tool.execute.after`

Use this hook for the native `skill` tool.

Record a skill only after the tool succeeds. Do not record a failed, denied, or interrupted call.

## Session State

Store state by session ID:

```text
Map<sessionID, Set<skillName>>
```

Never share this state between sessions, worktrees, users, or processes.

Restore state before the first protected tool call for a session. Read `client.session.messages` and find completed native skill tool parts:

- `part.type` is `tool`.
- `part.tool` is `skill`.
- `part.state.status` is `completed`.
- `part.state.input.name` is the skill name.

Read all pages. Use `x-next-cursor` for the next page. Reject a repeated cursor. Retry one transient request failure. If recovery still fails, block the protected call and report that recovery failed.

The supported history adapters are:

- Legacy SDK responses with `x-next-cursor`.
- Current SDK responses with `Link` or `before` pagination, when supported by the selected OpenCode version.

Serialize restore work per session. Use a per-session epoch. A restore may commit only when its epoch is still current. A compaction event increments the epoch and clears the state. This prevents stale history from restoring authorization after compaction.

## Compaction

Compaction resets authorization.

Supported live events are `session.compacted` and the selected OpenCode version's typed compaction-ended event. Do not match event names with a substring.

When a compaction event arrives:

1. Increment the session epoch.
2. Clear the session skill set.
3. Mark the session as requiring fresh skill calls.
4. Cancel or invalidate an active restore for that epoch.

When a reopened session is restored from history:

1. Process messages in time order.
2. Clear the set at each persisted compaction part.
3. Count only successful skill calls after the last compaction.

There is no reliable session-reopened event. Restore state on first use.

## Forks

A fork has a new session ID. Release 1 does not inherit skills from the parent session. Restore only the child session's history. Add a fork test that uses the OpenCode fork API.

## Errors

- Reject bad plugin options at startup.
- Reject missing skill names in rules.
- Do not authorize failed skill calls.
- Report all missing skills in one error.
- Use stable error text.
- Do not expose session content in errors.
- Block a supported protected tool when its path arguments cannot be parsed.
- Ignore only tools outside the supported adapter set.
- Treat an unavailable history API as a fail-closed recovery error.

## OpenCode API

Release 1 targets OpenCode `1.18.x`, with `1.18.15` as the first tested version, and the matching `@opencode-ai/plugin` contract:

- Plugin function arguments are `(input, options)`.
- `tool.execute.before` provides the tool name, session ID, call ID, and mutable arguments.
- `tool.execute.after` provides the tool name, arguments, and result.
- `event` provides session events, including compaction events when available.
- `input.client.session.messages` provides session messages and parts.

Keep these API shapes in adapter modules. Add fixtures for supported tool-part and pagination shapes. Unsupported versions must produce a clear startup diagnostic and must not silently disable enforcement.
