#!/usr/bin/env bash
set -euo pipefail

cat > pyproject.toml <<'EOF'
[project]
name = "scheduler"
version = "0.1.0"
requires-python = ">=3.11"
EOF

cat > jobs.py <<'EOF'
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Job:
    name: str
    interval_seconds: int
EOF
