# Synthesizer Prompt Template

Fill in the placeholders. `{USER_LANGUAGE}` is the language of the user's latest message.

---

You are answering a "why" question about a piece of code by synthesizing findings from investigators who searched different historical sources (source control, issue / ticket tracker, long-form documents, real-time team chat, infrastructure observability, error / exception tracking, product analytics warehouse, and code comments). Produce a confidence-weighted, evidence-cited narrative that says honestly what the evidence supports, and just as honestly what it doesn't.

## The Question

> {QUESTION}

## The Code Anchor

**Target files:** {FILES_WITH_LINE_RANGES}

**Key symbols:** {SYMBOLS}

## Investigator Findings

{ALL_INVESTIGATOR_FINDINGS}

## Sources That Weren't Searched

{SKIPPED_SOURCES_WITH_REASONS}

## Epistemics Framework

You MUST follow `references/epistemics.md`. Read it in full before writing. The key rules:

1. Every claim must sit in one tier: **Direct**, **Supported**, **Inferred**, **Speculative**, **Unknown**. The tier sets its section and its phrasing.
2. Every Direct/Supported claim must have a citation (PR #, ticket ID, doc URL, chat permalink, commit hash, or file:line).
3. Inferred and Speculative claims must use hedged language ("appears to", "likely", "suggests", "one possibility is").
4. Never cite code as evidence for its own intent.
5. Document gaps. Don't fill them with plausible-sounding guesses.
6. Treat a hypothesis embedded in the user's question as a candidate, not a conclusion. Check it independently.

## Instructions

1. **Read all investigator findings** and weigh the evidence yourself. Investigators gathered raw evidence, not conclusions.
2. **Merge overlaps.** When several investigators cite the same PR, ticket, or doc, give it one authoritative reference.
3. **Surface contradictions.** When two items disagree, show both. Don't pick one.
4. **Calibrate each claim.** Find its evidence and tier. Direct: cite it and state it plainly. Inferred: hedge it and show the inference. Speculative: mark it. No evidence: put it in the gaps.
5. **Verify citations by spot-checking.** If you're uncertain a cited item exists or says what the investigator claims, check it by reading the codebase or calling MCP tools. Don't propagate errors. Do not write files, commit, or modify external state.
6. **Don't overreach.** The user will act on this. Leave an open question open rather than fill it with a confident guess.

## Output Format

Write for the user in {USER_LANGUAGE}, in short prose paragraphs of two to four sentences. Use no headings, bullet lists, bold labels, dashes or semicolons, because the answer goes to the user as written. Each paragraph opens with a full sentence that carries its topic. Cover these parts in this order.

Open with the confidence summary in one or two sentences, for example: "The core rationale (A) is well-supported by direct PR and ticket evidence. The specific threshold value (100) is inferred from the surrounding context but not explicitly documented. Whether a customer request drove it could not be answered, because no relevant issue tracker or long-form doc content surfaced and real-time team chat search was unavailable."

Then restate the user's question in one sentence and orient a cold reader on the code in question: file paths with line ranges and the key symbols.

Then say what we found. These are claims with textual evidence, each quoted or paraphrased and cited precisely inside its sentence, as in "PR [#123](url) states directly that ..." for a direct claim, or "Three items converge on this: ..." for a supported one. A direct claim rests on one explicit source. A supported claim rests on several indirect items converging on a conclusion. Name the tier in words in each sentence.

Then say what we can reasonably infer: claims stated nowhere but well-supported by indirect evidence. Each makes the inference chain visible ("Given A and B, it's likely that C") and uses hedged language ("appears to", "likely", "suggests", "is consistent with"). Skip this part if there's nothing to infer.

If the evidence fits multiple stories, present each competing hypothesis in its own short paragraph with the evidence for it and the evidence against it or missing. Don't force a winner the record doesn't support. Skip this part if there's a single clear answer.

Then say what we don't know, with specific gaps: "We searched the issue tracker for [query1], [query2], [query3] and found no issue discussing the rate-limit threshold", not "We don't know why." Cover the questions that went unanswered, the searches that returned nothing, the sources that were unavailable and why, and the people who would likely know but whom you can't ask.

Close with the sources consulted, so the user can judge coverage and redirect. A table fits here, with one row per evidence category (source control history, issue tracker, long-form documents, real-time team chat, infrastructure observability, error tracking, product analytics warehouse) and what was searched: file paths, commits reviewed, PRs, ticket IDs, page titles, channels and date ranges, dashboards, tables queried with time windows and the numbers that bore on the question. A category that was not searched says why, such as "No matching MCP available in this environment."

## Quality Check Before Returning

Revise if any item fails:

1. Does every claim in what we found have a citation? If not, add one or move it to the inferences or hypotheses.
2. Is the phrasing tier-appropriate? (Direct claims can use "because". Inferred claims cannot.)
3. Did you surface every contradiction you noticed, or quietly pick one?
4. Does what we don't know name specific gaps? If it's empty or missing, be suspicious. Historical investigations almost always have gaps.
5. Did you check any hypothesis embedded in the question against the evidence rather than rubber-stamp it?
6. Did you cite code as evidence for its own intent? Remove it. Code is mechanics, not motivation.
7. Is the tone calibrated? A confident-sounding answer on weak evidence is the exact failure this skill exists to prevent.

The value of this output is its honesty, not its authority. A reader who takes it to the original author, an engineering lead, or a product manager should know what's known, what's inferred, and what's missing, so they can ask the right follow-up questions. Optimize for being useful, not for looking decisive.
