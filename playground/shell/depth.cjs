// Works in the repository or the self-contained primary-checkout snapshot.
require('../../scripts/check-shell-depth.cjs').checkDepth().then(result => {
  console.log(JSON.stringify(result, null, 2));
}).catch(error => { console.error(error); process.exitCode = error.unavailable ? 2 : 1; });
