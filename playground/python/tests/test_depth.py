"""Compile and execute exact expanded cards with happy/edge/error assertions.

The reviewable descriptions in depth-evidence.json point to assertions in each
card, not to a handwritten equivalent. pytest cards are collected as tests.
"""
import importlib.util
import json
from pathlib import Path

import pytest

PLAYGROUND = Path(__file__).resolve().parents[1]
ROOT = PLAYGROUND.parents[1]
EVIDENCE = json.loads((PLAYGROUND / "depth-evidence.json").read_text(encoding="utf-8"))
CARDS = json.loads((ROOT / "packs/python.json").read_text(encoding="utf-8"))["cards"]
spec = importlib.util.spec_from_file_location("run_card", PLAYGROUND / "run_card.py")
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)

@pytest.mark.parametrize("case", EVIDENCE, ids=lambda case: case["card"])
def test_exact_depth_card(case):
    result = runner.run_card(case["card"])
    assert result.returncode == 0, result.stdout + result.stderr
    if case["card"].startswith("pytest-"):
        assert "passed" in result.stdout

def test_depth_inventory_is_complete_and_preserves_new_topic_variants():
    by_id = {card["id"]: card for card in CARDS}
    assert len({case["card"] for case in EVIDENCE}) == len(EVIDENCE)
    for case in EVIDENCE:
        assert case["topic"] in by_id[case["card"]]["topics"]
        assert all(case[situation] for situation in ["happy", "edge", "error"])
    original = {"variables", "collections", "slicing", "comprehensions", "control-flow", "functions", "imports", "exceptions", "classes", "dataclasses", "generators", "context-managers", "typing", "async", "pathlib", "file-io", "json", "csv", "logging", "pytest-fixtures", "pytest-parametrize", "httpx", "httpx-async", "pydantic", "fastapi"}
    topics = {topic for card in CARDS for topic in card["topics"]}
    for topic in topics - original:
        assert len([card for card in CARDS if topic in card["topics"]]) >= 2

@pytest.mark.parametrize("card_id, before, after", [
    ("arguments-collect", "return bucket", "return []"),
    ("decimal-money", 'ROUND_HALF_UP)', '"ROUND_DOWN")'),
    ("task-groups-cancel", 'cleaned.append("closed")', 'cleaned.append("leaked")'),
])
def test_catalog_only_behavior_regressions_fail(monkeypatch, tmp_path, card_id, before, after):
    """Prove execution checks detect catalog drift, without a copied fixture."""
    catalog = json.loads((ROOT / "packs/python.json").read_text(encoding="utf-8"))
    card = next(card for card in catalog["cards"] if card["id"] == card_id)
    assert before in card["code"]
    card["code"] = card["code"].replace(before, after)
    (tmp_path / "packs").mkdir()
    (tmp_path / "packs/python.json").write_text(json.dumps(catalog), encoding="utf-8")
    monkeypatch.setattr(runner, "ROOT", tmp_path)
    result = runner.run_card(card_id)
    assert result.returncode != 0
    assert "AssertionError" in result.stderr
