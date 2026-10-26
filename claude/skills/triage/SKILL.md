---
name: triage
description: Investigates problem reports about live websites and services, from user or staff complaints to outages and error alerts. Use when a report says something on a running site, app, or service is broken, slow, or wrong.
---

# Triage

These rules turn a report about a running system into a confirmed cause and, when the user asks for it, a fix where the cause lives, and an answer to the questions the user asks next. The user is the person working with you, and the reporter is the customer, client, or staff member who noticed the problem. The rules work alongside the project's own rules on access, permissions, and deployment, which decide what may be written where.

## Pin down the report

Take the site, environment, URL, account or role, time with its time zone, device, exact symptom, expected result, and the steps the reporter took from the report and its attachments before investigating, and ask only for what cannot be found, because the same symptom on another site, environment, or role usually has a different cause.

<example>
A customer writes that a discount code is rejected at checkout and attaches a screenshot of one order, so the investigation starts from that order on production, with a customer account, at the time the message was sent.
</example>

Observe the problem before changing anything, and find at least one real affected instance such as a URL, record ID, or log line, preferring the reporter's own record or one without personal data, because a fix without a confirmed instance may solve a different problem, and the user forwards that example to the reporter. Prefer observation that writes nothing, since a page view can update counters or caches and cron jobs or debug endpoints can write data.

<example>
Search the error log around the reported time, open the reporter's order `A-1052` read-only, and record it as the example before reading the pricing code.
</example>

When no affected instance can be found, say what was checked and which detail from the reporter would locate one, because a cause guessed without an instance cannot be verified.

<example>
The error log for the reported hour holds no coupon errors and no order with the code, so the answer lists the logs and time range checked and asks which code and order time the customer used.
</example>

## Establish the cause and the scope

Find when the problem started and compare that time with recent commits, deployments, configuration changes, and other people's work on the affected code, so the report can say whether one of our changes caused it, because that is the user's first question and the answer decides whether a revert is the fastest fix.

<example>
Discount codes began failing at 10:40, right after the 10:35 deployment of commit `a1b2c3d`, whose change to `pricing.php` makes the comparison case-sensitive, and reverting it on staging restores the code, so the report names that commit as the cause.
</example>

When the evidence points to the reporter's own action or content, such as input copied with hidden characters or a setting switched off on purpose, say so with the evidence, and still name what the product could do to prevent it, because the user must tell the reporter whether there was a defect at all.

<example>
The code fails because it was pasted from a newsletter with a trailing space, so the report says the input caused it and names trimming codes before validation as a possible prevention.
</example>

When the report says a problem is back after an earlier fix, find that earlier fix and the reason it did not hold before changing anything, because a second patch on top of a failed one usually fails the same way.

<example>
Large uploads fail again after yesterday's limit increase in the app, and the logs show the reverse proxy still rejects them at its own lower limit, so the fix raises the proxy limit instead of the app limit once more.
</example>

List every site or instance that runs the affected code, such as a shared core, module, template, or configuration, and check each one for the same symptom before and after the fix, because a fix verified on one site leaves its siblings broken and the user then has to ask about each of them.

<example>
The pricing module is shared by four storefronts, so all four are checked, and one that overrides the module locally is listed separately.
</example>

Count the records created or changed while the problem was live, because the user's next question is whether any of them need repair.

<example>
Eleven orders placed between 10:40 and 11:15 carry the wrong discount, so the report lists them for repair.
</example>

## Fix and verify

Make the fix only when the user asked for it, and otherwise finish with the confirmed cause, the affected instances, and the proposed change, because a forwarded report describes a problem and the user decides when a finding becomes a change.

<example>
A forwarded complaint about a rejected coupon ends with "The code check has compared case-sensitively since Tuesday's deploy, and case-folding in `pricing.php` would fix all four storefronts." and no edit.
</example>

When the user has asked for the fix, make it where the cause lives, in the shared code when the cause is shared, and start the project's normal route for commits and deployment only when the user asked for that too, because per-site patches for a shared cause drift apart and the problem returns on the next update.

<example>
The user asked for the fix and its rollout, so the coupon check is fixed once in the shared pricing module and rolled out to every storefront by the project's release procedure, not patched in each storefront's copy.
</example>

Verify the reported instance and a sample of the others when there are many, the way the reporter saw it, with the same URL, role, and device class, once the project's caches serve the new version, clearing them only where the project's rules allow it, and check the error log afterwards, because a fix proven in code often still fails on the page because of caching or a second template.

<example>
After the rollout, the reported checkout and one checkout on another storefront are repeated on mobile and desktop with a dedicated test customer where the project allows test orders, and the error log shows no new pricing errors.
</example>

## Report

Open the report with whether the problem is fixed, or with the confirmed cause when no fix was requested, then give the cause in one plain sentence without internal jargon, whether a recent change of ours caused it, which sites were affected and fixed, how many records were hit, one example link, and anything left for the user, because those are the follow-up questions the user otherwise has to ask one by one.

<example>
"Discount codes work again. Tuesday's pricing change compared codes with case sensitivity, which affected all four storefronts and is fixed on all of them, and 11 orders placed meanwhile carry the wrong discount, for example https://shop.example.com/orders/A-1052."
</example>

When the user asks for a note to send to the reporter, write the note in one to three plain sentences that say what was wrong and what changed, free of internal details such as file paths, commit hashes, and tool names, in the language the user asks for or else in the language of the original report, and put it in a code block so it can be copied, because the note goes to non-technical people outside the team. The text around the note stays in the language of the user's messages.

<example>
A note in a code block that says discount codes work again, that a recent update had made the check case-sensitive, and that the customer can now apply the code to a new order.
</example>
