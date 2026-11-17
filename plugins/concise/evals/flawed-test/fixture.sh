#!/usr/bin/env bash
set -euo pipefail

mkdir -p tests docs

cat > shipping.py <<'EOF'
import math


def shipping_cost(weight_kg):
    """Return the cost in cents: 500 up to 1 kg, then 200 for each started kilogram above it."""
    if weight_kg <= 1:
        return 500
    return 500 + 200 * math.ceil(weight_kg - 1)
EOF

cat > tests/test_shipping.py <<'EOF'
from shipping import shipping_cost


def test_first_kilogram_is_flat():
    assert shipping_cost(1) == 500


def test_started_kilogram_is_charged_in_full():
    assert shipping_cost(2.5) == 700
EOF

cat > docs/pricing.md <<'EOF'
# Shipping prices

The first kilogram costs 5.00. Each started kilogram above it costs 2.00.

A parcel of 2.5 kg costs 9.00, because two kilograms are started above the first one.
EOF
