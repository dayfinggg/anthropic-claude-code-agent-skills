# Finer style rules and agent-facing docs

## Finer style rules

These follow Google and GitHub guidance.

- Write a condition first, as in "To preview the change, run the preview command."
- Use sentence case in headings and ISO 8601 dates.
- Never use a bare URL as link text.
- Name the location first in a step.
- Put the result after the action, only when it helps. Mark an optional step with "Optional".
- Write placeholders in capitals, such as `USER_ID`, and say what to replace them with.
- Use `example.com`, `example.org`, or `example.net` for domains.
- Use invented names and no real email address or phone number.
- Give every image an `alt` attribute of at most 155 characters. Use an empty `alt` for a decorative image.
- Describe current behavior in the main page. Move old behavior to a migration or old-patterns section.
- Use only the straight quote `"`. Use no guillemets, low quotes, or curly quotes.

## Agent-facing docs

`AGENTS.md` or `CLAUDE.md` is written for agents, and `README.md` is written for humans.

- Edit the agent file the project already has.
- Keep it under 200 lines, because longer files lower adherence.
- Include only facts an agent cannot infer from the code, such as build and test commands and rules that surprise.
- Write it from facts the user gives or you verified. Do not generate an overview of the repository for it.
- Put rules for one path in a scoped file, not in the root file.
