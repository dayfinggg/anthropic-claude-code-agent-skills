# Local refactoring

## Choose a useful structural step

When the current structure makes the requested change hard, name the specific obstruction and make the one structural step that removes it, because refactoring without a target spreads risk across code the task does not need. Leave working areas alone when changing them brings no current benefit.

<example>
A price change is blocked by discount logic copied into three handlers, so the step is extracting that logic, not renaming the module.
</example>

When structure and behavior both change, keep their effects distinguishable by establishing the current behavior first and checking the structural step against it before changing behavior, because mixing them makes a regression impossible to attribute. Separate commits are not required for this.

<example>
Run the existing tests after extracting `calculate_discount()`, and change the discount rate only after they pass.
</example>

## Preserve the effects callers can observe

For an extraction, check captured and modified locals, argument evaluation, receiver binding, and where the code originally ran, because an extraction that evaluates something twice or at a different moment changes behavior.

<example>
Moving `next(iterator)` into a helper that is then called twice consumes two items instead of one.
</example>

For a move or an inline, check short-circuiting, exception handling, cleanup, mutation order, and await points, because a different order of visible effects is a behavior change even when the final value matches.

<example>
Inlining `log_and_save()` after `send_email()` sends the mail before the record exists, which breaks a retry that looks for the record.
</example>

For a rename, find uses outside direct references, such as serialized keys, reflection, dynamic lookups, registered callbacks, and public imports, because a wire-format rename breaks consumers the compiler cannot see.

<example>
Renaming the `userId` property would also rename the JSON field the mobile app reads, so the serialized name stays or the consumer is migrated too.
</example>

Before changing a shared abstraction, inspect every caller and every place its output is shown, and when it mixes unrelated behaviors, inline only what each caller uses before designing a replacement, because a change that suits one caller can silently break another.

<example>
Before simplifying `render_card(product, mode)`, check the home page, the search page, the category list, and the RSS export that call it.
</example>

## Interpret verification failures correctly

When a pure structural change breaks a test, decide whether behavior changed or the test depends on internals, and update an expectation only when it is wrong or tests details outside the contract, because rewriting expectations to match new code hides regressions.

<example>
A test asserting that a private helper ran twice is rewritten to assert the returned total, while a test whose total changed reports a real regression.
</example>

When a structural step fails its check, shrink the step and find the changed effect instead of adding compatibility layers or unrelated rewrites, because each extra change makes the failure harder to locate.

<example>
If extracting three functions breaks the export, go back to one extraction and run the export test again.
</example>
