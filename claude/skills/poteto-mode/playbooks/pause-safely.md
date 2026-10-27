### Pause safely

**You own a clean stop. Leave a checkpoint a cold-start agent can resume from.** This is explicit only. On "keep going", "going to bed, keep going", or "don't stop", do not pause.

1. Stop at a safe boundary. Finish the current atomic step or back out of it. Start nothing new, and cancel any nested subagents.
2. Take no irreversible action to pause. No PR and no push unless you already had one out.
3. Make the work durable. Uncommitted edits stay on disk in the working tree. When the user's request allows commits, commit them as one clear `wip:` commit on the current branch, and if the tree is broken, say so in the commit body in one line. Otherwise leave them uncommitted and list the dirty files in the resume note.
4. Write the resume note off-context. Capture intent, what you were doing, progress and what's verified, current state, next steps, key files, and gotchas. Write it to a file outside the repo, such as `<scratchpad>/<slug>-resume.md`, and give its full absolute path in the answer. If a show-me-your-work trail exists, point at it instead of duplicating it.

**Reply:** where you are in the loop, what's on disk versus still in your head (paths, no diff dumps), the commits you made and whether the tree is clean, and the first action on resume. This is a pause, not a final report.
