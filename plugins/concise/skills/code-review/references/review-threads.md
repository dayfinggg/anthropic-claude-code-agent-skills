## Read every thread with its state

`gh api` fills `{owner}` and `{repo}` from the current repository. In PowerShell, quote any argument that contains braces.

```bash
gh api graphql --paginate -F owner='{owner}' -F repo='{repo}' -F pr=123 -f query='
query($owner:String!,$repo:String!,$pr:Int!,$endCursor:String){
  repository(owner:$owner,name:$repo){ pullRequest(number:$pr){
    reviewThreads(first:100, after:$endCursor){
      pageInfo{ hasNextPage endCursor }
      nodes{ id isResolved isOutdated path line
        comments(first:50){ nodes{ fullDatabaseId author{login} body url } } } } } } }'
```

- `isOutdated` threads point at code that later commits changed. They still need an answer.
- `databaseId` is deprecated. Use `fullDatabaseId` when a REST call needs the numeric comment ID.

## Reply in a thread

Reply by thread node ID (`PRRT_...`), which avoids the REST rule that a reply must target the thread's first comment:

```bash
gh api graphql -f query='mutation($id:ID!,$body:String!){
  addPullRequestReviewThreadReply(input:{pullRequestReviewThreadId:$id, body:$body}){ comment{ url } } }' \
  -f id='PRRT_xxx' -f body='Fixed in 1a2b3c4: the query is now scoped to the tenant.'
```

- The REST form is `POST /repos/{owner}/{repo}/pulls/<n>/comments/<comment_id>/replies` with a `body` field. `comment_id` must be the top-level comment of the thread, because replies to replies are rejected.
- Pass text with `-f`. `-F` reads a file when the value starts with `@` (so a body like `@alice ...` breaks) and turns `true`, `false`, `null` and numbers into JSON types.
- A reply does not resolve the thread.

## Resolve a thread

```bash
gh api graphql -f query='mutation($id:ID!){ resolveReviewThread(input:{threadId:$id}){ thread{ isResolved } } }' -f id='PRRT_xxx'
```

- Resolve a thread only with a reply that says what was done or why nothing was done.

## Post one review with inline comments

Write `review.json` and send it in one call:

```json
{
  "commit_id": "<head sha you reviewed>",
  "event": "COMMENT",
  "body": "2 Important, 1 Nit. Details inline.",
  "comments": [
    { "path": "src/orders.ts", "line": 42, "side": "RIGHT", "body": "Important: ..." },
    { "path": "src/orders.ts", "start_line": 50, "line": 54, "start_side": "RIGHT", "side": "RIGHT", "body": "Nit: ..." }
  ]
}
```

```bash
gh api repos/{owner}/{repo}/pulls/123/reviews --input review.json
```

- `side` is `RIGHT` for added and context lines and `LEFT` for deleted lines. `line` is the line number in the new file for `RIGHT` and in the old file for `LEFT`, and it must be a line shown in the diff hunks. Put remarks about other lines in the review body.
- `position` (the offset from the hunk header) is closing down. Use `line` and `side`.
- `event` is `COMMENT`, `REQUEST_CHANGES` or `APPROVE`. Leaving it out creates a PENDING review that nobody else can see until it is submitted.
- A stale `commit_id` marks the comments outdated as soon as a later commit touches those lines.
- `gh pr review` cannot post inline comments. It only sets a review body and state.
