# Intent

## Vision

`opencode-required-skills` enforces project work rules at selected native tool boundaries.

A project can require a skill before an agent reads, writes, edits, or patches a file. This is useful when a file needs a special format, review process, or validation process.

The agent can forget a rule. The model can lose the rule after compaction. The plugin blocks a supported tool call until the agent loads the required skill.

The plugin does not replace the OpenCode skill loader. It does not change standard skill frontmatter. It uses the native `skill` tool and session history.

## Value

The plugin provides a clear sequence:

1. A file path matches a project rule.
2. The required skill is not complete in the current session.
3. The plugin blocks the tool call.
4. The plugin returns an error that names the required skill.
5. The agent loads the skill and retries the tool call.

The project owner controls the rules. The rules are in project configuration. The rules are visible in version control.

## Scope

The first release supports path rules for selected native file tools. A path rule maps a file glob to one or more skill names.

The design leaves space for later rule types. Examples are content rules and tool rules.

The first release is an OpenCode plugin. The plugin will be published as an npm package.

## Non-goals

- Do not replace the OpenCode skill loader.
- Do not parse skill directories in the plugin.
- Do not change standard `SKILL.md` frontmatter.
- Do not claim to guard shell commands, MCP tools, custom tools, or subagent execution in the first release.
- Do not load a skill without an agent call.
- Do not judge the quality of a skill.
- Do not guess a required skill.
- Do not build a full policy language in the first release.
