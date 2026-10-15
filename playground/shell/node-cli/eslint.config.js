export default [
  { ignores: ["dist/**", "src/**/*.ts", "node_modules/**"] },
  {
    files: ["**/*.js", "**/*.mjs"],
    rules: { "no-debugger": "error", "no-unreachable": "error" },
  },
];
