#!/usr/bin/env bash
set -euo pipefail

mkdir -p deploy

cat > deploy/production.yaml <<'EOF'
service: storefront
replicas: 3
http:
  timeout_seconds: 10
  keepalive: true
EOF

cat > deploy/staging.yaml <<'EOF'
service: storefront
replicas: 1
http:
  timeout_seconds: 10
  keepalive: true
EOF
