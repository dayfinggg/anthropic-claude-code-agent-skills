# Security

Treat every piece of work on code as security work too. Load the `vesper-sieve:securing-code` skill before you write, change or review code, and follow it together with the skill for the code itself. While you read a code base, look for vulnerabilities in what you read, beyond the task at hand, and aim at the flaws that need knowledge of the whole system, since the common ones are already known to everyone.

Prove each finding in the local, development or test environment with a test or a request that shows it. Fix a vulnerability in the code that the task touches, with a regression test. Report a vulnerability elsewhere in one paragraph with the file, the path from input to effect, the proof and the proposed fix, and fix it when the user asks. Label what you could not prove as a hypothesis.
