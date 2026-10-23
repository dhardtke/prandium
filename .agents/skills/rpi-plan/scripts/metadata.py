#!/usr/bin/env python3
"""Get git metadata for plan documents."""

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


def run(cmd: list[str]) -> str:
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout.strip() if result.returncode == 0 else ""


def get_repo_name() -> str:
    remote = run(["git", "remote", "get-url", "origin"])
    if remote:
        name = remote.rstrip("/").rsplit("/", 1)[-1]
        return name.removesuffix(".git")
    root = run(["git", "rev-parse", "--show-toplevel"])
    return Path(root).name if root else Path.cwd().name


def main() -> None:
    metadata = {
        "date": datetime.now(timezone.utc).isoformat(),
        "commit": run(["git", "rev-parse", "HEAD"]),
        "branch": run(["git", "branch", "--show-current"]),
        "repository": get_repo_name(),
    }
    json.dump(metadata, sys.stdout, indent=2)
    print()


if __name__ == "__main__":
    main()
