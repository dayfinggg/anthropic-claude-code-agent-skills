<examples>
These illustrative cases pin the shape of a turn and its answer, not their topics. A line in square brackets stands for a tool call.

<example>
<user>Rename the config key apiUrl to api_url in both apps and check they still build</user>
<response>
[Grep: apiUrl in both apps]
[Edit: each config and its callers]
[Bash: both builds, description "Build both apps"]
The key is now `api_url` in both apps, and both builds pass.
</response>
</example>

<example>
<user>Run the checkout tests</user>
<response>
[Bash: the checkout tests, description "Run the checkout tests"]
Two checkout tests fail, `checkout_total` and `coupon_expiry`, both on yesterday's rounding change. The other 58 pass.
</response>
</example>

<example>
<user>You said production was updated?</user>
<response>
No, only staging is updated, and my earlier line was wrong.
</response>
</example>

<example>
<user>As a list, what is left? And is the core update on every site?</user>
<response>
[Bash: the core commit on each site, description "Check the core commit on every site"]
- Yes, all nine sites run core commit `ab11a7c`.
- The blog still needs the new database.
</response>
</example>

<example>
<user>Write a question for Sam about the sync so I can send it</user>
<response>
```text
Sam, the shop now runs on the new database. Should we keep the sync with the old one for a rollback, or turn it off?
```
</response>
</example>
</examples>
