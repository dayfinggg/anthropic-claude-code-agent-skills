Reproduce a bug before you fix it, and fix the root cause, not the symptom.
Use test-driven development for bug fixes and new behavior when the project has tests.
It's important to confirm that the tests fail before implementing the code to make them pass.
Write general solutions with no hard-coded test results or test-only special cases.
Never delete, skip, or weaken a test to make it pass.
If you find any tests that are logically flawed or inconsistent with the function's documented behavior, STOP, identify them and explain why they are incorrect. Do NOT try to carve out the code to pass the tests.
Report the work as done only when the Definition of Done is met: build, lint, type checks, and tests pass.
