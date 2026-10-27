import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
WINDOWS_POWERSHELL = shutil.which("powershell")
POWERSHELL = shutil.which("pwsh")
SHELL = shutil.which("sh")
PAYLOAD_DIRECTORIES = ("skills", "agents", "output-styles", "mods")
BUNDLED_MODS = ("first-mod", "second-mod")
PLUGIN_DIRECTORIES = "CLAUDE_CODE_PLUGIN_DIRS"
MANIFEST = ".anthropic-claude-code-agent-skills.manifest"
INSTALL_MODE = ".anthropic-claude-code-agent-skills.install-mode"
BACKUPS = ".anthropic-claude-code-agent-skills-backups"
PORTABLE_SETTINGS = {
    "model": "portable-model",
    "env": {"PORTABLE_VARIABLE": "1"},
    "permissions": {"defaultMode": "bypassPermissions"},
    "outputStyle": "Brief",
}


def link_directory(link, target):
    if os.name == "nt":
        subprocess.run(["cmd", "/c", "mklink", "/J", str(link), str(target)],
                       check=True, capture_output=True)
    else:
        link.symlink_to(target, target_is_directory=True)


class PayloadChecks:
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="claude-agents-test-")
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(os.path.realpath(self.temporary.name))
        self.source = self.root / "source payload"
        self.destination = self.root / "claude home"
        self.backup = self.root / "backup"
        self.work = self.root / "work"
        self.work.mkdir()
        self.environment = dict(os.environ)
        self.write(self.source / "settings.json", json.dumps(PORTABLE_SETTINGS))
        self.write(self.source / "skills/demo/SKILL.md", "Current skill\n")
        self.write(self.source / "agents/demo.md", "Current agent\n")
        self.write(self.source / "output-styles/brief.md", "Current style\n")
        for name in BUNDLED_MODS:
            self.write(self.source / "mods" / name / ".claude-plugin/plugin.json",
                       json.dumps({"name": name}))

    def write(self, path, content):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")

    def run_command(self, command, environment, check):
        result = subprocess.run(command, env=environment, capture_output=True, text=True,
                                encoding="utf-8", errors="replace", timeout=120)
        if check and result.returncode != 0:
            self.fail(f"Command failed with exit code {result.returncode}:\n{result.stdout}{result.stderr}")
        return result

    def sync(self, mode="replace", check=True):
        environment = dict(self.environment, TEST_SOURCE=self.source.as_posix(),
                           TEST_DESTINATION=self.destination.as_posix(),
                           TEST_BACKUP=self.backup.as_posix(), TEST_WORK=self.work.as_posix(),
                           TEST_MODE=mode, TEST_REPO=ROOT.as_posix())
        return self.run_command(self.sync_command, environment, check)

    def install(self, *arguments, check=True):
        environment = dict(self.environment, CLAUDE_CONFIG_DIR=self.destination.as_posix(),
                           CLAUDE_SKILLS_SOURCE=self.source.as_posix(),
                           TEST_SOURCE=self.source.as_posix(), TEST_REPO=ROOT.as_posix())
        return self.run_command([*self.install_command, *arguments], environment, check)

    def settings(self):
        return json.loads((self.destination / "settings.json").read_text(encoding="utf-8"))

    def plugin_directories(self):
        return self.settings()["env"][PLUGIN_DIRECTORIES].split(os.pathsep)

    def installed_mod_directories(self):
        return [str(self.destination / "mods" / name) for name in BUNDLED_MODS]

    def payload_files(self, root):
        return {
            path.relative_to(root).as_posix(): path.read_bytes()
            for directory in PAYLOAD_DIRECTORIES
            for path in (root / directory).rglob("*")
            if path.is_file()
        }

    def test_installs_payload_files_unchanged(self):
        self.sync()

        self.assertEqual(self.payload_files(self.destination), self.payload_files(self.source))

    def test_replace_removes_entries_missing_from_payload(self):
        self.write(self.destination / "skills/obsolete/SKILL.md", "old")
        self.write(self.destination / "agents/obsolete.md", "old")
        self.write(self.destination / "output-styles/obsolete.md", "old")
        self.write(self.destination / "mods/obsolete/.claude-plugin/plugin.json", "old")

        self.sync()

        self.assertFalse((self.destination / "skills/obsolete").exists())
        self.assertFalse((self.destination / "agents/obsolete.md").exists())
        self.assertFalse((self.destination / "output-styles/obsolete.md").exists())
        self.assertFalse((self.destination / "mods/obsolete").exists())

    def test_replace_keeps_synced_skills_and_private_files(self):
        self.write(self.destination / "skills/synced/shared/SKILL.md", "synced")
        self.write(self.destination / "skills/.trash/removed/SKILL.md", "trash")
        self.write(self.destination / ".credentials.json", "private fixture")

        self.sync()

        self.assertEqual((self.destination / "skills/synced/shared/SKILL.md").read_text(), "synced")
        self.assertEqual((self.destination / "skills/.trash/removed/SKILL.md").read_text(), "trash")
        self.assertEqual((self.destination / ".credentials.json").read_text(), "private fixture")

    def test_merge_keeps_unrelated_entries(self):
        self.write(self.destination / "skills/custom/SKILL.md", "custom")
        self.write(self.destination / "agents/custom.md", "custom")
        self.write(self.destination / "output-styles/custom.md", "custom")
        self.write(self.destination / "mods/custom/.claude-plugin/plugin.json", "custom")

        self.sync(mode="merge")

        self.assertTrue((self.destination / "skills/custom/SKILL.md").exists())
        self.assertTrue((self.destination / "agents/custom.md").exists())
        self.assertTrue((self.destination / "output-styles/custom.md").exists())
        self.assertTrue((self.destination / "mods/custom/.claude-plugin/plugin.json").exists())

    def test_merge_replaces_bundled_entries(self):
        self.write(self.destination / "mods/first-mod/stale.txt", "stale")
        self.write(self.destination / "agents/demo.md", "previous agent")

        self.sync(mode="merge")

        self.assertFalse((self.destination / "mods/first-mod/stale.txt").exists())
        self.assertEqual((self.destination / "agents/demo.md").read_text(), "Current agent\n")

    def test_backs_up_replaced_entries_and_settings(self):
        self.write(self.destination / "agents/obsolete.md", "old agent")
        self.write(self.destination / "settings.json", '{"model": "personal-model"}')

        self.sync()

        self.assertEqual((self.backup / "agents/obsolete.md").read_text(), "old agent")
        self.assertEqual((self.backup / "settings.json").read_text(), '{"model": "personal-model"}')

    def test_settings_keep_existing_values_and_gain_missing_keys(self):
        self.write(self.destination / "settings.json", json.dumps({
            "model": "personal-model",
            "env": {"PERSONAL_VARIABLE": "1"},
            "permissions": {"allow": ["Bash(ls)"]},
        }))

        self.sync()

        settings = self.settings()
        self.assertEqual(settings["model"], "personal-model")
        self.assertEqual(settings["env"]["PERSONAL_VARIABLE"], "1")
        self.assertEqual(settings["env"]["PORTABLE_VARIABLE"], "1")
        self.assertEqual(settings["permissions"],
                         {"allow": ["Bash(ls)"], "defaultMode": "bypassPermissions"})

    def test_settings_keep_timestamp_strings_verbatim(self):
        self.write(self.destination / "settings.json", json.dumps({"reviewedAt": "2026-10-15T12:00:00+02:00"}))

        self.sync()

        self.assertEqual(self.settings()["reviewedAt"], "2026-10-15T12:00:00+02:00")

    def test_settings_switch_output_style_to_brief(self):
        self.write(self.destination / "settings.json", json.dumps({"outputStyle": "Explanatory"}))

        self.sync()

        self.assertEqual(self.settings()["outputStyle"], "Brief")

    def test_replace_lists_exactly_the_bundled_mod_directories(self):
        self.write(self.destination / "settings.json", json.dumps(
            {"env": {PLUGIN_DIRECTORIES: str(self.root / "other mods" / "custom")}}))

        self.sync()

        self.assertEqual(self.plugin_directories(), self.installed_mod_directories())

    def test_merge_adds_bundled_mod_directories_after_existing_entries(self):
        custom = str(self.root / "other mods" / "custom")
        self.write(self.destination / "settings.json", json.dumps({"env": {PLUGIN_DIRECTORIES: custom}}))

        self.sync(mode="merge")

        self.assertEqual(self.plugin_directories(), [custom, *self.installed_mod_directories()])

    def test_merge_does_not_repeat_a_mod_directory_listed_with_tilde(self):
        self.destination = self.root / ".claude"
        self.environment.update(HOME=str(self.root), USERPROFILE=str(self.root))
        self.write(self.destination / "settings.json", json.dumps(
            {"env": {PLUGIN_DIRECTORIES: "~/.claude/mods/first-mod"}}))

        self.sync(mode="merge")

        self.assertEqual(self.plugin_directories(),
                         ["~/.claude/mods/first-mod", str(self.destination / "mods" / "second-mod")])

    def test_manifest_records_hashes_of_installed_files(self):
        self.sync()

        plugin_manifest = self.source / "mods/first-mod/.claude-plugin/plugin.json"
        digest = hashlib.sha256(plugin_manifest.read_bytes()).hexdigest()
        manifest = (self.destination / MANIFEST).read_text()
        self.assertIn(digest + "\tmods/first-mod/.claude-plugin/plugin.json", manifest)

    def test_incomplete_payload_does_not_change_existing_installation(self):
        shutil.rmtree(self.source / "agents")
        self.write(self.destination / "agents/existing.md", "keep existing")

        result = self.sync(check=False)

        self.assertNotEqual(result.returncode, 0)
        self.assertEqual((self.destination / "agents/existing.md").read_text(), "keep existing")

    def test_rejects_source_equal_to_destination_before_deleting(self):
        original_payload = self.payload_files(self.source)
        self.destination = self.source

        result = self.sync(check=False)

        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.payload_files(self.source), original_payload)

    def test_rejects_symbolic_link_managed_directory(self):
        linked_skills = self.root / "linked skills"
        self.write(linked_skills / "keep/SKILL.md", "keep")
        self.destination.mkdir()
        link_directory(self.destination / "skills", linked_skills)

        result = self.sync(check=False)

        self.assertNotEqual(result.returncode, 0)
        self.assertEqual((linked_skills / "keep/SKILL.md").read_text(), "keep")
        self.assertFalse((self.destination / "settings.json").exists())

    def test_rejects_source_inside_managed_directory(self):
        nested_source = self.destination / "skills" / "payload"
        shutil.copytree(self.source, nested_source)
        self.source = nested_source

        result = self.sync(check=False)

        self.assertNotEqual(result.returncode, 0)
        self.assertTrue((nested_source / "settings.json").exists())
        self.assertFalse((self.destination / "settings.json").exists())

    def test_invalid_settings_do_not_change_existing_installation(self):
        self.write(self.destination / "settings.json", "{ not json")
        self.write(self.destination / "agents/existing.md", "keep existing")

        result = self.sync(check=False)

        self.assertNotEqual(result.returncode, 0)
        self.assertEqual((self.destination / "settings.json").read_text(), "{ not json")
        self.assertEqual((self.destination / "agents/existing.md").read_text(), "keep existing")

    def test_default_installer_replaces_old_set_in_config_dir(self):
        self.write(self.destination / "skills/obsolete/SKILL.md", "old")
        self.write(self.destination / "agents/obsolete.md", "old")

        self.install()

        self.assertFalse((self.destination / "skills/obsolete").exists())
        self.assertFalse((self.destination / "agents/obsolete.md").exists())
        self.assertTrue((self.destination / "agents/demo.md").exists())
        self.assertEqual((self.destination / INSTALL_MODE).read_text(), "replace\n")

    def test_merge_installer_keeps_custom_agents_and_records_merge_mode(self):
        self.write(self.destination / "agents/custom.md", "custom")

        self.install(*self.merge_arguments)

        self.assertTrue((self.destination / "agents/custom.md").exists())
        self.assertEqual((self.destination / INSTALL_MODE).read_text(), "merge\n")

    def test_reinstall_keeps_settings_and_creates_distinct_backups(self):
        self.write(self.destination / "agents/previous.md", "previous")
        self.install()
        original = self.settings()

        self.install()

        self.assertEqual(self.settings(), original)
        self.assertEqual(len(list((self.destination / BACKUPS).iterdir())), 2)


POWERSHELL_SYNC = ('$ErrorActionPreference = "Stop"; . "$env:TEST_REPO/scripts/lib.ps1"; '
                   'Sync-ClaudePayload -Source $env:TEST_SOURCE -Destination $env:TEST_DESTINATION '
                   '-BackupDirectory $env:TEST_BACKUP -Mode $env:TEST_MODE | Out-Null')
POWERSHELL_INSTALL = '& "$env:TEST_REPO/scripts/install.ps1" -Source $env:TEST_SOURCE'
SHELL_SYNC = ('set -eu; . "$TEST_REPO/scripts/lib.sh"; '
              'claude_sync_payload "$TEST_SOURCE" "$TEST_DESTINATION" "$TEST_BACKUP" "$TEST_MODE" "$TEST_WORK"')


@unittest.skipUnless(WINDOWS_POWERSHELL, "Windows PowerShell is unavailable")
class WindowsPowerShellTests(PayloadChecks, unittest.TestCase):
    options = [WINDOWS_POWERSHELL, "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command"]
    sync_command = [*options, POWERSHELL_SYNC]
    install_command = [*options, POWERSHELL_INSTALL]
    merge_arguments = ["-Mode", "Merge"]


@unittest.skipUnless(POWERSHELL, "PowerShell 7 is unavailable")
class PowerShellTests(PayloadChecks, unittest.TestCase):
    options = [POWERSHELL, "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command"]
    sync_command = [*options, POWERSHELL_SYNC]
    install_command = [*options, POWERSHELL_INSTALL]
    merge_arguments = ["-Mode", "Merge"]


@unittest.skipUnless(SHELL, "POSIX shell is unavailable")
class ShellTests(PayloadChecks, unittest.TestCase):
    sync_command = [SHELL, "-c", SHELL_SYNC]
    install_command = [SHELL, str(ROOT / "scripts/install.sh")]
    merge_arguments = ["--merge"]

    def setUp(self):
        super().setUp()
        python_directory = self.root / "python bin"
        self.write(python_directory / "python3",
                   f'#!/bin/sh\nexec "{Path(sys.executable).as_posix()}" "$@"\n')
        (python_directory / "python3").chmod(0o755)
        self.environment["PATH"] = str(python_directory) + os.pathsep + self.environment["PATH"]

    def test_stops_before_changes_when_python3_is_missing(self):
        self.write(self.destination / "agents/existing.md", "keep existing")
        empty_directory = self.root / "empty path"
        empty_directory.mkdir()
        self.environment["PATH"] = str(empty_directory)

        result = self.install(check=False)

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("python3 is required", result.stderr)
        self.assertEqual((self.destination / "agents/existing.md").read_text(), "keep existing")
