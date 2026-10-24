# Diataxis document types

The wording follows diataxis.fr, so check that site when a detail matters.
Tutorials and how-to guides collapse into each other most often.

## Compass

| Content informs | Serves | Type |
|---|---|---|
| Action | Acquisition of skill | Tutorial |
| Action | Application of skill | How-to guide |
| Cognition | Application of skill | Reference |
| Cognition | Acquisition of skill | Explanation |

A README is a landing page. Longer documentation goes into `docs/` or a wiki.

## Tutorial

A lesson that takes a beginner to a complete, working result.

- State the goal at the start.
- Use concrete steps in a fixed order, with a visible result early and often.
- Show the expected output at each stage and warn about likely mistakes.
- End by naming what the learner built.
- Leave out explanation beyond a sentence, options, and alternatives.
- Run the whole tutorial from a clean environment before publishing, because every step must work every time.

Diataxis suggests "we" in tutorials. This skill uses "you" to match the Google style guide.

## How-to guide

Steps toward a goal the reader already has.

- Name the goal exactly in the title, as in "Deploy the app to staging".
- Include forks the reader must judge, such as "If you want x, do y".
- Fit real situations, not one tidy case.
- Link to teaching, explanation, and complete option lists instead of including them.
- Practical usability beats completeness.

## Reference

Neutral, factual description of the machinery. Examples are commands, options, configuration keys, endpoints, classes, limits, and error messages.

- Give every entry of one kind the same layout.
- Mirror the product structure, such as one page per command or module.
- Leave out instructions, explanation, and opinion, because reference is read in fragments.

## Explanation

Why things are the way they are. It covers design decisions, history, constraints, trade-offs, and alternatives.

- Make the title read naturally after an implied "About", as in "About caching".
- Let one "why" question set the edges of the page.
- Move steps to a how-to guide and exhaustive description to reference.
- Architecture decision records belong to the recording-architecture-decisions skill.

## Common files

| File | Type | Notes |
|---|---|---|
| `README.md` | Landing page | Links to pages of every type and holds a short quickstart |
| `CONTRIBUTING.md` | How-to guide | Setting up, running tests, and submitting changes |
| Migration or upgrade guide | How-to guide | One goal, with old and new code side by side |
| `CHANGELOG.md` | Reference | Notable changes per version |
| API reference pages | Reference | One layout per endpoint, class, or command |
| Getting started lesson | Tutorial | One complete path for a beginner |
| Design or concept pages | Explanation | Why the system works the way it does |
| `AGENTS.md`, `CLAUDE.md` | Reference for agents | Short, non-inferable facts only |

When the project groups docs by type, use `docs/tutorials/`, `docs/how-to/`, `docs/reference/`, and `docs/explanation/`.
Keep an existing layout.

## Splitting a mixed page

1. Label each paragraph with the compass.
2. Keep only the content of the type most of the page serves.
3. Move every other block to an existing page of its type, or to a new page when none exists.
4. Replace each moved block with a descriptive link to its new place.
5. Check that every page works alone and that no fact lives in two places.
