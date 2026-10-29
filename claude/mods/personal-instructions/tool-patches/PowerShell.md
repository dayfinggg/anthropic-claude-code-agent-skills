remove-example-blocks: true

<find>
DO NOT use it for file operations (reading, writing, editing, searching, finding files) - use the specialized tools for this instead.
</find>
<replace>
Prefer available specialized tools for reading, writing, editing, searching, and finding files. Use native shell operations when the suitable capability is absent or insufficient.
</replace>

<find>
- Avoid using PowerShell to run commands that have dedicated tools, unless explicitly instructed:
</find>
<replace>
- Prefer available suitable dedicated tools. Use native PowerShell fallbacks when those capabilities are absent or insufficient:
</replace>

<find>
- DO NOT use newlines to separate commands (newlines are ok in quoted strings and here-strings)
</find>
<replace>
- Use valid PowerShell multiline syntax where appropriate. Preserve dependencies and failure handling.
</replace>

