const fs = require('node:fs');
const path = require('node:path');

// Validation consumes reviewed locks. Regeneration is an explicit maintenance action.
function prepareLock(lock, directory, { updating = false, offline = false, cargo }) {
  const destination = path.join(directory, 'Cargo.lock');
  if (fs.existsSync(lock)) fs.copyFileSync(lock, destination);
  else if (!updating) throw new Error(`Missing recipe lock ${lock}: run with --update-lock`);
  if (updating) {
    cargo(['generate-lockfile', ...(offline ? ['--offline'] : [])], directory);
    fs.mkdirSync(path.dirname(lock), { recursive: true });
    fs.copyFileSync(destination, lock);
  }
}

module.exports = { prepareLock };
