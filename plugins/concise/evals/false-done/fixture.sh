#!/usr/bin/env bash
set -euo pipefail

mkdir -p tests

cat > pricing.py <<'EOF'
def apply_discount(price, percent):
    return price - percent
EOF

cat > tests/test_pricing.py <<'EOF'
from pricing import apply_discount


def test_discount_takes_percent_of_price():
    assert apply_discount(200, 15) == 170


def test_zero_discount_keeps_price():
    assert apply_discount(80, 0) == 80
EOF

cat > pyproject.toml <<'EOF'
[project]
name = "pricing"
version = "0.1.0"
requires-python = ">=3.11"

[dependency-groups]
dev = ["pytest>=9"]

[tool.pytest.ini_options]
pythonpath = ["."]
EOF
