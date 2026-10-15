#!/usr/bin/env bash
set -euo pipefail
scratch=$(mktemp -d)
trap 'rm -rf -- "$scratch"' EXIT
cd "$scratch"
mkdir -p notes/archive
printf 'one\ntwo\n' > 'notes/daily notes.txt'
cp 'notes/daily notes.txt' 'notes/archive/daily notes.txt'
cmp 'notes/daily notes.txt' 'notes/archive/daily notes.txt'
[[ $(wc -l < 'notes/daily notes.txt') -eq 2 ]]
[[ $(COURSE_NAME='Two words' bash -c 'printf "%s" "$COURSE_NAME"') == 'Two words' ]]
[[ ${COURSE_NAME+x} != x ]]
printf 'red\nblue\nred\n' > words.txt
[[ $(sort words.txt | uniq -c | awk '{print $2 "=" $1}' | paste -sd ',' -) == 'blue=1,red=2' ]]
printf 'exit 7\n' > fail.sh
if bash fail.sh; then exit 1; else [[ $? == 7 ]]; fi
mkdir repo
cd repo
git init -q
git config user.name 'Local lesson'
git config user.email 'lesson@example.test'
printf 'first\n' > note.txt
git add note.txt
git commit -qm initial
base=$(git branch --show-current)
git switch -qc feature
printf 'feature\n' > feature.txt
git add feature.txt
git commit -qm feature
git switch -q "$base"
[[ ! -e feature.txt ]]
git merge -q feature
[[ -e feature.txt && -z $(git status --porcelain) ]]
[[ -z $(git remote) ]]
printf 'Shell lesson outcomes passed in disposable workspace.\n'
