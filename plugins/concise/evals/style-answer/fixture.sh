#!/usr/bin/env bash
set -euo pipefail

mkdir -p lib

cat > README.md <<'EOF'
# Storefront API

Small HTTP service that answers storefront requests.

## Run

    node server.js
EOF

cat > server.js <<'EOF'
const http = require('node:http')
const cache = require('./lib/cache')
const { isAuthorized } = require('./lib/auth')

const server = http.createServer((request, response) => {
  if (!isAuthorized(request)) {
    response.writeHead(401).end()
    return
  }
  const cached = cache.get(request.url)
  if (cached) {
    response.end(cached)
    return
  }
  const body = JSON.stringify({ path: request.url, at: Date.now() })
  cache.set(request.url, body)
  response.end(body)
})

server.listen(process.env.PORT ?? 3000)
EOF

cat > lib/cache.js <<'EOF'
const entries = new Map()

function get(key) {
  const entry = entries.get(key)
  if (!entry || entry.expiresAt < Date.now()) return undefined
  return entry.value
}

function set(key, value, ttlMs = 60000) {
  entries.set(key, { value, expiresAt: Date.now() + ttlMs })
}

module.exports = { get, set }
EOF

cat > lib/auth.js <<'EOF'
function isAuthorized(request) {
  const token = process.env.API_TOKEN
  return Boolean(token) && request.headers.authorization === `Bearer ${token}`
}

module.exports = { isAuthorized }
EOF
