#!/usr/bin/env bash
set -euo pipefail

mkdir -p migrations

cat > migrations/0041_add_orders_status_index.sql <<'EOF'
CREATE INDEX CONCURRENTLY IF NOT EXISTS orders_status_idx ON orders (status);
EOF

cat > README.md <<'EOF'
# Shop database

Migrations are plain SQL files in `migrations/`, applied in name order with `psql -f`.
EOF
