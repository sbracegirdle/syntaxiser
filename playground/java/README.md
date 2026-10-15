# Java 21 playground

The playground compiles **the actual 25 displayed practical snippets** from `packs/java.json`, adds 20 focused behavior checks, and runs the two JUnit examples and Spring MVC request tests. All checks use local temporary files, owned executors and in-process HTTP. No account, database or external service is needed. Dependency downloads need internet on first use; Maven can work offline once its cache is populated.

## Pinned toolchain and dependencies

- Eclipse Temurin JDK **21.0.8+9**, Java language/release **21**, no preview flags (`.java-version` records the validated patch).
- Apache Maven **3.9.11**.
- Spring Boot **3.5.7**, including web, validation and test starters.
- Jackson BOM/databind **2.19.4**; JUnit Jupiter/params **5.13.4**.
- Other transitive versions come from the fixed Spring Boot parent POM, not floating version ranges.

Install the matching JDK from [Adoptium](https://adoptium.net/temurin/releases/?version=21) and Maven from [Apache](https://maven.apache.org/download.cgi), following their platform instructions. Set `JAVA_HOME` to that JDK and add `$JAVA_HOME/bin` and Maven's `bin` to `PATH`. Check `java -version` and `mvn -version`; both must report Java 21. These versions document reproducible learning fixtures, rather than a claim that they are the latest production releases.

From the repository root:

```sh
source "$NVM_DIR/nvm.sh"
nvm use
pnpm install --ignore-scripts --lockfile=false
pnpm check:java
pnpm test
```

If Maven is not on PATH, set `MAVEN_BIN=/absolute/path/to/apache-maven-3.9.11/bin/mvn` for `pnpm check:java`. The check generates sources before invoking Maven. **30 JUnit invocations** verify scalar output, empty/boundary cases, record equality/preconditions, generic copies, insertion/sort order, resource cleanup, UTF-8, failed async work, JSON round-trips/malformed/unknown fields, Jakarta constraints and HTTP status/body behavior. `catalog-checks.json` contains checks, never substitute implementations. Each new practical card must have a check or be explicitly exercised by JUnit/MockMvc.

## Run the application

After `pnpm check:java`, run the console tour:

```sh
mvn -f playground/java/pom.xml spring-boot:run -Dspring-boot.run.arguments=--console
```

Output includes `Ada: 5 (pass)`, `{red=2, blue=1}`, `Guest`, an order record, `worker total: 21`, and the tour's `{coffee=4, tea=3}`. To start the local API instead:

```sh
mvn -f playground/java/pom.xml spring-boot:run -Dspring-boot.run.arguments=--server.address=127.0.0.1
curl -i http://127.0.0.1:8080/orders/sample
curl -i -H 'Content-Type: application/json' -d '{"name":"tea","quantity":3}' http://127.0.0.1:8080/orders
curl -i -H 'Content-Type: application/json' -d '{"name":"tea","quantity":0}' http://127.0.0.1:8080/orders
```

Expect 200 and sample JSON, 201 and quantity 3, then 400 with `{"error":"invalid order"}`. Name `reserved` returns 409 with `{"error":"unavailable name"}`. The API echoes values and stores nothing. Stop with Ctrl+C. Choose another local port with `--server.port=8081` if needed. The automatic tests never start a listener.

## Manual extension walkthrough

1. Run `pnpm test`, press F5 in this repository's extension workspace, and open Syntaxiser in the Extension Development Host. Alternatively package/install the VSIX as described in the project README and reload VS Code.
2. Open `playground/java/src/main/java/syntaxiser/playground/ContextTour.java`. Java context should activate even without a Java language server. Place the cursor on `Collectors.groupingBy`, `Optional.ofNullable`, `ObjectMapper`, `readValue`, `record`, and the import lines. Expect practical Java examples first, with separate quick references below. At a neutral line an unused import must not become a focused topic.
3. After `pnpm check:java`, open `playground/java/target/catalog/main/syntaxiser/playground/SpringEndpointExample.java`, `SpringErrorsExample.java`, and the test source `target/catalog/test/syntaxiser/playground/SpringTestsExample.java`. Move between controller annotations, validation annotations, error handlers and MockMvc calls. Also inspect the generated parameterized JUnit example.
4. In Search try **close resource**, **stream group**, **optional value**, **jackson json**, **junit parameterized**, **spring boot endpoint**, **spring validation**, and **spring request test**. Each should show a focused practical card first. Open Reference and browse all six groups; the overviews should differ from the examples and include official links.
5. Copy a Java example and select/copy highlighted text manually. Text must retain imports, quotes and angle brackets. Pin a Java card, switch to a Rust, Python or TypeScript file, then return; the pin retains Java highlighting. Search should use the selected language's catalog.
6. In Lesson browser find ten Java tasks spanning difficulty 1–5. Track one, add a personal task and reload. Verify Java progress and pins persist independently from Rust. Lesson snippets must contain no solutions/scaffolding; the built-in tasks intentionally have empty snippets. The broader content expansion remains in #36.
7. Add comments, escaped strings, chars and a multiline text block mentioning `ObjectMapper` or `RestController`. Their contents must not promote those topics. Type an unfinished method, constructor or lambda and confirm the sidebar stays usable; delete closing braces and try again.

## Project layout and tooling

See the separate [Maven tooling guide](tooling.md) for generated library/application/test sources, build/run/test commands and package layout. See [coverage and limitations](../../docs/java-support.md) for the supported language/API baseline and official sources. `target/` is disposable; never edit generated snippets as your source of truth. To add personal tests, use `src/test/java/syntaxiser/playground/` and keep them separate from generated files.
