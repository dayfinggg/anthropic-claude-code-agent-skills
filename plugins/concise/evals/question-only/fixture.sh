#!/usr/bin/env bash
set -euo pipefail

mkdir -p app

cat > app/dates.py <<'EOF'
from datetime import date


def parse_date(text):
    year, month, day = text.split("-")
    return date(int(year), int(month), int(day))
EOF

cat > app/report.py <<'EOF'
from app.dates import parse_date


def report_title(form):
    return f"Report for {parse_date(form['day']).isoformat()}"
EOF
