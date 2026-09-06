# OpenCode v2 Notes

## Status

**Deferred. The MVP targets stable OpenCode v1 only.**

Do not expand the MVP implementation or compatibility range to support v2. Revisit this document when OpenCode 2.0 leaves beta and its plugin contract is documented as stable.

## Verified v2 Differences

OpenCode v2 is distributed as a separate `opencode2` beta and can run alongside stable `opencode`. The official v2 documentation identifies these intentional breaking changes:

- Plugins use a new plugin API.
- The server API and client contracts are new.
- Terminal client configuration moves to a global `cli.json`.

The v2 plugin contract in the OpenCode source is structurally different from the v1 hook contract:

```ts
export interface Plugin {
  readonly id: string
  readonly setup: (context: PluginContext) => Promise<void> | void
}
```

The v1 plugin contract used by the MVP is a function receiving `(input, options)` and returning a hooks object containing entries such as `tool.execute.before`, `tool.execute.after`, and `event`.

V2 configuration examples use a `plugins` array and support package objects with options:

```jsonc
{
  "plugins": [
    {
      "package": "opencode-required-skills",
      "options": {
        "require": []
      }
    }
  ]
}
```

The stable v1 configuration targeted by the MVP uses the singular `plugin` field and tuple options:

```json
{
  "plugin": [
    [
      "opencode-required-skills",
      { "require": [] }
    ]
  ]
}
```

## V2 Implementation Plan

When v2 becomes a supported target, implement it as an explicit adapter rather than mixing v1 and v2 assumptions throughout the enforcement logic.

1. Add a v2 entry point or a versioned package export.
2. Keep configuration parsing, path normalization, glob matching, policy evaluation, and redacted error construction shared where their semantics remain identical.
3. Adapt v2 tool execution hooks to the existing protected-tool model.
4. Adapt v2 native skill completion and session-history events to the existing session-state model.
5. Verify the v2 `apply_patch` representation, compaction events, fork behavior, and history pagination independently.
6. Add a v2-specific plugin-loader test and a clean-project smoke test.
7. Publish v2 support as a prerelease until the upstream API and OpenCode release are stable.

Do not infer v2 compatibility from the existence of v2 documentation. The v2 documentation currently identifies the release as beta and warns that plugin and server APIs may continue to change.

## Compatibility Rule

Until this document is explicitly moved out of deferred status:

- The package peer range remains the stable v1 range.
- The README documents v1 installation and configuration.
- CI release gates test the v1 plugin loader only.
- V2 changes are research and design work, not MVP acceptance criteria.
