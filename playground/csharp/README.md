# C# / .NET playground

This solution compiles the real C# catalog examples into a reusable library, runs a console report and exposes a local minimal API. xUnit tests use TestServer in process and a fake HttpMessageHandler; no credentials, remote services or listening ports are needed for checks.

Install **.NET SDK 10.0.402** from the [official download](https://dotnet.microsoft.com/en-us/download/dotnet/10.0). global.json selects this exact SDK, net10.0 and C# 14. Dependencies: Microsoft.AspNetCore.Mvc.Testing 10.0.13, xunit 2.9.3, xunit.runner.visualstudio 3.1.4, Microsoft.NET.Test.Sdk 17.14.1. Framework APIs require no separate NuGet dependency. Four committed packages.lock.json files pin restores.

From the repository root, using Node selected with nvm and pnpm:

```sh
node scripts/check-csharp-pack.cjs --generate-only
cd playground/csharp
dotnet --version
dotnet restore Syntaxiser.sln --locked-mode
dotnet build Syntaxiser.sln --no-restore
dotnet test Tests/Tests.csproj --no-build --no-restore
dotnet run --project Console/Console.csproj --no-build --no-restore
```

The equivalent automated command is `pnpm check:csharp`. Set DOTNET_BIN to an absolute dotnet path if it is outside PATH. Generated .catalog/library and .catalog/tests files are disposable outputs from packs/csharp.json, not hand-maintained copies. Regenerate after editing catalog content; catalog-checks.json holds behavior assertions and rejects missing/stale coverage. The script checks every practical card; illustrative overview syntax is intentionally generic, not a complete compilation unit.

Console output is Ada: 5, coffee: 4, tea: 3 and a JSON tea order. Test output must report zero failures. For a listening local API run `dotnet run --project Api/Api.csproj --no-build --urls http://127.0.0.1:5086`. GET /health returns JSON status ok; POST /orders with {"name":"tea","quantity":3} returns 201 with Location /orders/1; blank names or nonpositive quantities return 400 validation problems; malformed JSON returns 400; GET /unavailable returns a stable 503 problem. Stop with Ctrl+C. /orders/1 is an illustrative Location, not a persistence route.

## Manual extension checks

1. Install the review VSIX and reload the existing VS Code workspace. Open this folder's generated .catalog/library/csharp-json.cs and the Syntaxiser sidebar. Place the cursor on JsonSerializer.Deserialize: a practical JSON example and separate JSON topic should appear. Try the JsonSerializer using directive and then an unrelated assignment; the unused import must not keep JSON as the focused topic.
2. Open csharp-linq.cs, csharp-nullable.cs, csharp-async.cs and csharp-async-dispose.cs. Move onto GroupBy, ??, Task.Delay and await using. Confirm matching contextual examples. In a disposable copy, leave braces/strings incomplete and move between class/method bodies; the sidebar must keep updating without errors. Put API names inside comments, verbatim and raw strings: literal text must not drive topics.
3. Search nullable value, linq group, async cancellation, dispose resource, json deserialize, minimal api and xunit theory. Each query should lead with its focused task. Clear search to resume cursor context. Browse all three Reference groups: overviews have syntax/rules/official references and differ from solved practical examples.
4. Open Api/Program.cs, .catalog/library/csharp-api-validation.cs and .catalog/tests/csharp-xunit-theory.cs. Check MapGet/MapPost and Theory cues. Select/copy a practical card and an overview: text must match exactly, with C# highlighting and no explanation added to copied code.
5. Pin JSON and xUnit cards, switch to Rust/TypeScript, then return to C#. Pins retain C# highlighting and identity across reload. Search remains scoped to the selected language. In Lesson Browser mark csharp-greeting done, add a custom task, reload and check status, category/difficulty filters, hide-done and reset. Snippets contain no implementation scaffolding.
6. Run the commands above. For lessons, create separate files or disposable projects; do not edit generated snippets, which regeneration replaces. Follow the [tooling guide](tooling.md) for layout and [coverage/limits](../../docs/csharp-support.md) for supported features.
