# Cleaning up shipped work

Run maintenance from an isolated worktree, with Node selected by `nvm use` and GitHub authenticated through `gh auth setup-git`. Keep `main`, `integration`, open PRs and the primary checkout available for review. Managed Codex worktrees must be archived through Codex's archive tool from their owning chat; the script only removes legacy checkouts beneath the primary repository's `.worktrees/` directory.

```sh
node scripts/cleanup-shipped.cjs                        # inspect only
node scripts/cleanup-shipped.cjs --apply                # archive, remove eligible worktrees/local branches
node scripts/cleanup-shipped.cjs --apply --delete-remote # also delete eligible origin branches
```

Repeat the inspection after an apply run: removing obsolete checkouts may release symlink dependencies between them. Stop when no eligible work remains.

The script fetches origin and reads all PR states before making a plan. A commit is shipped if it is an ancestor of `origin/main`, or the branch and exact head match a PR merged into main whose merge commit is present on `origin/main`. This handles squash merges without treating subsequent local commits as shipped. Open PR branches remain protected even if an earlier PR on the same branch was merged. Unknown or unmerged work stays in place.

Removal excludes dirty/untracked, locked, current and primary checkouts, protected branches, managed worktrees and worktrees targeted by symlinks from existing checkouts. This preserves primary-playground shortcuts. A retained worktree also protects its branch locally and on origin. Missing worktrees are not traversed. To inspect stale administrative entries separately, run `git worktree prune --dry-run`; run `git worktree prune` only after checking that the listed checkouts are actually gone and no external disk is temporarily unavailable.

Each apply run creates a private timestamped folder beneath `~/archive/`. It verifies a Git bundle of all refs before deletion and creates and lists a full compressed archive of each removed checkout, including ignored files, dependencies, local build outputs and the `.git` pointer. Symlinks are archived as links, without copying their external targets. Ordinary worktree removal is used without force; changed heads or local files stop the run. Branch deletion checks the recorded object ID, and remote deletion uses a matching lease. The incremental `report.json` records the baseline, plan, retained reasons and completed operations; a partial failure leaves backups intact and can be inspected before rerunning.

To recover a branch, inspect the bundle then fetch its recorded ref into a new name:

```sh
git bundle list-heads ~/archive/syntaxiser-cleanup-*/repository.bundle
git fetch /absolute/archive/repository.bundle refs/heads/codex/old-task:refs/heads/recovered/old-task
git worktree add /tmp/recovered-task recovered/old-task
```

Select one exact bundle path when more than one exists. Extract a checkout archive into a separate recovery directory to inspect ignored files. Its saved `.git` file points to removed administrative metadata: do not use it as an active checkout. Copy needed files into the newly created recovery worktree instead. Verify any external symlink targets separately. Do not delete archives until their recovery value has been reviewed.

After human approval and merge, repeat the dry run and archive the owning managed Codex worktree through the app. Keep unmerged PRs and their feedback monitors intact. This maintenance changes no extension behavior; `pnpm test` verifies the cleanup guards alongside the existing extension suite.
