// A direct launcher also works from the primary checkout's linked playground.
require('../../scripts/check-shell-pack.cjs').main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
