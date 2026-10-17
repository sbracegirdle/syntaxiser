# .NET tooling and layout

These are shell recipes, kept outside C# language syntax cards. Run from playground/csharp after generating catalog sources as described in README.md.

```sh
dotnet --version
dotnet restore Syntaxiser.sln --locked-mode
dotnet build Syntaxiser.sln --no-restore
dotnet test Tests/Tests.csproj --no-build --no-restore
dotnet run --project Console/Console.csproj --no-build --no-restore
dotnet run --project Api/Api.csproj --no-build --urls http://127.0.0.1:5086
```

Library owns reusable core types, JSON/HTTP helpers and route registrations; Console calls the library; Api owns the web entry point; Tests references Api and exercises all projects. Directory.Build.props enables net10.0, C# 14, nullable analysis, implicit standard usings and warnings-as-errors. Sdk.Web supplies ASP.NET Core. The library has a Microsoft.AspNetCore.App framework reference for route helpers. Tests pins xUnit, the VSTest adapter and WebApplicationFactory packages. Program is public partial so tests can select the real entry point.

To practice in a disposable directory with the pinned SDK available:

```sh
dotnet new console --framework net10.0 --name Practice
cd Practice
dotnet run
```

Copy global.json and Directory.Build.props from this playground when practicing outside its directory tree to retain the same baseline. Add handwritten library/test files alongside project files, rather than under .catalog. Projects automatically include those files. After intentionally changing dependency versions, restore without --locked-mode, inspect package lock diffs and rerun all checks before committing. Normal checks always use --locked-mode.

## EF Core SQLite

Library pins Microsoft.EntityFrameworkCore.Sqlite 10.0.13. The catalog models, queries and transaction helpers are generated from exact cards. Tests creates each schema with EnsureCreated on a fresh in-memory relational SQLite connection; this is disposable test setup, not a production migration strategy. For a real application, keep migrations and dotnet-ef tooling in a separate project/workflow, review generated SQL, and test upgrades/rollback on disposable databases. SQLite does not provide SQL Server rowversion; the samples maintain Version explicitly. Normal checks restore the committed locks with --locked-mode.
