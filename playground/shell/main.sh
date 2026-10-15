#!/usr/bin/env bash
# A self-contained tour: only temporary files are created.
set -euo pipefail
scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT

printf 'Shell syntax tour\n'
project='my project'
printf 'Quoted value: %s\n' "$project"
export APP_ENV=development
printf 'Environment: %s\n' "$APP_ENV"

printf 'pear\napple\npear\n' > "$scratch/fruit.txt"
printf '\nSorted unique values:\n'
sort "$scratch/fruit.txt" | uniq
printf '\nMatching files:\n'
find "$scratch" -type f -name '*.txt'

if test -f "$scratch/fruit.txt"; then
  printf '\nLoop over files:\n'
  for file in "$scratch"/*.txt; do
    printf '%s: ' "${file##*/}"
    wc -l < "$file"
  done
fi
printf '\nTour complete. Temporary files will be removed.\n'
