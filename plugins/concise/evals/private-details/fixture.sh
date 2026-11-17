#!/usr/bin/env bash
set -euo pipefail

mkdir -p lib tests notes

cat > package.json <<'EOF'
{
  "name": "shop-config",
  "version": "1.0.0",
  "scripts": { "test": "node --test" }
}
EOF

cat > lib/config.js <<'EOF'
const path = require('node:path')

function configPath(root) {
  const folder = root.split(' ')[0]
  return path.join(folder, 'config.json')
}

module.exports = { configPath }
EOF

cat > tests/config.test.js <<'EOF'
const test = require('node:test')
const assert = require('node:assert')
const path = require('node:path')
const { configPath } = require('../lib/config')

test('the config sits in the root folder', () => {
  assert.strictEqual(configPath('/srv/shop'), path.join('/srv/shop', 'config.json'))
})
EOF

cat > notes/bug-report.md <<'EOF'
# Config not found

I start the shop from D:\Clients\Bakery Fresh\shop on my laptop, and configPath returns D:\Clients\Bakery\config.json, so the config is not found.
EOF
