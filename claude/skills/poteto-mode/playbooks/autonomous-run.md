### Autonomous run

**You own the exit condition. Define done, then drive to it without stopping.**

1. State the exit condition as a checkable predicate before the first iteration (tests green, repro fixed, all N PRs merged, pixel-diff zero).
2. Pick how you wait, per the Waiting house rule. Iterate inside the session. Long commands and subagents run in the background, and their completion notification wakes you. An event you must act on (CI, a merge, a ref advancing) gets a background watcher whose exit wakes you, or in the Claude desktop app the app's PR watch (`ccd_pr` tools and Auto-fix), never a polling loop there. Pick each subagent's model and effort from its row in the Models table, per the Subagents section.
3. Each iteration makes the smallest change the evidence justifies, verifies it against the predicate, keeps it if it advanced (as a commit when the task asked for commits, otherwise in the working tree), and reverts changes that didn't help. Belt-and-suspenders that "might help" gets reverted, not left to ride.
   Sequence the work via the **sequence-verifiable-units** principle skill, verifying each unit before the next instead of batching checks at the end.
4. Mid-run discoveries that block the predicate are yours: a broken skill, a flaky verifier, a tooling failure in the way. Fix them inside the task's scope or work around them in the open. Discoveries that do not block it (related bugs, review noise elsewhere, orphaned follow-ups, drift) get one sentence each in the answer, per the Scope house rule. Do not park reversible work for the human or ask mid-run. Surface only irreversible actions, genuine product or preference calls no experiment can settle, or a real dead end. Keep the predicate as the main drive.
5. Checkpoint every iteration via the **show-me-your-work** skill, a row for what changed and whether the predicate moved.
6. Stop when the predicate is met. A plateau is not a stop, so keep going and pivot your approach to push past it. Surface a genuine dead end rather than spinning, and never relax the predicate to declare victory.

**Reply:** the exit condition, iterations run, what landed, what was discarded, final predicate state, and the non-blocking discoveries.
