---
name: instructions
description: Writes and revises instructions for AI agents and models, such as CLAUDE.md, AGENTS.md, skills, output styles, subagent definitions, hook reminders, and system prompts. Use when creating, auditing, or fixing such text.
---

# Instructions

These rules make instruction text change what an agent actually does, and they require proof from fresh sessions instead of trust in the wording.

## Write each rule so it can be followed

Write instruction text, including its examples, in English, and set the reply language through a rule such as "the language of the user's latest message" instead of hardcoded phrases, because the same files serve every project and language, and mixed-language instructions leak into replies.

<example>
"Write the final answer in the language of the user's latest message" instead of a rule that quotes a sample reply in one fixed language.
</example>

State each rule as an observable action, with the reason after "because" and one short example in `<example>` tags, because the model generalizes from the reason and copies the example's shape, while a bare imperative is applied too broadly or too narrowly.

<example>
"Send a tool call without accompanying text, because the user follows progress in the task list" with an example of a message that holds only the Edit call, instead of "Be silent while working".
</example>

Fix an ignored rule by adding its reason, an example, or a check, never by repeating it, capitalizing it, or adding "IMPORTANT", because repetition and pressure words do not make current models follow a rule better and make them apply it rigidly where it does not fit.

<example>
A rule against closing summaries that was written three times in caps becomes one sentence with its reason and one example of the exact reply shape wanted.
</example>

Describe the wanted behavior positively, and keep a prohibition only for a real constraint with its reason, because a list of things not to do anchors the model on those very things and leaves the target behavior unstated.

<example>
"Open the final answer with the result" instead of "Do not start with a summary of what you did, do not say Done, do not list the files".
</example>

Give the reader model the context only the author knows, such as the audience, the environment, the quality bar, and why a constraint exists, and leave out what the model already does by default, because missing context produces generic behavior and restated defaults dilute the rules that matter.

<example>
"Staging sends mail through the production mail server, so a test signup emails a real customer" is worth a line, while "write clean, readable code" is not.
</example>

Keep model names, dates, and version-specific facts out of instructions unless the file targets exactly that model or version, because pinned names and dates rot at the next release while the behavior they describe stays.

<example>
"Lower the effort setting when thinking takes too long" instead of "On model X since August, add think less".
</example>

Match the level of detail to the risk, with exact commands and sequences for fragile operations and heuristics for judgment calls, because a script for a judgment task blocks better approaches while vague prose for a destructive task invites improvisation.

<example>
A deployment procedure lists its exact commands in order, while code review guidance says what to look for and lets the model choose the order.
</example>

## Keep the instruction set coherent

Before adding a rule, search every file that loads in the same session, including CLAUDE.md and its imports, the output style, mod sections and reminders, skills, and the project's AGENTS.md, for rules on the same topic, then edit the existing rule or remove the duplicate, because two wordings of one rule drift apart and the model must reconcile them.

<example>
Before adding a rule about progress messages to a skill, Grep finds the same topic in the output style and a reminder, so the skill gets no copy and the reminder is aligned with the output style.
</example>

Put a rule that must hold every time into a hook, a setting, or a permission rule instead of prose, because prose is followed with judgment and can lapse late in a long session, while a hook runs on every matching event.

<example>
"Never edit files under `vendor/`" becomes a deny rule in settings, while "prefer small focused functions" stays in a skill.
</example>

Package a skill with a lowercase hyphenated `name` and a short third-person `description` that says what the skill does and when to use it in intent categories, keep SKILL.md well under 500 lines with details in reference files linked directly from it, and refer to bundled scripts from SKILL.md through the `CLAUDE_SKILL_DIR` substitution, written as a dollar sign followed by the name in braces, with forward slashes, because every description loads in every session, nested references get read partially, and relative script paths break when the working directory changes. Only SKILL.md gets that substitution, so a reference file names the skill's base directory in words instead.

<example>
`description: Writes commit messages and shapes commits. Use whenever creating or describing commits.` instead of a description that lists twenty trigger words, with `references/pr-template.md` linked from SKILL.md rather than from another reference.
</example>

## Prove the change in fresh sessions

Test a changed instruction in fresh sessions before calling it done, by running a few deliberately vague prompts that exercise it, for example with `claude -p` from a scratch folder, before and after the edit, and reading the output or transcript for each violation, because the author's session already knows the intent and asking a model whether it follows a rule is not a measurement. Delete the scratch folders afterwards.

<example>
`claude -p "Make the export faster"` run three times from an empty temp folder shows a status message after a Bash call in two runs before the change and in none after it.
</example>

When a violation persists, find which text the model actually received and when the violation appeared, such as right after a particular tool, reminder, or skill load, and fix the instruction at that trigger, because the cause often sits in another section or in harness text rather than in the rule being edited.

<example>
Most unwanted summaries appear right after long test runs, while the reminder fires only after file edits, so the reminder is extended to test runs instead of rewording the main rule again.
</example>

When the target is a Claude model and the text may carry patterns written for older models, run the claude-api skill's prompt audit as the review procedure, because it lists those dated patterns together with the content that must stay.

<example>
An inherited system prompt full of "think step by step" and capitalized MUST lines is audited with `/claude-api prompt-audit` before any rewrite.
</example>
