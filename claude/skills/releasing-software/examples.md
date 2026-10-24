# Release examples

Re-resolve the action SHAs before use. Each comment names the release the SHA pointed to when checked.

## Contents

- Fixing a broken release (npm)
- npm publish workflow with trusted publishing

## Fixing a broken release (npm)

Version 1.4.2 of `example-lib` shipped without its build output. The only commit since `v1.4.2` is `fix(build): include dist files in the package`.

Before

```bash
npm unpublish example-lib@1.4.2
npm publish
```

After

```bash
npm version patch --no-git-tag-version
npm publish --dry-run
```

The fix becomes 1.4.3. The tag and the real publish in CI wait until the user asks. So does `npm deprecate example-lib@1.4.2 "Missing build output, use 1.4.3"`.

## npm publish workflow with trusted publishing

Before

```yaml
name: Publish

on:
  push:
    tags: ["v*"]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://registry.npmjs.org
      - run: npm install
      - run: npm test
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

After

```yaml
name: Publish

on:
  push:
    tags: ["v*"]

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with:
          node-version: "24"
          package-manager-cache: false
      - run: npm ci
      - run: npm test
      - run: npm pack
      - uses: actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9 # v7.0.2
        with:
          name: package
          path: "*.tgz"
          if-no-files-found: error

  publish:
    needs: build
    runs-on: ubuntu-latest
    environment: npm
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with:
          node-version: "24"
          registry-url: "https://registry.npmjs.org"
          package-manager-cache: false
      - uses: actions/download-artifact@9000827ccba6bdab643e8b6fd33ac0654aef8333 # v8.0.2
        with:
          name: package
      - run: npm publish ./*.tgz --access public
```

The job must run npm 11.5.1 or later, so check `npm --version` in the job. The user adds the trusted publisher for this workflow file with the `npm` environment and `npm publish` allowed. The user then disallows tokens and deletes the secret.
