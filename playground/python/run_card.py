"""Extract and run an exact practical card in a disposable directory."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]

def run_card(card_id):
    cards = json.loads((ROOT / "packs/python.json").read_text(encoding="utf-8"))["cards"]
    card = next(card for card in cards if card["id"] == card_id)
    # compile() checks syntax before execution; Python annotations aren't a type checker.
    compile(card["code"], card_id, "exec")
    is_pytest = card_id.startswith("pytest-")
    with tempfile.TemporaryDirectory(prefix="syntaxiser-python-") as directory:
        script = Path(directory) / ("test_example.py" if is_pytest else "example.py")
        script.write_text(card["code"] + "\n", encoding="utf-8")
        command = [sys.executable, "-m", "pytest", "-q", str(script)] if is_pytest else [sys.executable, str(script)]
        return subprocess.run(command, cwd=directory, capture_output=True, text=True, timeout=30,
                              env={**os.environ, "PYTEST_DISABLE_PLUGIN_AUTOLOAD": "1"})

if __name__ == "__main__":
    if sys.argv[1:] == ["--list"]:
        for card in json.loads((ROOT / "packs/python.json").read_text(encoding="utf-8"))["cards"]:
            print(card["id"], "—", card["title"])
    else:
        result = run_card(sys.argv[1])
        print(result.stdout + result.stderr, end="")
        if result.returncode == 0:
            print(f"PASS {sys.argv[1]}")
        sys.exit(result.returncode)
