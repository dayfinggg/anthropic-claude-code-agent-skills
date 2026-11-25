# vesper-sieve

What is not needed sleeps until it is called.

A Claude Code plugin that rewrites the instructions the model reads. It keeps rarely used tools out of the context until they are needed, replaces parts of the system prompt with its own rules for each Claude model, and adds ten skills that the model loads on its own. The skill for security work is listed only for Claude Mythos models.

## Install

```
claude plugin install vesper-sieve --marketplace dayfinggg/anthropic-claude-code-agent-skills
```
