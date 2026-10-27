---
name: interrogate
description: "Run several models as adversarial reviewers of a change and synthesize one verdict. Use before finishing a change that is risky or contested: security, auth, money, data, migrations, concurrency, a public API, or a design with real tradeoffs. Also for 'interrogate', 'challenge this', 'stress test', 'find blind spots'."
---

# Interrogate

Spawn one reviewer per configured model to adversarially review code changes. The adversarial signal comes from model diversity, not assigned personas. The deliverable is a synthesized verdict. Do NOT auto-apply changes.

## Step 1, Scope

Identify what to review from context:

- If the user points at specific files or a diff, use that.
- If on a feature branch, run `git diff main...HEAD` (or the appropriate base branch) for the full changeset.
- If the user's message references recent work, gather the relevant files.

Package the diff or file contents with any surrounding context files the reviewers need to understand the code.

## Step 2, Intent

Before spawning reviewers, state the intent in one clear paragraph from the user's message, commit messages, the PR description if one exists, and the code. If you're unsure about the intent, ask the user before proceeding.

## Step 3, Spawn Reviewers

Launch all reviewers in a single message with the Agent tool, one per entry on the `interrogate reviewers` row of the Models table in the **poteto-mode** skill, labeled Reviewer A, B, and so on to match the entry count. The adversarial signal comes from the different Claude models in that row.

Each reviewer gets `subagent_type: "Explore"`, "do not edit files" in its brief, and `model` and `effort` from its entry. Omit `model` for an `inherit` entry, so that reviewer runs on the session's model.

If the Agent tool rejects an entry, run that reviewer on the nearest value it accepts and say so in one sentence. Do not block the review on it.

Read `references/reviewer-prompt.md` and fill in the same template for every reviewer with the stated intent, the diff or file contents, the rubric from `references/rubric.md`, and the code-quality lens from `references/code-quality-review.md`. Pick each subagent's effort for the job, per the Subagents section of the **poteto-mode** skill.

## Step 4, Synthesize

As results come back, build a unified picture. Parse every reviewer's findings. Merge findings that describe the same issue differently, and note which models raised each one. Findings two or more models raised independently are the highest signal. Read a lone model's finding, but weight it accordingly. Note disagreements. If one model flags something and another explicitly says the opposite, that is context for the verdict.

## Step 5, Lead Judgment

You are the lead reviewer, a pragmatic senior engineer, not a neutral aggregator. Read `references/lead-judgment.md` for the full framework. Put every finding in one of four buckets, with the model(s) that raised it and a one-line rationale.

- **Act on**. Real issues affecting correctness, security, or maintainability given the actual goals. They would block a real PR.
- **Consider**. Legitimate, but you're not sure they outweigh the cost of addressing them now. Worth the user's attention.
- **Noted**. Technically valid but not actionable. Context-dependent, premature optimization, or low-impact at this stage.
- **Dismissed**. Wrong, nitpicky, or missing context, with a brief reason.

## Answer

Write the answer by the session's output style, in short prose paragraphs with the verdict first. Open with whether anything must be acted on before this ships. Then give one paragraph per bucket that has findings, in the order Act on, Consider, Noted, Dismissed. Each finding carries its description, the models that raised it, and why it matters, the tradeoff, or the reason to dismiss it. Name the stated intent from Step 2 in one sentence, and say which reviewers ran on which models with their finding counts. End with where the models agreed and diverged and what that pattern says. When the findings are many, a table of findings by bucket, models and rationale may replace the per-bucket paragraphs.
