#!/usr/bin/env bash
set -euo pipefail

mkdir -p jobs

cat > client.py <<'EOF'
import json
import os
import urllib.request


def fetch_page(url, timeout=10):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            return response.read().decode("utf-8")
    except:
        return None


def fetch_json(url, timeout=10):
    return json.loads(fetch_page(url, timeout=timeout))
EOF

cat > jobs/sync.py <<'EOF'
from client import fetch_page


def sync(urls):
    return [fetch_page(url, timeout=30) for url in urls]
EOF

cat > jobs/health.py <<'EOF'
from client import fetch_page

HEALTH_URL = "https://status.example.com/health"


def is_healthy():
    return fetch_page(HEALTH_URL, timeout=3) is not None
EOF
