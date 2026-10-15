"""Execute the exact shipped cards, independently, against locked dependencies."""
import json
import os
from pathlib import Path
import subprocess
import sys

import pytest

ROOT = Path(__file__).resolve().parents[3]
CARDS = json.loads((ROOT / "packs/python.json").read_text(encoding="utf-8"))["cards"]

@pytest.mark.parametrize("card", CARDS, ids=lambda card: card["id"])
def test_catalog_card(card, tmp_path):
    # pytest examples must be collected and run, not merely imported.
    is_pytest = card["id"].startswith("pytest-")
    script = tmp_path / ("test_example.py" if is_pytest else "example.py")
    script.write_text(card["code"] + "\n", encoding="utf-8")
    command = [sys.executable, "-m", "pytest", "-q", str(script)] if is_pytest else [sys.executable, str(script)]
    result = subprocess.run(command, cwd=tmp_path, capture_output=True, text=True, timeout=30,
                            env={**os.environ, "PYTEST_DISABLE_PLUGIN_AUTOLOAD": "1"})
    assert result.returncode == 0, result.stdout + result.stderr
    if is_pytest:
        assert "passed" in result.stdout
