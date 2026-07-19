#!/usr/bin/env python3
"""
Grand Council — Attribution and License-Gradient CI Check.

Ruled binding in Session 4 (Engineer + Skeptic reinforcement).

Fails the build if any of the following are true:

  1. Any file under sources/gogpt/derived/ or dashboards/ lacks a YAML front-matter
     'modifications:' block. CC BY 4.0 requires "indicate if changes were made"
     and this check enforces machine-readability of that indication.

  2. sources/n2yo/cache/ gains more than 5 new TLE entries in one push.
     This is the "bulk redistribution" rate-of-change gate. n2yo is a courier
     of Space-Track state; the repo does not become a mirror of that state.

  3. A citation to GOGPT is present in a derived artifact without matching the
     canonical string in sources/gogpt/ATTRIBUTION.md.

  4. Any file named 'SatDump*' with extension .json, .cfg, .sh, or .py is added
     under sources/satdump/. This is the "no vendoring" gate — SatDump is
     GPL and must not be bundled.

Exit code:
  0 = pass
  1 = check failed (block merge)
  2 = check errored (repo layout unexpected)

Author: Grand Council, Session 4 ruling.
"""

from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
GOGPT_CANONICAL_CITATION = "Global Oil and Gas Plant Tracker, Global Energy Monitor, January 2026 release."
TLE_ADD_RATE_LIMIT = 5
SATDUMP_VENDORING_EXTS = {".json", ".cfg", ".sh", ".py"}


def _run(cmd: list[str]) -> str:
    result = subprocess.run(cmd, cwd=REPO_ROOT, capture_output=True, text=True, check=False)
    return result.stdout


def _has_modifications_block(text: str) -> bool:
    """Detect a YAML front-matter block containing a 'modifications:' key."""
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.DOTALL)
    if not m:
        return False
    frontmatter = m.group(1)
    return bool(re.search(r"^\s*modifications:\s*", frontmatter, re.MULTILINE))


def check_derived_modifications() -> list[str]:
    """Every file under sources/gogpt/derived/ or dashboards/ must carry a modifications block."""
    errors: list[str] = []
    for base in ("sources/gogpt/derived", "dashboards"):
        base_path = REPO_ROOT / base
        if not base_path.exists():
            continue
        for path in base_path.rglob("*"):
            if not path.is_file():
                continue
            if path.suffix not in {".md", ".csv", ".yml", ".yaml"}:
                continue
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                # Binary or non-UTF-8 — skip; the license check does not apply to binaries.
                continue
            if not _has_modifications_block(text):
                rel = path.relative_to(REPO_ROOT)
                errors.append(f"[CC-BY-4.0 change indication missing] {rel}")
    return errors


def check_tle_rate_of_change() -> list[str]:
    """No more than TLE_ADD_RATE_LIMIT new files may land under sources/n2yo/cache/ in one push."""
    errors: list[str] = []
    base = "sources/n2yo/cache"
    if not (REPO_ROOT / base).exists():
        return errors
    # Compare current HEAD to the merge base with origin/main (or the previous commit if origin missing).
    ref = os.environ.get("GITHUB_BASE_REF", "")
    if ref:
        diff_base = f"origin/{ref}"
    else:
        diff_base = "HEAD~1"
    added = _run(["git", "diff", "--name-only", "--diff-filter=A", diff_base, "HEAD", "--", base])
    added_files = [line for line in added.splitlines() if line.strip()]
    if len(added_files) > TLE_ADD_RATE_LIMIT:
        errors.append(
            f"[n2yo rate-of-change] {len(added_files)} new TLE entries in one push "
            f"exceeds limit of {TLE_ADD_RATE_LIMIT} — bulk redistribution suspected."
        )
    return errors


def check_gogpt_citations() -> list[str]:
    """Any file that mentions GOGPT / Global Energy Monitor must use the canonical citation."""
    errors: list[str] = []
    for base in ("sources/gogpt/derived", "dashboards", "docs"):
        base_path = REPO_ROOT / base
        if not base_path.exists():
            continue
        for path in base_path.rglob("*"):
            if not path.is_file() or path.suffix not in {".md", ".txt", ".html"}:
                continue
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            mentions_gogpt = re.search(r"\bglobal (energy monitor|oil and gas plant tracker)\b", text, re.IGNORECASE)
            if mentions_gogpt and GOGPT_CANONICAL_CITATION not in text:
                rel = path.relative_to(REPO_ROOT)
                errors.append(f"[GOGPT canonical citation missing] {rel}")
    return errors


def check_satdump_no_vendoring() -> list[str]:
    """Refuse to accept SatDump-authored source, config, or scripts under sources/satdump/."""
    errors: list[str] = []
    base = REPO_ROOT / "sources" / "satdump"
    if not base.exists():
        return errors
    for path in base.rglob("*"):
        if not path.is_file():
            continue
        name_lower = path.name.lower()
        if name_lower.startswith("satdump") and path.suffix in SATDUMP_VENDORING_EXTS:
            rel = path.relative_to(REPO_ROOT)
            errors.append(f"[SatDump vendoring] {rel} appears to be a SatDump-authored file — GPL binding conflict.")
    return errors


def main() -> int:
    all_errors: list[str] = []
    for check in (
        check_derived_modifications,
        check_tle_rate_of_change,
        check_gogpt_citations,
        check_satdump_no_vendoring,
    ):
        try:
            all_errors.extend(check())
        except Exception as exc:  # noqa: BLE001
            print(f"[check errored] {check.__name__}: {exc}", file=sys.stderr)
            return 2

    if all_errors:
        print("Grand Council attribution check FAILED:", file=sys.stderr)
        for err in all_errors:
            print(f"  - {err}", file=sys.stderr)
        print(f"\n{len(all_errors)} violation(s). Block merge.", file=sys.stderr)
        return 1

    print("Grand Council attribution check passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
