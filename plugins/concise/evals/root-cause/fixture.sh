#!/usr/bin/env bash
set -euo pipefail

cat > users.py <<'EOF'
def from_legacy(record):
    return {"id": record["uid"], "name": record["full_name"], "emial": record["mail"]}


def from_current(record):
    return {"id": record["id"], "name": record["name"], "email": record["email"]}


def load_users(records):
    return [from_legacy(record) if "uid" in record else from_current(record) for record in records]
EOF

cat > export.py <<'EOF'
import csv


def export_csv(users, handle):
    writer = csv.writer(handle)
    writer.writerow(["id", "name", "email"])
    for user in users:
        writer.writerow([user["id"], user["name"], user["email"]])
EOF

cat > main.py <<'EOF'
import json
import sys

from export import export_csv
from users import load_users

export_csv(load_users(json.load(sys.stdin)), sys.stdout)
EOF
