# YAML learning playground

This playground validates configuration locally. It never runs a workflow, deploys a stack, pulls an image, starts a container or creates a volume. Cloud credentials and a Docker daemon are unnecessary. The extension bundles YAML text and a highlighter; these validation tools are development dependencies only.

## Pinned tools and setup

Use Node **26.3.0** with nvm/pnpm, Python **3.13.7**, **ruamel.yaml 0.18.16**, **cfn-lint 1.57.2**, **actionlint 1.7.12**, and Docker Compose **5.5.1**. Python transitive dependencies are pinned in `uv.lock`. Install uv and Docker Compose separately. The validator checks exact tool versions so a tool upgrade is deliberate.

From the repository root:

```sh
nvm use
pnpm install --ignore-scripts
uv sync --project playground/yaml --locked

# Download the pinned Linux amd64 actionlint release with authenticated gh.
# Select the matching upstream archive on other architectures/platforms.
TASK_TOOLS=$(mktemp -d)
gh release download v1.7.12 --repo rhysd/actionlint \
  --pattern actionlint_1.7.12_linux_amd64.tar.gz \
  --pattern actionlint_1.7.12_checksums.txt --dir "$TASK_TOOLS"
(cd "$TASK_TOOLS" && sha256sum --ignore-missing -c actionlint_1.7.12_checksums.txt)
tar -xzf "$TASK_TOOLS/actionlint_1.7.12_linux_amd64.tar.gz" -C "$TASK_TOOLS" actionlint
export ACTIONLINT="$TASK_TOOLS/actionlint"
docker compose version --short

pnpm check:yaml
pnpm test
```

`pnpm check:yaml` reads **all 25 actual catalog snippets**, writes temporary files and removes them afterward. It parses generic YAML/Actions/Compose with YAML 1.2, decodes CloudFormation intrinsic tags with cfn-lint, checks expected scalar/list/text/intrinsic values, verifies parser-version differences and rejects duplicate keys, tabs and incomplete flow sequences. It then validates nine workflows with actionlint, five stacks with cfn-lint and five Compose documents with `docker compose config`. The editor fixtures below are checked against their matching catalog cards. Optional actionlint shellcheck/pyflakes integrations are disabled, so this check covers workflow structure and expressions rather than arbitrary script correctness.

Dependency installation needs network access. Subsequent checks use local tooling and need no cloud access. cfn-lint uses its bundled schemas; do not run its schema-update option for a reproducible check.

## Individual fixtures

```sh
# Parse generic YAML, preserving literal versus folded text.
uv run --project playground/yaml --locked python -c \
  'from ruamel.yaml import YAML; from pathlib import Path; print(YAML(typ="safe").load(Path("playground/yaml/config.yaml")))'

# Validate a workflow without publishing it.
"$ACTIONLINT" -shellcheck= -pyflakes= playground/yaml/.github/workflows/check.yml

# Validate a template without accessing AWS.
uv run --project playground/yaml --locked cfn-lint \
  -r us-east-1 -t playground/yaml/cloudformation.yaml

# Normalize Compose without a daemon or containers.
docker compose -p syntaxiser-validation -f playground/yaml/compose.yaml config
```

Expected results: the generic description becomes one line without a trailing newline; the script retains its line breaks. actionlint and cfn-lint exit successfully without diagnostics. Compose prints a Redis cache, named data volume, health check and a probe that waits for `service_healthy`.

The other catalog examples are complete documents. Copy them into disposable files and use the matching validator above. The npm-cache workflow expects a real `package-lock.json` and `test` script if you later execute it in another repository; local schema validation does not execute those commands.

## Manual extension walkthrough

1. Build/install the extension or press F5 in the repository's extension development configuration. Open Syntaxiser and make sure VS Code identifies these fixtures as **YAML**.
2. Open `config.yaml`. Move to `script: |` and `description: >-`. Multiline YAML examples and a separate multiline quick reference should appear. Generic files should show foundations, without unrelated schema examples.
3. Open `.github/workflows/check.yml` under this playground. Move to `strategy`, `matrix` and its `node` list: the Node matrix example should rank near the top. Change the list into an incomplete edit and confirm the sidebar remains usable. In a disposable workflow, move onto `permissions` or a quoted `${{ github.event.pull_request.title }}` value to see permissions or expression material.
4. Open `cloudformation.yaml`. Move between `Parameters`, `Conditions`, `!Equals`, and `!If`: parameter/condition/intrinsic material should follow the cursor. In a disposable template, add an `Outputs` mapping and `!GetAtt WorkQueue.Arn`, then inspect the intrinsic reference. No Compose or Actions cards should appear in contextual results.
5. Open `compose.yaml`. Move to `volumes`, `healthcheck` and `depends_on`: each should prioritize its Compose topic. Comments, quoted prose and multiline script bodies should not act as unrelated schema cues.
6. While any YAML fixture is active, search **github actions matrix**, **workflow permissions**, **cloudformation parameter**, **intrinsic ref**, **compose volume** and **multiline yaml**. Each query should put its focused practical example first, accompanied by an independently authored overview. Search deliberately covers all YAML ecosystems regardless of the filename.
7. Open **Reference** and browse the four groups: YAML foundations, GitHub Actions, AWS CloudFormation and Docker Compose. Check the official learning links. Overviews describe syntax; examples show concrete tasks.
8. Copy a workflow expression, `!Ref` tag or multiline block and compare the copied text exactly. Pin one example from each ecosystem; switch to Python or Rust and back, then reload VS Code. All pins should persist, with YAML highlighting and literal expression text.
9. Open **Lesson browser**. YAML has five tasks from nested data to a locally linted stack. Mark a task done, reload, then switch language to verify progress remains scoped. Task snippets contain no solutions or scaffolding. #36 owns further lesson expansion.

## Compatibility and limits

YAML 1.2 and YAML 1.1 resolve some plain values differently: `on`, `off`, `yes`, `no`, dates and leading-zero numbers can surprise older readers. Quote ambiguous strings and the workflow `on` key. YAML is only a data format: each ecosystem imposes its own keys, types and evaluation rules. CloudFormation supports a YAML 1.1 subset with intrinsic tags but excludes aliases and hash merges. Compose supports anchors/merge fragments and interprets dollar interpolation separately. Actions supports anchors/aliases; merge keys are not supported. See the [coverage and primary sources](../../docs/yaml-support.md).

Context detection is a bounded lexical fallback, tolerant of incomplete YAML. `.github/workflows/*.yml|yaml`, `compose*.yml|yaml`, `docker-compose*.yml|yaml`, and common `cloudformation`, `cfn` or `template` filenames supply cues. Unknown names can still be detected from root `on` plus `jobs`, `services`, or `AWSTemplateFormatVersion`/AWS resource declarations. Filename cues take precedence. Separate `---` documents use their own content cues. Unusual flow mappings, custom tags, aliases, explicit mapping keys and generated files can have approximate context. This does not replace an editor's YAML/schema diagnostics. Validation proves structure and expressions, not deployment permissions, resource existence, image availability or application behavior. Kubernetes, Terraform/HCL and Dockerfiles are outside this catalog.
