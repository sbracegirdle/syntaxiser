# Local extension publishing

The pipeline is local: no GitHub Actions, hosted build, token file, automatic version bump, Git tag, GitHub release or Marketplace upload occurs during preparation. Preparing this pipeline does **not** publish Syntaxiser. Publishing is a separate human decision.

## One-time publisher setup

1. Sign in to [Visual Studio Marketplace publisher management](https://marketplace.visualstudio.com/manage). Create or obtain access to the intended publisher. The manifest currently names `syntaxiser`; confirm you control that exact ID before the first release. Its availability and your permissions have not been verified by this pipeline. If necessary, change `publisher` in `package.json`, commit it, and prepare again. The public identity will be `publisher.syntaxiser`.
2. Choose browser upload (no CLI token needed), or configure CLI authentication below. GitHub's `gh` authentication does not authorize the Microsoft Marketplace. Open VSX is a separate registry and is outside this workflow.
3. Install nvm and pnpm, and add the repository to your existing VS Code workspace. The root `pnpm-lock.yaml` is the canonical development lockfile; use frozen installs. Language playground locks remain independent.

## Prepare a reviewable artifact (no credentials)

Choose a new stable `x.y.z` version in `package.json` and add its release notes to `CHANGELOG.md` (create it for the first public release). Commit these changes and the dependency lock before preparation. The current `0.4.3` version is a development baseline, not a verified available Marketplace version. Check the publisher page before deciding to use it.

```sh
source ~/.config/nvm/nvm.sh
nvm install
nvm use
pnpm install --frozen-lockfile --ignore-scripts
pnpm release:prepare
```

The command requires a clean checkout, including untracked files, and the exact Node version in `.nvmrc`. It uses the committed lockfile, removes old compiled output, runs `pnpm test`, `pnpm audit:coverage --check` and `node scripts/lesson-coverage.cjs --check`, then packages with the locked `vsce`. It inspects the resulting ZIP against an explicit runtime-file policy and checks that every source catalog is included. Existing `vsce` package checks, including its secret scan, remain enabled. No credentials are required; publishing credentials are stripped from preparation subprocesses. Dependency installation can access the package registry if the local cache is incomplete.

Outputs in the ignored `.release/` directory:

- `syntaxiser-<version>.vsix`: the installable extension.
- `release.json`: source commit/branch, tool versions, completed checks, included files and SHA-256 checksum. A failed preparation invalidates the previous receipt. Keep the receipt with the reviewed artifact privately; it is provenance, not a cryptographic signature or a general secret-scanning guarantee.

The file policy permits compiled JavaScript, catalog JSON, runtime media, manifest, README, license, third-party notices and an optional changelog. Development files, worktrees, environment files, lockfiles and release output must not ship. If a future runtime asset needs another path, update the policy deliberately and inspect the archive before release. Never place secrets in runtime files, Markdown or catalog content.

Inspect `release.json`, compare its commit with the intended release, and confirm the manifest's publisher, version, VS Code engine range, license and repository. Check the packaged README/links/images and release notes in the actual archive. The manifest's version must be unused; the script does not query version availability or reserve a publisher.

Install the reviewed VSIX locally:

```sh
code --install-extension .release/syntaxiser-0.4.3.vsix --force
```

Replace `0.4.3` with the selected version. Reload VS Code when prompted, open a supported source file, verify Context/search/Reference/Lessons/Pins, copy a snippet, and switch languages and terminals. Use the existing [language playground walkthroughs](language-support.md) for content-specific checks. Installation affects only your local editor and does not publish. Release preparation does not rerun every language's separately provisioned runtime suite; run the relevant `pnpm audit:runtime <language>` checks when release changes affect that language, and review their evidence separately.

Preparation works on a clean feature branch for PR review. Actual CLI publishing requires **clean `main` at the same commit as the receipt**. After merging a PR, fetch and fast-forward main, prepare again, and review the new checksum/artifact. An integration build is for manual testing, never a Marketplace release candidate for this command.

## Publish later: browser upload

This is the simplest route without storing CLI credentials. After human approval, open [publisher management](https://marketplace.visualstudio.com/manage), select the confirmed publisher and use **New extension → Visual Studio Code** for a first release, or the existing extension's update action for a new version. Select the exact reviewed VSIX. Browser upload bypasses the script's guards, so check its SHA-256 against the receipt and confirm source/version manually before submitting.

## Publish later: explicit local CLI command

The script uploads the existing reviewed VSIX via `vsce publish --packagePath`; it does not rebuild, change the version, create a commit or tag. It requires the exact identity and a checksum you copy from the reviewed receipt. It rejects dirty source, non-main branches, stale receipts, changed bytes, missing credentials and unexpected packaged files. No user-supplied `vsce` flags are forwarded.

For a PAT, create a short-lived Marketplace **Manage** token following [Microsoft's publishing instructions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#get-a-personal-access-token). Grant only the publishing permission required. In a private interactive zsh terminal, read it without echo or shell-history storage; do not put it in a command argument, `.env`, source, issue, PR or recording:

```sh
read -rs 'VSCE_PAT?Marketplace token (hidden): '; print
export VSCE_PAT
pnpm release:publish --confirm syntaxiser.syntaxiser@0.4.3 --sha256 REPLACE_WITH_REVIEWED_64_CHARACTER_SHA256
unset VSCE_PAT
```

Replace the identity/version and checksum before executing. The token is inherited by the publishing subprocess only, never placed on the command line or written to the receipt. The wrapper suppresses upload child output (including failure bodies) to avoid accidentally printing credentials. Do not enable shell tracing. Always unset the token, including after failures; revoke it when no longer needed. This pipeline does not use `vsce login` or persist a token in `~/.vsce`.

Microsoft's current documentation announces retirement of global Azure DevOps PATs on **1 December 2026** and recommends Microsoft Entra authentication. For an authorized Entra identity configured as a member of the publisher, the locked `vsce` also supports Azure credentials:

```sh
# Authenticate and authorize the intended identity using Microsoft's setup guide first.
unset VSCE_PAT
pnpm release:publish --confirm syntaxiser.syntaxiser@0.4.3 --sha256 REPLACE_WITH_REVIEWED_64_CHARACTER_SHA256 --auth azure
```

This selects `vsce --azure-credential` using its Azure credential chain. It does not create an identity, grant roles or initiate authentication; arrange those privately with your administrator. PAT and Azure modes cannot be combined. Browser upload remains available when local CLI authentication is unsuitable. Follow the current [official authentication guidance](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#secure-automated-publishing-to-visual-studio-marketplace) rather than assuming today's PAT setup will remain supported.

## After upload and failure recovery

Check the publisher dashboard for processing/validation results, confirm the expected version and README on the public listing, then install the Marketplace version in a disposable VS Code profile and repeat the smoke test. Only after successful verification should you create a release tag or GitHub release if desired; those are manual steps outside this script.

If checks or packaging fail, fix the source, commit and prepare again. If upload fails, check publisher access, token expiry and version availability privately. Check the dashboard before retrying after an ambiguous timeout: the upload may have succeeded. The same reviewed bytes can be retried only when that version has not already been published. For a shipped defect, prepare a higher version with the fix; do not delete a release hoping to reuse its version. No automatic unpublish/delete/rollback is included.

## Validation of the pipeline itself

`pnpm test` includes regressions for the no-upload preparation path, failed-check receipt invalidation, file policy, exact-artifact selection, stale source/checksum rejection, authentication selection and suppression of sensitive upload error output. Upload tests use a fake command executor and synthetic tokens; normal tests never invoke a real publishing command. A real `pnpm release:prepare` additionally exercises the locked packaging tool and ZIP inspection. No real publisher authentication or upload has been tested as part of issue #104.

Primary references: [VS Code publishing and packaging](https://code.visualstudio.com/api/working-with-extensions/publishing-extension), [extension manifest](https://code.visualstudio.com/api/references/extension-manifest), [Microsoft's vsce source and CLI](https://github.com/microsoft/vscode-vsce).
