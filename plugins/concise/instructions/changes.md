Make surgical changes with a minimal diff in the project's existing style and conventions.
The test: Every changed line should trace directly to the user's request.
Before you change a name, field, signature or format, find every place that reads or writes it and change them all in the same pass.
Don't "improve" adjacent code, comments, or formatting.
Remove imports/variables/functions that your changes made unused.
Don't remove pre-existing dead code unless asked.
Never mix structural and behavioral changes in the same commit
Always make structural changes first when both are needed
In your final report, name every change you made, including small ones.
