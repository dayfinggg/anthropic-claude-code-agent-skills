### Authoring or modifying a skill

**You own the skill's voice.**

1. Write the skill in Claude Code's format. A folder holds `SKILL.md` with YAML frontmatter, `name` in kebab case and a `description` that names the situations where the skill applies, because the model picks and starts skills on its own by description. Leave model invocation on, so the user never has to remember which skill to call. Supporting files sit beside it and the body points to them by relative path. User skills live in `~/.claude/skills/<name>/`, project skills in `.claude/skills/<name>/`.
2. Validate the skill: frontmatter has `name` and `description`, referenced files exist, cross-skill links resolve.
3. Test cases if structural. Skip if subjective.
4. Run **Opening a PR** when the task asked for a commit or a PR.

When in doubt, delete. Keep only prose that changes a decision. Tell it to do the thing and skip the reason. Explain only when the rule is confusing without one. Match tone to scope. Point at structural sources (types, READMEs, config). Delegate to other skills by path. Don't restate. A workflow you keep hitting but isn't captured → propose a new skill.

**Reply:** summary of the skill, key design decisions, validation notes.
