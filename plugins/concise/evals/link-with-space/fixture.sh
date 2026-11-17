#!/usr/bin/env bash
set -euo pipefail

mkdir -p "Team Notes"

cat > "Team Notes/meeting.md" <<'EOF'
# Weekly meeting

Release moves to Friday. Anna owns the changelog.
EOF
