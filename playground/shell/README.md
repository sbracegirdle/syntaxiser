# Shell playground

Run this self-contained Bash tour from the repository root:

```sh
bash playground/shell/main.sh
```

Requires Bash and common Unix tools (`mktemp`, `sort`, `uniq`, `find`, `wc`). It demonstrates quoting, environment variables, redirects, pipes, conditions, and loops. It writes only to a temporary directory and removes it on exit. The terminal catalog targets Bash/Zsh-style commands; this executable tour specifically uses Bash.

## Manual extension test

1. Install the integration VSIX, reload VS Code, close the old terminal, and create a new **Zsh** integrated terminal so the live hook loads.
2. Open Syntaxiser's Context tab. Type `git` and pause without Enter: only Git examples and up to two Git quick references should appear.
3. Add ` diff` and pause: Git status/diff should lead. Clear the line with Ctrl-U: general terminal examples should return.
4. Type `cargo test` or `go test` without executing: matching tool examples should lead. These tools are not needed for this typing test.
5. Run `bash playground/shell/main.sh`. It should print sorted fruit, the temporary file, a count of three lines, and a completion message.
6. Search `TypeScript`, browse the Terminal reference, and pin an example. Move the cursor in a Rust or Go file: editor suggestions should resume while the pin remains.
7. In a terminal without the Zsh hook, execute `git --version` with VS Code shell integration enabled: executed-command suggestions should still work. Other shells currently do not have live input suggestions.

The live hook reports recognized tool/subcommand cues only; arguments and raw input are not written. A focus-only return to an already selected terminal may need **Syntaxiser: Use Active Terminal Context**.
