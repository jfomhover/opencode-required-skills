# OpenCode Smoke Test

This is a disposable OpenCode project for testing the local build without publishing or installing the npm package. Its `.opencode/plugins/required-skills.js` wrapper loads the repository's `dist/index.js` and supplies a smoke-test policy. The policy includes the `smoke-test/` prefix because OpenCode uses the repository root as the worktree for this fixture.

Run from this directory after building the plugin:

```powershell
npm --prefix .. run build
opencode run -m opencode/big-pickle --print-logs --log-level INFO --auto "Read protected/example.md and summarize it. Do not call the smoke-test-skill first."
```

Expected result: the plugin blocks the `read` call and reports that `smoke-test-skill` must be loaded first. A successful model summary means the local plugin was not loaded and should be investigated before relying on the result.

This fixture intentionally tests only the first blocking step. It does not provide a real skill, so a second successful retry is outside this fixture's scope.
