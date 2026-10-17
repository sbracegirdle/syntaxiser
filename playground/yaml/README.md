# YAML learning playground

This playground validates configuration locally. It never runs a workflow, deploys a stack, pulls an image, starts a container or creates a volume. Cloud credentials and a Docker daemon are unnecessary. The extension bundles YAML text and a highlighter; these validation tools are development dependencies only.

## Pinned tools and setup

Use Node **26.3.0** with nvm/pnpm, Python **3.13.7**, **ruamel.yaml 0.18.16**, **cfn-lint 1.57.2**, **actionlint 1.7.12**, and Docker Compose **5.5.1**. Python transitive dependencies are pinned in `uv.lock`. Install uv and Docker Compose separately. The validator checks exact tool versions so a tool upgrade is deliberate.

From the repository root:

```sh
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

uv run --project playground/yaml --locked playground/yaml/verify.py
```

This standalone command validates all 60 standalone catalog fixtures, their boundary/rejection/recovery cases and the four original editor fixtures and works in the primary checkout before the YAML extension PR is merged. Open [generic YAML](config.yaml), [GitHub Actions](.github/workflows/check.yml), [CloudFormation](cloudformation.yaml), or [Compose](compose.yaml) to try the installed extension.

For full catalog and extension validation, use the YAML feature worktree or `integration` checkout:

```sh
nvm use
pnpm install --ignore-scripts
pnpm check:yaml
pnpm test
```

`pnpm check:yaml` consumes **all 60 exact catalog snippets** and compares the standalone snapshot and every `depth/*.yaml` editor fixture byte-for-byte. It applies the explicit assertions/edits in `depth/cases.json`, tests happy and meaningful edge outcomes, checks diagnostic-specific rejection and validates recovery for every card. It invokes actionlint for workflow contracts, cfn-lint for all eleven stacks and Compose config for all thirteen Compose tasks (including two layered override fragments). Foundation checks assert scalar types, streams, alias identity, shallow merge, exact multiline/chomping/indentation behavior and safe-loader rejection. A fresh loader is used after an error.

Reusable workflow callees get local caller fixtures; wrong typed inputs are rejected. Composite action metadata gets a local caller and the exact parsed body/output expressions are projected into a dispatch workflow for actionlint. Required metadata/shell fields are asserted directly. This does not execute the action or fully reproduce GitHub's hosted metadata validator. Optional shellcheck/pyflakes integrations remain disabled. Conditions, concurrency, secrets and output expressions are literal offline fixtures; successful linting does not prove runner or scheduler behavior.

Compose cases use an empty environment file and a controlled dummy interpolation value; inherited user credentials and `.env` values are not needed. Tests inspect default/active profiles, ordered base/override merging, `!reset`/`!override`, missing/empty required variables and fallback recovery. No build, image pull or container run occurs. See the [scope/source/assertion matrix](../../docs/yaml-depth.md) for the distinction between parser, schema and runtime evidence.

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

All other catalog examples are complete documents except the two explicitly labeled Compose override fragments, which require `depth/compose.base.yaml` first. Copy them into disposable files and use the matching validator above. The npm-cache workflow expects a real `package-lock.json` and `test` script if you later execute it in another repository; local schema validation does not execute those commands.

## Manual extension walkthrough

1. Build/install the extension or press F5 in the repository's extension development configuration. Open Syntaxiser and make sure VS Code identifies these fixtures as **YAML**.
2. Open `config.yaml`. Move to `script: |` and `description: >-`. Multiline YAML examples and a separate multiline quick reference should appear. Generic files should show foundations, without unrelated schema examples.
3. Open `.github/workflows/check.yml` under this playground. Move to `strategy`, `matrix` and its `node` list: the Node matrix example should rank near the top. Change the list into an incomplete edit and confirm the sidebar remains usable. In a disposable workflow, move onto `permissions` or a quoted `${{ github.event.pull_request.title }}` value to see permissions or expression material.
4. Open `cloudformation.yaml`. Move between `Parameters`, `Conditions`, `!Equals`, and `!If`: parameter/condition/intrinsic material should follow the cursor. In a disposable template, add an `Outputs` mapping and `!GetAtt WorkQueue.Arn`, then inspect the intrinsic reference. No Compose or Actions cards should appear in contextual results.
5. Open `compose.yaml`. Move to `volumes`, `healthcheck` and `depends_on`: each should prioritize its Compose topic. Comments, quoted prose and multiline script bodies should not act as unrelated schema cues.
6. While any YAML fixture is active, search **github actions matrix**, **workflow permissions**, **cloudformation parameter**, **intrinsic ref**, **compose volume** and **multiline yaml**. Each query should put its focused practical example first, accompanied by an independently authored overview. Search deliberately covers all YAML ecosystems regardless of the filename.
7. Open **Reference** and browse the four groups: YAML foundations, GitHub Actions, AWS CloudFormation and Docker Compose. Check the official learning links. Overviews describe syntax; examples show concrete tasks.
8. Copy a workflow expression, `!Ref` tag or multiline block and compare the copied text exactly. Pin one example from each ecosystem; switch to Python or Rust and back, then reload VS Code. All pins should persist, with YAML highlighting and literal expression text.
9. Open **Lesson browser**. YAML has five tasks from nested data to a locally linted stack. Mark a task done, reload, then switch language to verify progress remains scoped. Task snippets contain no solutions or scaffolding; instructions now link the new prerequisite overviews and solved examples separately. The five task IDs and progress are unchanged.


## Expanded editor and validator tour

All `depth/yaml-*.yaml` files are exact copies of practical cards, **not executable workflows**. Their generic filenames use root content cues; for composite metadata, copy to a disposable `action.yml` to supply its filename cue. Do not publish these examples.

```sh
# Exact physical blank lines and retained leading spaces:
uv run --project playground/yaml --locked python -c \
  'from pathlib import Path; from ruamel.yaml import YAML; p=Path("playground/yaml/depth/yaml-multiline-chomping.yaml"); print(repr(YAML(typ="safe").load(p)["keep"]))'
# Expected: 'one\ntwo\n\n'

# Inspect the default profile selection (cache only), then activate debug:
docker compose -p syntaxiser-tour -f playground/yaml/depth/yaml-profiles-debug.yaml config --services
docker compose -p syntaxiser-tour -f playground/yaml/depth/yaml-profiles-debug.yaml --profile debug config --services

# Replace the published port and reset MODE, preserving KEEP=yes:
docker compose -p syntaxiser-tour \
  -f playground/yaml/depth/compose.base.yaml \
  -f playground/yaml/depth/yaml-override-ports.yaml config

# Validate one nested-property template without AWS:
uv run --project playground/yaml --locked cfn-lint -r us-east-1 \
  -t playground/yaml/depth/yaml-properties-redrive.yaml
```

1. Open `depth/yaml-tags-identifiers.yaml`, `yaml-documents-empty.yaml`, `yaml-merge-nested.yaml` and `yaml-multiline-indent.yaml`. Move to `!!str`, `---`, `<<` and `|2-`. Inspect the separate tags/streams/merge/multiline overviews; foundation files should exclude all ecosystem cards.
2. Copy `yaml-reusable-label.yaml` to a disposable `.github/workflows/label.yml`. Move to `workflow_call.inputs`, `outputs` and its expression. Copy `yaml-composite-greeting.yaml` to `.github/actions/greeting/action.yml`; move between `inputs`, `outputs` and `runs.steps`. These should surface their specific tasks. The full verifier automatically creates and lints matching callers; it never runs the steps.
3. Open `yaml-concurrency-branch.yaml` and `yaml-conditions-summary.yaml` under a disposable `.github/workflows` directory. Move to `cancel-in-progress` and `if`. Read the scheduler/status limits in their overviews; expressions must remain literal when copied.
4. Open `yaml-mapping-retention.yaml`, `yaml-properties-redrive.yaml` and `yaml-composition-join.yaml`. Move to `Mappings`, `RedrivePolicy`, `!FindInMap` and `Fn::Join`. The sidebar should favor the specific CloudFormation tasks, with foundations still available.
5. Open `yaml-build-arguments.yaml`, `yaml-profiles-debug.yaml` and `yaml-override-ports.yaml` with root `services` cues (or use disposable `compose.*.yaml` names). Move to `build.args`, `profiles` and `!override`. Inspect normalization using the commands above; do not start services.
6. Search **yaml tag scalar**, **multidocument yaml**, **folded chomping**, **reusable workflow outputs**, **cloudformation mapping** and **compose profile override**. A concrete relevant task must appear in the first three cards. Also try **local composite action**, **cloudformation intrinsic composition** and **compose override merge**.
7. Make disposable incomplete edits (`profiles: [`, `<<: *`, an unfinished expression); the sidebar must remain usable. Put `workflow_call`, `profiles` or `!FindInMap` into comments/quoted prose/multiline bodies and verify they do not pull in unrelated schemas. Move into a second `---` document and confirm earlier schema cues do not follow it.
8. Copy the entire chomping task, preserving its trailing blank line, and compare the parsed `keep` string with the expected output above. Copy a stream and load with `load_all`; using `load` must reject it. Pin one new task per group, reload, switch to Rust/Python and return: YAML pins remain separate. Browse every new overview in Reference and check official links. The automated extension suite covers literal copying, stored state and language switching; this tour remains the human visual acceptance step.

The primary checkout exposes this entire directory before review. Standalone `uv run ... verify.py` uses `depth/catalog.json` and exact editor fixtures, so it does not depend on merging the extension first.

## Compatibility and limits

YAML 1.2 and YAML 1.1 resolve some plain values differently: `on`, `off`, `yes`, `no`, dates and leading-zero numbers can surprise older readers. Quote ambiguous strings and the workflow `on` key. YAML is only a data format: each ecosystem imposes its own keys, types and evaluation rules. CloudFormation supports a YAML 1.1 subset with intrinsic tags but excludes aliases and hash merges. Compose supports anchors/merge fragments and interprets dollar interpolation separately. Actions supports anchors/aliases; merge keys are not supported. See the [coverage and primary sources](../../docs/yaml-support.md).

Context detection is a bounded lexical fallback, tolerant of incomplete YAML. `.github/workflows/*.yml|yaml`, `compose*.yml|yaml`, `docker-compose*.yml|yaml`, and common `cloudformation`, `cfn` or `template` filenames supply cues. Unknown names can still be detected from root `on` plus `jobs`, `services`, or `AWSTemplateFormatVersion`/AWS resource declarations. Local `action.yml`/`action.yaml` files with a root composite `runs` definition are recognized as GitHub Actions too. Filename cues take precedence. Separate `---` documents use their own content cues. Unusual flow mappings, custom tags, aliases, explicit mapping keys and generated files can have approximate context. This does not replace an editor's YAML/schema diagnostics. Validation proves structure and expressions, not deployment permissions, resource existence, image availability or application behavior. Kubernetes, Terraform/HCL and Dockerfiles are outside this catalog.
