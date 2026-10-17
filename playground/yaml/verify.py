"""Assert exact catalog documents and mutated boundaries with pinned offline tools.

No workflow steps, templates, builds or containers execute. Actions expressions
are inspected as literals; actionlint validates workflow/contract references.
"""
import io
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from importlib.metadata import version
from tempfile import TemporaryDirectory

from ruamel.yaml import YAML
from ruamel.yaml.error import YAMLError
from cfnlint.decode import decode

HERE = Path(__file__).parent
ACTIONLINT = os.environ.get("ACTIONLINT", "actionlint")
CFNLINT = str(Path(sys.executable).with_name("cfn-lint"))
# Keep interpolation deterministic; never inherit credentials or user .env data.
ENV = {key: os.environ[key] for key in ("PATH", "SYSTEMROOT") if key in os.environ}
ENV["DEMO_LABEL"] = "playground"


def yaml(version=(1, 2)):
    loader = YAML(typ="safe")
    loader.version = version
    loader.allow_duplicate_keys = False
    return loader


def command(args, cwd):
    result = subprocess.run(args, cwd=cwd, env=ENV, text=True,
                            capture_output=True, timeout=40)
    return result.returncode, result.stdout + result.stderr


def dump(value):
    output = io.StringIO()
    # actionlint's YAML reader accepts workflow syntax without a version directive.
    YAML(typ="safe").dump(value, output)
    return output.getvalue()


def lookup(document, path):
    for part in path.split("."):
        document = document[int(part)] if isinstance(document, list) else document[part]
    return document


def assert_values(document, expected, label):
    for path, value in expected.items():
        actual = lookup(document, path)
        # cfn-lint annotates strings/lists with subclasses carrying source marks.
        correct_type = type(actual) is type(value) if isinstance(value, (bool, int, float)) else isinstance(actual, type(value))
        assert actual == value and correct_type, (label, path, actual, value)


def validate(code, card, spec, folder):
    """Return real consumer data; raise on parser or schema rejection."""
    target = folder / "candidate.yaml"
    target.write_text(code)
    family = card["topics"][0].split("-")[0]
    if family == "compose":
        args = ["docker", "compose", "--project-directory", str(folder),
                "--env-file", str(folder / "empty.env"), "-p", "syntaxiser-validation"]
        if spec.get("base"):
            args += ["-f", str(HERE / "depth/compose.base.yaml")]
        args += ["-f", str(target), "--profile", "*", "config", "--format", "json"]
        status, output = command(args, folder)
        assert status == 0, output
        return json.loads(output)
    if family == "cfn":
        document, errors = decode(str(target))
        assert not errors, errors
        status, output = command([CFNLINT, "-r", "us-east-1", "-t", str(target)], folder)
        assert status == 0, output
        return document
    document = list(yaml().load_all(code)) if spec.get("stream") else yaml().load(code)
    if family == "github":
        workflow = folder / ".github/workflows/check.yml"
        workflow.parent.mkdir(parents=True, exist_ok=True)
        workflow.write_text(code)
        paths = [str(workflow)]
        if card["topics"][0] == "github-reusable":
            name = spec["contract"]
            caller = {"name": "Local caller", "on": "workflow_dispatch", "permissions": {},
                      "jobs": {"call": {"uses": "./.github/workflows/check.yml",
                                         "with": {name: "journal" if name == "label" else 0}}}}
            caller_file = workflow.with_name("caller.yml")
            caller_file.write_text(dump(caller))
            paths.append(str(caller_file))
        if card["topics"][0] == "github-composite":
            action = folder / ".github/actions/local/action.yml"
            action.parent.mkdir(parents=True, exist_ok=True)
            action.write_text(code)
            # actionlint reads local metadata to check the caller's input/output
            # contract, but does not lint the composite body as a workflow.
            # Project exact parsed steps/outputs into a dispatch workflow so its
            # real expression checker also checks their contexts/references.
            assert document["runs"]["using"] == "composite"
            assert document["name"] and document["description"]
            for step in document["runs"]["steps"]:
                if "run" in step:
                    assert step.get("shell"), "composite run step requires shell"
            inputs = {key: {**value, "type": "string"} for key, value in document.get("inputs", {}).items()}
            job = {"runs-on": "ubuntu-latest", "steps": document["runs"]["steps"]}
            if document.get("outputs"):
                job["outputs"] = {key: value["value"] for key, value in document["outputs"].items()}
            workflow.write_text(dump({"name": "Projected composite body", "on": {"workflow_dispatch": {"inputs": inputs}}, "jobs": {"check": job}}))
            caller = {"name": "Local caller", "on": "workflow_dispatch", "jobs": {"call": {
                "runs-on": "ubuntu-latest", "steps": [{"uses": "actions/checkout@v5"},
                    {"id": "local", "uses": "./.github/actions/local", "with": {spec["contract"]: "journal"}}]}}}
            caller_file = workflow.with_name("caller.yml")
            caller_file.write_text(dump(caller))
            paths.append(str(caller_file))
        status, output = command([ACTIONLINT, "-shellcheck=", "-pyflakes=", *paths], folder)
        assert status == 0, output
    return document


def reject(code, card, spec, folder):
    reason = spec["error"]["diagnostic"]
    patterns = {
        "tab": r"\\t|tab|token", "flow": r"flow|expected|end of stream",
        "integer": r"invalid literal|integer|int\(", "mapping": r"mapping|merge",
        "indentation": r"indentation|expected indentation", "alias": r"alias",
        "constructor": r"constructor", "duplicate": r"duplicate",
    }
    try:
        validate(code, card, spec, folder)
    except (YAMLError, AssertionError, ValueError) as error:
        assert re.search(patterns.get(reason, re.escape(reason)), str(error), re.I), (card["id"], reason, str(error))
    else:
        raise AssertionError("Invalid document accepted: " + card["id"])


def additional_boundaries(cards, cases, folder):
    """Cross-document/schema limits not conveyed by a single key assertion."""
    parser11 = yaml((1, 1))
    assert parser11.load("on: yes") == {True: True}
    assert yaml().load("on: yes") == {"on": "yes"}
    assert yaml((1, 1)).load("number: 012")["number"] == 10
    assert yaml().load("number: 012")["number"] == 12
    try:
        yaml((1, 1)).load("on: 1\ntrue: 2")
    except YAMLError as error:
        assert "duplicate" in str(error)
        assert yaml((1, 1)).load('"on": 1\n"true": 2') == {"on": 1, "true": 2}
    else:
        raise AssertionError("legacy boolean key collision accepted")
    reserved = next(c for c in cards if c["id"] == "yaml-scalars-reserved")
    assert parser11.load(reserved["code"])["labels"] == yaml().load(reserved["code"])["labels"]
    for source in ("a: 1\na: 2", "a:\n\tb: 1", "a: !unknown value", "a: [unfinished"):
        try:
            yaml().load(source)
        except YAMLError:
            assert yaml().load("a: []") == {"a": []}  # fresh-loader recovery
        else:
            raise AssertionError(source)
    try:
        list(yaml().load_all("---\na: &node [1]\n---\nb: *node"))
    except YAMLError as error:
        assert "alias" in str(error)
    else:
        raise AssertionError("cross-document anchor accepted")
    # Explicit load() rejection: streams require load_all(), not silent truncation.
    stream = next(c for c in cards if c["id"] == "yaml-documents-environments")
    try:
        yaml().load(stream["code"])
    except YAMLError as error:
        assert "single document" in str(error)
    else:
        raise AssertionError("single-document API accepted stream")
    for suffix, value in (("label", False), ("count", "not numeric")):
        card = next(c for c in cards if c["id"] == "yaml-reusable-" + suffix)
        validate(card["code"], card, cases[card["id"]], folder)
        caller = folder / ".github/workflows/caller.yml"
        doc = yaml().load(caller)
        doc["jobs"]["call"]["with"][suffix] = value
        caller.write_text(dump(doc))
        status, output = command([ACTIONLINT, "-shellcheck=", "-pyflakes=", str(caller)], folder)
        assert status != 0 and ("type" in output or "number" in output), output
        validate(card["code"], card, cases[card["id"]], folder)
    # Composite contracts: unknown caller inputs are rejected by actionlint.
    card = next(c for c in cards if c["id"] == "yaml-composite-greeting")
    validate(card["code"], card, cases[card["id"]], folder)
    caller = folder / ".github/workflows/caller.yml"
    caller.write_text(caller.read_text().replace("name: journal", "missing: journal"))
    status, output = command([ACTIONLINT, "-shellcheck=", "-pyflakes=", str(caller)], folder)
    assert status != 0 and "missing" in output, output
    # Required interpolation: both absent and empty must fail; fallback recovers.
    required = next(c for c in cards if c["id"] == "yaml-env-required")
    previous = ENV.pop("DEMO_LABEL")
    for label in (None, ""):
        if label is not None:
            ENV["DEMO_LABEL"] = label
        try:
            validate(required["code"], required, cases[required["id"]], folder)
        except AssertionError as error:
            assert "Set a nonempty DEMO_LABEL" in str(error)
        else:
            raise AssertionError("missing/empty required variable accepted")
        fallback = required["code"].replace("${DEMO_LABEL:?Set a nonempty DEMO_LABEL}", "${DEMO_LABEL:-fallback}")
        assert validate(fallback, required, cases[required["id"]], folder)["services"]["app"]["environment"]["APP_LABEL"] == "fallback"
    ENV["DEMO_LABEL"] = previous
    for card in cards:
        if card["topics"][0] != "compose-profiles":
            continue
        target = folder / "profile.yaml"
        target.write_text(card["code"])
        args = ["docker", "compose", "--project-directory", str(folder), "--env-file", str(folder / "empty.env"),
                "-p", "syntaxiser-validation", "-f", str(target)]
        status, output = command([*args, "config", "--format", "json"], folder)
        assert status == 0, output
        assert set(json.loads(output)["services"]) == {"cache"}
        status, output = command([*args, "--profile", cases[card["id"]]["profile"], "config", "--format", "json"], folder)
        assert status == 0, output
        assert len(json.loads(output)["services"]) == 2


def main():
    assert subprocess.check_output([ACTIONLINT, "-version"], text=True).splitlines()[0] == "1.7.12"
    assert version("ruamel.yaml") == "0.18.16"
    assert version("cfn-lint") == "1.57.2"
    assert subprocess.check_output(["docker", "compose", "version", "--short"], text=True).strip().lstrip("v") == "5.5.1"
    snapshot = json.loads((HERE / "depth/catalog.json").read_text())
    pack = json.loads((Path(sys.argv[1]) / "pack.json").read_text()) if len(sys.argv) > 1 else snapshot
    assert pack == snapshot, "Playground catalog snapshot is stale"
    cases = json.loads((HERE / "depth/cases.json").read_text())
    assert set(cases) == {card["id"] for card in pack["cards"]}
    for filename, topic in [("config.yaml", "yaml-multiline"), (".github/workflows/check.yml", "github-matrix"),
                            ("cloudformation.yaml", "cfn-conditions"), ("compose.yaml", "compose-health")]:
        card = next(c for c in pack["cards"] if c["id"] == "yaml-example-" + topic)
        assert (HERE / filename).read_text().rstrip() == card["code"].rstrip()
    for filename, id in {
        ".github/actions/greeting/action.yml": "yaml-composite-greeting",
        ".github/actions/summary/action.yml": "yaml-composite-summary",
        ".github/workflows/label.yml": "yaml-reusable-label",
        ".github/workflows/count.yml": "yaml-reusable-count",
    }.items():
        assert (HERE / "depth" / filename).read_text() == next(c["code"] for c in pack["cards"] if c["id"] == id)
    with TemporaryDirectory(prefix="syntaxiser-yaml-depth-") as temp:
        folder = Path(temp)
        (folder / ".git").mkdir()
        (folder / "empty.env").write_text("")
        failures = []
        for card in pack["cards"]:
            try:
                id = card["id"]
                spec = cases[id]
                assert (HERE / "depth" / (id + ".yaml")).read_text() == card["code"], id
                document = validate(card["code"], card, spec, folder)
                assert_values(document, spec["happy"], id + "/happy")
                if spec.get("identity"):
                    original, shared, separate = (document[key] for key in spec["identity"])
                    assert original is shared and original is not separate
                    original["retries"] = 0
                    assert shared["retries"] == 0 and separate["retries"] == 3
                old, new = spec["edge"]["replace"]
                assert old in card["code"]
                assert_values(validate(card["code"].replace(old, new), card, spec, folder), spec["edge"]["assertions"], id + "/edge")
                old, new = spec["error"]["replace"]
                assert old in card["code"]
                reject(card["code"].replace(old, new), card, spec, folder)
                # Error handling must leave a valid document usable with fresh state.
                assert_values(validate(card["code"], card, spec, folder), spec["happy"], id + "/recovery")
                print(id + ": happy / edge / rejection / recovery passed", flush=True)
            except Exception as error:
                failures.append((card["id"], str(error)))
                print(card["id"] + ": FAILED " + str(error), flush=True)
        assert not failures, failures
        additional_boundaries(pack["cards"], cases, folder)
    print(f"Validated {len(pack['cards'])} exact cards; YAML 1.1/1.2, local workflow/action contracts, cfn-lint and Compose config. No deployments or runner/container execution.")


if __name__ == "__main__":
    main()
