# Shell playground

Run this self-contained Bash tour from the repository root:

```sh
bash playground/shell/main.sh
```

Requires Bash and common Unix tools (`mktemp`, `sort`, `uniq`, `find`, `wc`). It demonstrates quoting, environment variables, redirects, pipes, conditions, and loops. It writes only to a temporary directory and removes it on exit. The terminal catalog targets Bash/Zsh-style commands; this executable tour specifically uses Bash.

## AWS CLI offline tour

With [AWS CLI v2 installed](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html), run:

```sh
bash playground/shell/aws.sh
```

This parses options and generates input templates for 14 representative service commands with `--generate-cli-skeleton input`, then runs a JMESPath projection on generated EC2 sample output. It uses dummy credentials, empty configuration files and a loopback-only endpoint. It requires no account and makes no AWS API calls. Input template generation checks command/option availability, not parameter semantics, IAM permissions, resource existence, real service responses or every example. Verified with AWS CLI **2.38.1**; generated skeletons can change between versions. Only the EC2 example uses an output skeleton because some other CLI v2.38.1 generated responses fail their own model constraints.

The catalog targets AWS CLI v2 with Bash/Zsh quoting. Live service examples require your own authenticated profile, permissions, region and resources; sample names and account IDs must be replaced. SSO needs IAM Identity Center setup; ECR login needs Docker; SSM sessions need the Session Manager plugin; kubectl is separate from the EKS CLI. Examples explain writes and sensitive output; S3 sync/upload and CloudFormation/EKS changes start with preview flags where supported.

## Manual extension test

1. Install the integration VSIX, reload VS Code, close the old terminal, and create a new **Zsh** integrated terminal so the live hook loads.
2. Open Syntaxiser's Context tab. Type `git` and pause without Enter: only Git examples and up to two Git quick references should appear.
3. Add ` diff` and pause: Git status/diff should lead. Clear the line with Ctrl-U: general terminal examples should return.
4. Type `cargo test` or `go test` without executing: matching tool examples should lead. These tools are not needed for this typing test.
5. Run `bash playground/shell/main.sh`. It should print sorted fruit, the temporary file, a count of three lines, and a completion message.
6. Search `TypeScript`, browse the Terminal reference, and pin an example. Move the cursor in a Rust or Go file: editor suggestions should resume while the pin remains.
7. In a terminal without the Zsh hook, execute `git --version` with VS Code shell integration enabled: executed-command suggestions should still work. Other shells currently do not have live input suggestions.

The live hook reports recognized tool/subcommand cues only; arguments and raw input are not written. A focus-only return to an already selected terminal may need **Syntaxiser: Use Active Terminal Context**.

## Manual AWS extension test (no account needed)

1. In a new Zsh terminal, type `aws` without Enter: AWS command/help content should appear.
2. Type `aws s3 sync ./dist/ s3://example/ --dryrun` without Enter: the sync preview and S3 sync overview should lead. Change to `aws logs tail` or `aws lambda invoke`: the matching service should lead.
3. Type `aws --profile private --region ap-southeast-2 ec2 describe-instances` without Enter: EC2 inventory should lead. Profile/region values and resource arguments are discarded from contextual cues.
4. Search `SSO login`, `S3 backup`, `JMESPath`, `AWS pagination`, `partition key`, `aws ecr`, and `aws secretsmanager`. Check practical examples and separately authored overviews.
5. Browse Reference → **AWS CLI: setup and data** and **AWS CLI: common services**. Open S3 sync, DynamoDB and Lambda overviews, then pin a practical AWS example and switch to an editor.
6. Run the offline tour above with shell integration enabled. It must finish without credentials or cloud access. In a Bash terminal, `aws --version` should also select AWS help content after execution.
7. In a shell-script editor, place the cursor on `aws dynamodb query --table-name example` and then `aws ssm get-parameter --name /private`. The correct service examples should lead.

## Node and TypeScript CLI tour

With nvm loaded, select the repository runtime and install the pinned fixture tools:

```sh
nvm use
pnpm --dir playground/shell/node-cli install --frozen-lockfile --ignore-scripts
bash playground/shell/node-cli/tour.sh
```

Verified with Node **26.3.0**, npm **11.16.0**, pnpm **11.21.0**, TypeScript **5.9.3**, ESLint **10.12.0**, Prettier **3.9.10**, Vitest **5.0.4**, and Vite **8.3.4**. The catalog's Node runtime examples target **Node 22+**; use the fixture's actual dependency engine requirements (ESLint 10 requires Node 20.19+/22.13+/24+) rather than assuming every Node 22 patch supports every tool. Package-manager recipes target npm/pnpm **11**. ESLint examples use flat config; TypeScript linting additionally requires a configured parser/plugin. Coverage requires a provider matching Vitest's version.

Installation downloads dependencies; the tour itself runs locally without registry access. It compiles TypeScript, checks JS syntax, executes Node tests/name filters, inspects effective config and module resolution, lints JavaScript, checks TypeScript formatting, runs Vitest, builds a Vite app, builds referenced composite projects, filters a pnpm workspace with dependencies, runs recursive checks and an npm workspace build, then inspects dependency trees. Generated output stays in ignored dist directories and tsbuildinfo files. These are runnable tooling fixtures, separate from lessons. Vite's build replaces the fixture's top-level dist after the Node tests; rerun the tour from the beginning to restore it.

Long-running commands and registry operations are not executed by the tour. It does not validate advisory results, migrations, package installation scripts, debugger attachment or every possible flag combination. For optional checks in this disposable fixture:

- Run `pnpm exec tsc --project tsconfig.json --noEmit --watch`, edit `src/math.ts`, observe a diagnostic, restore it and stop with Ctrl-C.
- Run `pnpm exec vite --host 127.0.0.1`, open the displayed local URL and confirm the page says 5. Stop with Ctrl-C. Run `pnpm exec vite build` followed by `pnpm exec vite preview --host 127.0.0.1` to inspect the built page.
- After `pnpm run build`, run `node --inspect-brk=127.0.0.1:9229 dist/math.js`; attach VS Code's Node debugger on port 9229, continue, then stop. Use loopback only.
- In a throwaway project, try the catalog's add/remove/update/audit and package preview examples with the appropriate lockfile. They may access the registry, run lifecycle scripts and change manifests. Review those changes. Do not run publication commands.

### Manual Node/tooling extension test

1. Install the integration VSIX, reload VS Code, and create a **new Zsh terminal**. No tooling installation is needed just to type commands.
2. Type `pnpm add`, `pnpm why`, `npm audit`, and `npm pack` without Enter. Each should lead with dependency management, tree inspection, advisory checks, and package-content preview respectively.
3. Type `node --test`, `node --watch`, and `node --inspect-brk=127.0.0.1:9229`. Check focused runner, watcher and debugger suggestions; arbitrary entry filenames should not affect ranking.
4. Type `pnpm exec tsc --build`, `tsc --project private.json --showConfig`, `pnpm exec eslint`, `npx --no-install prettier`, `npm exec -- vitest run`, and `pnpm exec vite build`. Check the matching example and independently authored overview.
5. Type `pnpm --filter private run build` and `npm --workspace=private run build`. Workspace suggestions should appear; selector values are discarded. Multiword quoted selectors and options after the subcommand can fall back to generic cues.
6. Search **dependency tree**, **script arguments**, **TypeScript watch**, and **test coverage**. Browse both Node/tooling reference groups, open an overview, pin an example and switch to an editor. Pins should remain available.
7. In a shell-script editor, put the cursor on `node --test test/math.test.mjs` or `pnpm exec vite build`. In Bash with VS Code shell integration, execute `node --version` and then the local tour to exercise executed-command suggestions. Clearing Zsh input should restore general terminal examples.

## Bounded offline coverage audit

From the repository root, load nvm and install the fixture once:

```sh
source ~/.config/nvm/nvm.sh
nvm use
pnpm install --ignore-scripts
pnpm --dir playground/shell/node-cli install --frozen-lockfile --ignore-scripts
pnpm check:shell
# Direct launcher, including the primary checkout linked playground:
node playground/shell/audit.cjs
pnpm audit:runtime shellscript > /tmp/syntaxiser-runtime-shell.json
```

The checks require the pinned Node **26.3.0**, pnpm **11.21.0**, the fixture versions listed above, Bash, Git, and GNU coreutils/findutils. They run without installing packages or contacting registries. AWS CLI v2 is optional; the report always records its version or `unavailable` reason. If installed, only `aws.sh`'s offline model/skeleton tour runs, with dummy credentials and a loopback-only endpoint. No auth, publish, cloud write, or live resource examples run. AWS model generation is not behavioral evidence for catalog cards.

The runner reports separate `bash`, `node-cli` and optional `aws` families, retaining successful and failed families even when another fails. Missing tools, mismatched pinned versions or absent frozen fixture dependencies are `unavailable`; assertion errors, command failures, timeouts and excessive output are `failed`. A missing optional AWS CLI does not fail the required Bash/Node checks; an installed AWS CLI's failed offline tour does. `check:shell` exits 0 for passing required checks, 2 for unavailable required prerequisites, and 1 for failures. `audit:runtime` exposes these details under `families` and exits nonzero for a failed/unavailable context.

Commands have bounded execution/output and terminate their process groups on Linux. The Node tour runs in a temporary copy, linking installed tools without downloading anything. Bash fixtures include paths with spaces and disposable Git indexes. All generated files are removed on success and failure. The source fixture stays unchanged. GNU tool versions are reported explicitly; BSD utility variants and Windows process cleanup are not validated by this runner.

### Inspected evidence map

Only the following practical cards receive behavioral registrations, because the runner reads their exact `code` from `packs/shellscript.json`. The unchanged catalog retains other unknown-evidence findings.

| Card | Happy assertion | Edge assertion | Error/recovery assertion |
| --- | --- | --- | --- |
| `quoting` | Exact output is one line, `my project` | Not registered: the card assigns a fixed value | Not registered |
| `loops` | A filename containing spaces remains one output line | An empty `src` directory produces no output, skipping the unmatched glob | Not registered |
| `pipes` | Disposable Git index: 25 names become the first 20 sorted names | An empty index produces empty output | Outside a repository, `pipefail` preserves Git's failure despite successful downstream tools |
| `node-test` | Real built-in Node tests pass | A nonmatching name filter succeeds with zero selected tests | A deliberately wrong arithmetic assertion fails |

The Bash tour and Node tooling tour are additional fixture checks, not per-card equivalents. Independent Bash fixtures assert an empty quoted value, a failing pipeline that stops before a success marker, and trap cleanup after that failure. Unit regressions check temporary cleanup on thrown errors, command timeouts, missing tools and preservation of an early family failure. A catalog-only quoting mutation must fail its exact-output assertion.

For manual audit diagnostics, temporarily hide AWS CLI from PATH: only its family should become unavailable. With the Node fixture dependencies absent, `node-cli` must be unavailable while Bash still runs. Restore tools/dependencies and rerun: Bash and Node should pass, with AWS either passing or explicitly unavailable. Use the cursor/search/copy/pin/reference/language-switch walkthroughs above to test the extension; this ticket changes audit tooling, not the catalog UI.

Primary references: [Bash pipelines and exit status](https://www.gnu.org/software/bash/manual/html_node/Pipelines.html), [Bash quoting](https://www.gnu.org/software/bash/manual/html_node/Quoting.html), [Node built-in test runner](https://nodejs.org/docs/v26.3.0/api/test.html), [AWS CLI skeleton limits](https://docs.aws.amazon.com/cli/latest/userguide/cli-usage-skeleton.html).
