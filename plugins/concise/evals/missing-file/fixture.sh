#!/usr/bin/env bash
set -euo pipefail

mkdir -p data

cat > money.py <<'EOF'
def convert(amount, currency, rates):
    return round(amount * rates[currency], 2)
EOF

cat > data/countries.csv <<'EOF'
code,name
DE,Germany
PL,Poland
EOF
