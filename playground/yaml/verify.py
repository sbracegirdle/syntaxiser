"""Parse all examples, assert outcomes, then use real schema validators offline."""
import json
import os
from pathlib import Path
import subprocess
import sys
from importlib.metadata import version

from ruamel.yaml import YAML
from cfnlint.decode import decode

temporary = Path(sys.argv[1])
pack = json.loads((temporary / "pack.json").read_text())
playground = Path(__file__).parent
for filename, topic in [("config.yaml", "yaml-multiline"), (".github/workflows/check.yml", "github-matrix"),
                        ("cloudformation.yaml", "cfn-conditions"), ("compose.yaml", "compose-health")]:
    card = next(card for card in pack["cards"] if card["topics"][0] == topic)
    assert (playground / filename).read_text().rstrip() == card["code"].rstrip(), filename
parser = YAML(typ="safe")
parser.version = (1, 2)
parser.allow_duplicate_keys = False
documents = {}
files = {"yaml": [], "github": [], "cfn": [], "compose": []}
for card in pack["cards"]:
    family = card["topics"][0].split("-")[0]
    target = temporary / (card["id"] + ".yaml")
    target.write_text(card["code"] + "\n")
    files[family].append(str(target))
    if family == "cfn":
        document, errors = decode(str(target))
        assert not errors, errors
    else:
        document = parser.load(card["code"])
    assert isinstance(document, dict), card["id"]
    documents[card["topics"][0]] = document

assert documents["yaml-mappings"]["app"]["server"]["port"] == 8080
assert documents["yaml-sequences"]["targets"][1]["architectures"] == ["arm64"]
assert documents["yaml-scalars"]["mode"] == "on"
assert documents["yaml-scalars"]["account"] == "00123"
assert documents["yaml-scalars"]["enabled"] is True
assert documents["yaml-quoting"]["message"] == "Status: ready # verified"
assert documents["yaml-quoting"]["path"] == r"C:\work\journal"
assert documents["yaml-multiline"]["description"] == "Build the local journal without external services."
assert documents["yaml-multiline"]["script"].endswith("\n")
assert documents["yaml-anchors"]["default_regions"] == documents["yaml-anchors"]["preview_regions"]
assert "on" in documents["github-triggers"] and True not in documents["github-triggers"]
assert documents["github-matrix"]["jobs"]["test"]["strategy"]["matrix"]["node"] == [22, 24]
assert documents["github-permissions"]["permissions"] == {"contents": "read"}
assert documents["cfn-intrinsics"]["Outputs"]["QueueArn"]["Value"] == {"Fn::GetAtt": ["WorkQueue", "Arn"]}
assert documents["cfn-conditions"]["Resources"]["WorkQueue"]["Properties"]["MessageRetentionPeriod"] == {"Fn::If": ["IsProduction", 1209600, 86400]}
assert documents["compose-volumes"]["services"]["cache"]["volumes"] == ["cache-data:/data"]

parser.version = (1, 1)
assert parser.load("on: yes") == {True: True}
assert parser.load('"on": "yes"') == {"on": "yes"}
parser.version = (1, 2)
for invalid in ["a: 1\na: 2", "a:\n\tb: 1", "a: [unterminated"]:
    try:
        parser.load(invalid)
    except Exception:
        pass
    else:
        raise AssertionError("Invalid YAML accepted: " + invalid)

actionlint = os.environ.get("ACTIONLINT", "actionlint")
action_version = subprocess.check_output([actionlint, "-version"], text=True)
assert action_version.splitlines()[0] == "1.7.12", action_version
assert version("cfn-lint") == "1.57.2"
compose_version = subprocess.check_output(["docker", "compose", "version", "--short"], text=True).strip().lstrip("v")
assert compose_version == "5.5.1", compose_version
subprocess.run([actionlint, "-shellcheck=", "-pyflakes=", *files["github"]], check=True)
subprocess.run([str(Path(sys.executable).with_name("cfn-lint")), "-r", "us-east-1", "-t", *files["cfn"]], check=True)
for filename in files["compose"]:
    env = {**os.environ, "DEMO_LABEL": "playground"}
    rendered = json.loads(subprocess.check_output(["docker", "compose", "-p", "syntaxiser-validation", "-f", filename,
        "config", "--format", "json"], text=True, env=env))
    assert rendered["services"]
    if filename.endswith("compose-env.yaml"):
        assert rendered["services"]["app"]["environment"]["APP_LABEL"] == "playground"
        assert rendered["services"]["app"]["environment"]["FEATURE_ENABLED"] == "true"
    if filename.endswith("compose-health.yaml"):
        assert rendered["services"]["probe"]["depends_on"]["cache"]["condition"] == "service_healthy"

print(f"Validated {len(documents)} catalog examples: YAML 1.2 / 1.1 probes, actionlint 1.7.12, cfn-lint 1.57.2, Compose 5.5.1")
