# MADR template

This template follows the MADR 4.0.0 full template with shorter placeholders. Lists use `*`. Links to other records are relative, as in `[ADR-0008](0008-add-status-field.md)`.

Remove every section that stays empty. A minimal record needs only the title, context, considered options, and decision outcome. The `status` list is open in MADR, so follow the repository's values.

## Filling the template

- The heading holds only the title, naming problem and solution.
- Start with context that ends in the question decided.
- Then give considered options and the decision outcome.
- A record stands alone without linked material.
- Add drivers when forces compete.
- Add consequences almost always.
- Add confirmation when a test, architecture rule, or review can check compliance.
- Name drivers with ISO/IEC 25010:2023 characteristics such as reliability, security, maintainability, or performance efficiency.
- Make drivers measurable.
- Consequences include costs such as new operational work.
- Record the important trade-offs and the confidence level of the decision.

## Template

```markdown
---
status: "proposed"
date: YYYY-MM-DD
decision-makers: {everyone involved in the decision}
consulted: {experts with two-way communication}
informed: {people kept up to date with one-way communication}
---

# {short title naming the problem and the solution}

## Context and Problem Statement

{Two to three sentences that end in the question this record decides. Link boards or issues.}

## Decision Drivers

* {force or concern, stated so it can be measured}

## Considered Options

* {option 1}
* {option 2}

## Decision Outcome

Chosen option: "{option 1}", because {justification}.

### Consequences

* Good, because {improved quality}
* Bad, because {compromised quality or new cost}

### Confirmation

{How a test, architecture rule, or review checks compliance.}

## Pros and Cons of the Options

### {option 1}

* Good, because {argument}
* Neutral, because {argument}
* Bad, because {argument}

## More Information

{Links to related records, confidence level, and when to revisit the decision.}
```
