# YAML coverage and validation

YAML editors use one catalog with stable `(yaml, cardId)` pins and per-language lesson progress. Search and Reference cover all four areas. Context restricts examples and quick references to foundations plus the detected ecosystem, keeping identical keys from producing unrelated schema advice.

| Area | Examples / separate overviews | Coverage |
| --- | --- | --- |
| YAML foundations | 19 / 10 | Mappings/sequences, scalar tags/types/quoting, streams, multiline/chomping/indentation, alias identity, merge portability, strict validation |
| GitHub Actions | 17 / 13 | Triggers/jobs/needs/matrices, expressions/secrets, permissions/cache/artifacts, reusable contracts, local composite actions, conditions and concurrency |
| AWS CloudFormation | 11 / 8 | Parameters/resources/intrinsics/conditions/outputs, mapping lookups, nested properties, intrinsic composition |
| Docker Compose | 13 / 8 | Services/volumes/networks, interpolation/required values, readiness/completion dependencies, build config, profiles and layered override/reset |

`packs/yaml.json` contains practical task documents; `packs/yaml-reference.json` independently describes syntax and API rules. No schema libraries are loaded by the extension. The highlighter preserves YAML, intrinsic tags and expression text without executing it. The [depth and assertion matrix](yaml-depth.md) maps all 39 topics and 60 tasks to sources, pinned versions and happy/edge/rejection/recovery checks. Five initial lessons have stable IDs, difficulty levels, setup instructions and explicit checks, with empty task snippets and prerequisite links to separate reference/examples; [#36](https://github.com/sbracegirdle/syntaxiser/issues/36) owns subsequent progression.

The [playground](../playground/yaml/README.md) pins Python 3.13.7, ruamel.yaml 0.18.16, actionlint 1.7.12, cfn-lint 1.57.2 and Docker Compose 5.5.1. `pnpm check:yaml` validates every example using the actual schema tools, asserts parsed values and checks normalized Compose environment/dependencies. `pnpm test` covers retrieval, masking, filenames, incomplete edits, language switching, stored state, literal copy text, highlighting and all overview links. Runtime commands, cloud deployments and image pulls are outside these checks. See the playground for reproducible setup and manual cursor/search/pin testing.

Source material was checked on 17 October 2026. Examples target current workflow syntax and the Compose Specification as accepted by the pinned tools; CloudFormation validation uses cfn-lint's bundled us-east-1 schemas. Action references use checkout/setup-node v5 and cache/upload/download-artifact v4; they are illustrative major tags rather than immutable supply-chain pins. No action executes during local validation.

Official learning references:

- [YAML 1.2.2 specification](https://yaml.org/spec/1.2.2/): node types, indentation, scalar styles and resolution.
- [GitHub workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [expressions](https://docs.github.com/en/actions/concepts/workflows-and-actions/expressions), and [anchors/aliases](https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations#yaml-anchors-and-aliases).
- [CloudFormation template anatomy](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-anatomy.html), [YAML 1.1 subset and exclusions](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-formats.html), [intrinsics](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/intrinsic-function-reference.html), and [conditions](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/conditions-section-structure.html).
- [Compose services](https://docs.docker.com/reference/compose-file/services/), [fragments/merges](https://docs.docker.com/reference/compose-file/fragments/), and [interpolation](https://docs.docker.com/reference/compose-file/interpolation/).
- [actionlint](https://github.com/rhysd/actionlint), [cfn-lint](https://github.com/aws-cloudformation/cfn-lint), and [Compose config](https://docs.docker.com/reference/cli/docker/compose/config/).

The lexical context scanner masks comments, quoted values and multiline block bodies while preserving keys, tags and explicit workflow expressions. It uses the current line and enclosing indentation path, omitting old edits and symbol text. This avoids hidden text and previous documents overpowering the current schema. It is not a complete YAML parser; flow mappings, unusual explicit keys and aliases can lose contextual detail. Filename/schema precedence and unsupported ecosystems are documented in the playground.
