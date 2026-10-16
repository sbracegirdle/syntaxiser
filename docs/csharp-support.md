# C# and .NET support

Open .cs files for C# Context, Search, Reference and Pins. The offline catalog contains **25 practical examples**, **25 separate syntax/API overviews**, three reference groups and ten progressive lessons. Tooling is in the [separate .NET guide](../playground/csharp/tooling.md).

| Area | Coverage |
| --- | --- |
| Language | Types/variables, nullable values/references, control flow, methods, classes/properties, interfaces, records, generics, collections, patterns |
| Standard library | LINQ grouping and transformations, exceptions, async/await and cooperative cancellation, synchronous/asynchronous disposal, UTF-8 files, System.Text.Json validation/round trips, reused HttpClient with status/cancellation handling |
| ASP.NET Core | Minimal JSON routes, explicit field validation, Created/400/503 responses, problem details and in-process request tests |
| xUnit | Fact, Theory/InlineData boundaries, synchronous exceptions and awaited async cancellation assertions |

Search **nullable value**, **linq group**, **async cancellation**, **dispose resource**, **json deserialize**, **minimal api** and **xunit theory**. Context results favor task examples; Reference opens independently authored language/API syntax. Every topic includes official learning links.

## Versions and validation

The [runnable playground](../playground/csharp/README.md) pins SDK **10.0.402**, target **net10.0**, **C# 14**, ASP.NET runtime/testing **10.0.13**, xunit **2.9.3**, xunit.runner.visualstudio **3.1.4**, Microsoft.NET.Test.Sdk **17.14.1**. SDK selection rejects roll-forward and preview releases; NuGet direct versions and transitive lockfiles make restore repeatable. Nullable analysis and warnings-as-errors are enabled. System.Text.Json, HttpClient, LINQ and ASP.NET hosting come from the framework; no JSON package is required. Validation is explicit and does not depend on Microsoft.Extensions.Validation.

`pnpm check:csharp` regenerates compilation units from **all 25 actual card snippets**, builds library/console/API/tests, executes 21 behavior checks plus the catalog's real Fact/Theory/API tests and extra malformed-request tests, then runs the console. Requests run through TestServer or an injected HttpMessageHandler; there is no external HTTP service. Checks verify sorted totals, record equality/copy, empty and missing files, UTF-8, JSON errors/domain validation, cancellation and cleanup, HTTP failure status, validation bodies and public error responses. `pnpm test` checks retrieval, import/cursor extraction, incomplete edits, scope, hiding literal/comment cues, highlighting/literal copy, pins, switching languages and lesson persistence along with existing regressions.

The ten lessons span all five difficulty levels: greetings/clamp, nullable values/records, tests/files, LINQ/cancellation, API/report capstones. Stable csharp-* IDs preserve progress. Lesson snippets are empty; instructions contain goals, prerequisites and expected outcomes outside snippets, coordinating the starter path with #36.

## Context limits

This tolerant lexical adapter is not a Roslyn parser. It masks comments, character and regular strings, interpolated/verbatim strings and raw strings while retaining offsets; interpolation bodies are masked as a whole. It recognizes using/alias/global/static directives, namespace/type/method/constructor/accessor/lambda braces and incomplete edits. VS Code symbols refine scope when available. Alias paths reinforce APIs used on the current line; unused imports do not determine the focus. Normal namespace imports are recorded and explicit API names drive contextual matches.

It does not resolve variable types, overloads, extension methods, conditional compilation or arbitrary raw-string delimiter edge cases. Top-level statements may use module/block scope. Semantic compiler errors and nullable warnings belong to the C# tooling. Examples are reusable types intended for a caller or test, with shared OrderExample and ClampExample dependencies, rather than standalone applications. EF Core, authentication/middleware, desktop/mobile UI, advanced LINQ providers and exhaustive framework coverage are follow-ups.

## Official sources

- [C# language](https://learn.microsoft.com/en-us/dotnet/csharp/), [nullable references](https://learn.microsoft.com/en-us/dotnet/csharp/nullable-references), [LINQ](https://learn.microsoft.com/en-us/dotnet/csharp/linq/) and [async programming](https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/).
- [System.Text.Json](https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/deserialization), [HttpClient ownership](https://learn.microsoft.com/en-us/dotnet/fundamentals/networking/http/httpclient-guidelines), [async disposal](https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/implementing-disposeasync).
- [Minimal APIs](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis?view=aspnetcore-10.0), [in-process testing](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0), [xUnit v2](https://xunit.net/docs/getting-started/v2/getting-started), [.NET SDK download](https://dotnet.microsoft.com/en-us/download/dotnet/10.0).
