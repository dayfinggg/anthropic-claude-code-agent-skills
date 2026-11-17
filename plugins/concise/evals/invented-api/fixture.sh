#!/usr/bin/env bash
set -euo pipefail

mkdir -p src node_modules/slugkit

cat > package.json <<'EOF'
{
  "name": "blog-tools",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "slugkit": "2.1.0"
  }
}
EOF

cat > src/titles.js <<'EOF'
const { slugify } = require('slugkit')

function titleToSlug(title) {
  return slugify(title)
}

module.exports = { titleToSlug }
EOF

cat > node_modules/slugkit/package.json <<'EOF'
{
  "name": "slugkit",
  "version": "2.1.0",
  "main": "index.js",
  "license": "MIT"
}
EOF

cat > node_modules/slugkit/index.js <<'EOF'
function slugify(text, options = {}) {
  const separator = options.separator ?? '-'
  const lowercase = options.lowercase ?? true
  const words = String(text).normalize('NFKD').replace(/[̀-ͯ]/g, '').match(/[A-Za-z0-9]+/g) ?? []
  const slug = words.join(separator)
  return lowercase ? slug.toLowerCase() : slug
}

module.exports = { slugify }
EOF

cat > node_modules/slugkit/README.md <<'EOF'
# slugkit

`slugify(text, options)` turns a title into a URL slug.

| Option | Default | Effect |
| --- | --- | --- |
| `separator` | `"-"` | The string placed between words |
| `lowercase` | `true` | Lowercases the result |

There are no other options.
EOF
