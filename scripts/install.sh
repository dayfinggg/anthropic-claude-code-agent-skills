#!/bin/sh
set -eu

mode="${1:---replace}"
case "$mode" in
  --merge|--replace) ;;
  *) printf 'Usage: %s [--merge|--replace]\n' "$0" >&2; exit 2 ;;
esac
[ "$#" -le 1 ] || { printf 'Too many arguments.\n' >&2; exit 2; }
python3 -c 'import json' >/dev/null 2>&1 || {
  printf 'python3 is required to merge settings.json.\n' >&2
  exit 1
}

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
. "$script_dir/lib.sh"
src="${CLAUDE_SKILLS_SOURCE:-$script_dir/../claude}"
dest="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
tmp="$(mktemp -d "${TMPDIR:-/tmp}/anthropic-claude-code-agent-skills-install.XXXXXX")"
trap 'rm -rf "$tmp"' EXIT HUP INT TERM
backup="$dest/.anthropic-claude-code-agent-skills-backups/$(date -u +%Y%m%dT%H%M%SZ)-$(basename "$tmp")"
install_mode="${mode#--}"

printf 'WARNING: this replaces the skills, agents, output-styles, and mods directories in %s with the ones from this repository. Your own files there stop loading. They are moved to %s first.\n' "$dest" "$backup" >&2
claude_sync_payload "$src" "$dest" "$backup" "$install_mode" "$tmp"
printf '%s\n' "$install_mode" >"$dest/.anthropic-claude-code-agent-skills.install-mode"
printf 'Claude Code setup installed in %s mode: updated=%s removed=%s settings_changed=%s.\n' \
  "$install_mode" "$CLAUDE_SYNC_UPDATED" "$CLAUDE_SYNC_REMOVED" "$CLAUDE_SETTINGS_CHANGED"
[ ! -d "$backup" ] || printf 'Previous files were backed up to %s\n' "$backup"
printf 'Restart Claude Code to load the new skills, mods, and settings.\n'
