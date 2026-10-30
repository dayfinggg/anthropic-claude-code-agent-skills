#!/bin/sh

claude_managed_directories='skills agents output-styles mods'

claude_backup_path() {
  cb_dest="$1"
  cb_backup="$2"
  cb_rel="$3"
  [ -e "$cb_dest/$cb_rel" ] || [ -L "$cb_dest/$cb_rel" ] || return 0
  mkdir -p "$cb_backup/$(dirname "$cb_rel")"
  cp -Rp "$cb_dest/$cb_rel" "$cb_backup/$cb_rel"
}

claude_sha256_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  else
    openssl dgst -sha256 "$1" | awk '{print $NF}'
  fi
}

claude_platform() {
  case "$(uname -s)" in
    CYGWIN*|MINGW*|MSYS*) printf 'windows\n' ;;
    *) printf 'posix\n' ;;
  esac
}

claude_native_path() {
  if [ "$1" = windows ] && [ -n "$2" ]; then
    cygpath -w "$2"
  else
    printf '%s\n' "$2"
  fi
}

claude_file_count() {
  if [ -d "$1" ] && [ ! -L "$1" ]; then
    find "$1" -type f | wc -l | tr -d ' '
  else
    printf '1\n'
  fi
}

claude_entry_replaced() {
  cer_source="$1"
  cer_directory="$2"
  cer_name="$3"
  cer_mode="$4"
  if [ "$cer_mode" = merge ]; then
    [ -e "$cer_source/$cer_directory/$cer_name" ] || [ -L "$cer_source/$cer_directory/$cer_name" ]
    return
  fi
  case "$cer_directory/$cer_name" in
    skills/synced|skills/.trash) return 1 ;;
  esac
  return 0
}

claude_merge_settings() {
  python3 - "$@" <<'PY'
import json
import sys

PLUGIN_DIRECTORIES = "CLAUDE_CODE_PLUGIN_DIRS"


def fail(message):
    sys.stderr.write(message + "\n")
    sys.exit(1)


def read_settings(path, label):
    try:
        with open(path, encoding="utf-8-sig") as settings_file:
            settings = json.load(settings_file)
    except ValueError:
        fail(label + " is not valid JSON.")
    if not isinstance(settings, dict):
        fail(label + " must contain a JSON object.")
    return settings


def add_missing(settings, portable):
    added = 0
    for key, value in portable.items():
        if key not in settings:
            settings[key] = value
            added += 1
        elif isinstance(settings[key], dict) and isinstance(value, dict):
            added += add_missing(settings[key], value)
    return added


def location_key(path, home, windows):
    if path == "~" or path.startswith(("~/", "~\\")):
        path = home + path[1:]
    if windows:
        path = path.replace("\\", "/").lower()
    return path.rstrip("/")


def join_plugin_directories(current, bundled, mode, home, windows):
    separator = ";" if windows else ":"
    existing = []
    if mode == "merge" and isinstance(current, str):
        existing = [entry for entry in current.split(separator) if entry]
    listed = {location_key(entry, home, windows) for entry in existing}
    added = [entry for entry in bundled if location_key(entry, home, windows) not in listed]
    return separator.join(existing + added)


def main(portable_path, settings_path, output_path, mode, platform, home, *bundled):
    windows = platform == "windows"
    portable = read_settings(portable_path, "Payload claude/settings.json")
    settings = read_settings(settings_path, "Existing settings.json") if settings_path else {}
    changed = add_missing(settings, portable)
    if "skillOverrides" not in portable and "skillOverrides" in settings:
        del settings["skillOverrides"]
        changed += 1
    if "outputStyle" in portable and settings["outputStyle"] != portable["outputStyle"]:
        settings["outputStyle"] = portable["outputStyle"]
        changed += 1
    environment = settings.setdefault("env", {})
    if not isinstance(environment, dict):
        fail("Existing settings.json must contain a JSON object in env.")
    value = join_plugin_directories(environment.get(PLUGIN_DIRECTORIES), bundled, mode, home, windows)
    if environment.get(PLUGIN_DIRECTORIES) != value:
        environment[PLUGIN_DIRECTORIES] = value
        changed += 1
    with open(output_path, "w", encoding="utf-8", newline="\n") as output_file:
        output_file.write(json.dumps(settings, indent=2, ensure_ascii=False) + "\n")
    sys.stdout.write(str(changed))


main(*sys.argv[1:])
PY
}

claude_list_payload_files() {
  for clpf_directory in $claude_managed_directories; do
    find "$1/$clpf_directory" -type f
  done
}

claude_write_manifest() {
  cwm_source="$1"
  cwm_destination="$2"
  cwm_work="$3"
  cwm_files="$cwm_work/manifest-files"
  cwm_manifest="$cwm_destination/.anthropic-claude-code-agent-skills.manifest"

  claude_list_payload_files "$cwm_source" | LC_ALL=C sort >"$cwm_files"

  : >"$cwm_manifest"
  while IFS= read -r cwm_file; do
    cwm_relative="${cwm_file#"$cwm_source"/}"
    cwm_hash="$(claude_sha256_file "$cwm_file")"
    printf '%s\t%s\n' "$cwm_hash" "$cwm_relative" >>"$cwm_manifest"
  done <"$cwm_files"
}

claude_sync_payload() {
  csp_source="$1"
  csp_destination="$2"
  csp_backup="$3"
  csp_mode="$4"
  csp_work="$5"

  for csp_required in settings.json $claude_managed_directories; do
    [ -e "$csp_source/$csp_required" ] || {
      printf 'Payload is missing claude/%s.\n' "$csp_required" >&2
      return 1
    }
  done

  csp_source="$(CDPATH= cd -- "$csp_source" && pwd -P)"
  mkdir -p "$csp_destination"
  csp_destination="$(CDPATH= cd -- "$csp_destination" && pwd -P)"
  [ "$csp_source" != "$csp_destination" ] || {
    printf 'Source and destination must be different directories.\n' >&2
    return 1
  }
  for csp_directory in $claude_managed_directories; do
    [ ! -L "$csp_destination/$csp_directory" ] || {
      printf 'Managed directory must not be a symbolic link: %s\n' "$csp_destination/$csp_directory" >&2
      return 1
    }
    case "$csp_source" in
      "$csp_destination/$csp_directory"|"$csp_destination/$csp_directory/"*)
        printf 'Source must not be inside a managed destination directory.\n' >&2
        return 1 ;;
    esac
  done

  csp_platform="$(claude_platform)"
  set --
  for csp_mod in "$csp_source/mods/"*/; do
    [ -d "$csp_mod" ] || continue
    if [ "$csp_destination" = "$HOME/.claude" ]; then
      set -- "$@" "~/.claude/mods/$(basename "$csp_mod")"
    else
      set -- "$@" "$(claude_native_path "$csp_platform" "$csp_destination/mods/$(basename "$csp_mod")")"
    fi
  done
  cp "$csp_source/settings.json" "$csp_work/portable-settings.json"
  csp_settings=
  if [ -e "$csp_destination/settings.json" ]; then
    cp "$csp_destination/settings.json" "$csp_work/existing-settings.json"
    csp_settings=existing-settings.json
  fi
  csp_home="$(claude_native_path "$csp_platform" "${HOME:-}")"
  CLAUDE_SETTINGS_CHANGED="$(
    cd "$csp_work" &&
      claude_merge_settings portable-settings.json "$csp_settings" merged-settings.json \
        "$csp_mode" "$csp_platform" "$csp_home" "$@"
  )" || return 1

  for csp_relative in $claude_managed_directories settings.json; do
    claude_backup_path "$csp_destination" "$csp_backup" "$csp_relative"
  done

  CLAUDE_SYNC_REMOVED=0
  if [ "$csp_mode" = replace ] && [ -e "$csp_destination/CLAUDE.md" ]; then
    claude_backup_path "$csp_destination" "$csp_backup" CLAUDE.md
    rm -f -- "$csp_destination/CLAUDE.md"
    CLAUDE_SYNC_REMOVED=$((CLAUDE_SYNC_REMOVED + 1))
  fi
  for csp_directory in $claude_managed_directories; do
    for csp_entry in "$csp_destination/$csp_directory/"* "$csp_destination/$csp_directory/".[!.]* "$csp_destination/$csp_directory/"..?*; do
      [ -e "$csp_entry" ] || [ -L "$csp_entry" ] || continue
      claude_entry_replaced "$csp_source" "$csp_directory" "$(basename "$csp_entry")" "$csp_mode" || continue
      CLAUDE_SYNC_REMOVED=$((CLAUDE_SYNC_REMOVED + $(claude_file_count "$csp_entry")))
      rm -rf -- "$csp_entry"
    done
    mkdir -p "$csp_destination/$csp_directory"
    cp -Rp "$csp_source/$csp_directory/." "$csp_destination/$csp_directory/"
  done

  cp "$csp_work/merged-settings.json" "$csp_destination/settings.json"
  CLAUDE_SYNC_UPDATED="$(claude_list_payload_files "$csp_source" | wc -l | tr -d ' ')"
  claude_write_manifest "$csp_source" "$csp_destination" "$csp_work"
}
