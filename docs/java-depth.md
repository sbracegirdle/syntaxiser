# Java depth expansion and assertion matrix

Issue #76 expands the 25-topic/25-example Java starter catalog to **41 grouped overviews and 69 practical examples**. All original IDs remain; 16 dedicated units add two different tasks each, and existing Optional, concurrency, JUnit, Jackson and Spring units gain 12 further tasks. The six groups, ten lesson identities, pins and progress remain compatible. Lessons retain empty task snippets and now point to relevant expanded prerequisites.

## Scope review

| Requested area | Dedicated overview units |
| --- | --- |
| Enums, expressions, patterns, arrays/varargs | enums-switch, patterns, arrays-varargs |
| Equality, ordering, immutability and collection keys | equality, comparators, immutable |
| Bounds/wildcards, nested types and function composition | generic-bounds, nested-types, functions; retained generics/interfaces |
| Collectors/reduce/flatMap, Optional and deterministic order | stream-reduce; expanded optional; retained stream-group/stream-filter |
| Text, decimal, date/time, UUID and NIO workflows | strings-regex, decimal, datetime, uuid, file-walk; retained files/resources |
| Future composition/recovery, lifecycle/interruption and HTTP | expanded async/threads; http-client |
| JUnit, Jackson and Spring validation/request failures | expanded junit/junit-parameterized, jackson-json/jackson-errors, spring-validation/spring-tests |

## Supported versions and surroundings

The validated baseline remains Temurin **21.0.8+9**, Java **21** without preview features, Maven **3.9.11**, Spring Boot **3.5.7**, Jackson **2.19.4**, and JUnit Jupiter/params **5.13.4**. Every practical card is a complete package-less compilation unit with its required imports. The harness supplies `syntaxiser.playground`; application users supply their own package. The JDK-only rows below need Java 21. JUnit rows need the pinned test dependencies, Jackson rows need the pinned databind dependency, and Spring rows need the pinned web/validation/test starters. `http-json` also needs Jackson and the `RemoteReport` card. JUnit clamp cards need `Clamp`; batch request tests need `BatchController` and `ApiErrors`; the existing request tests need `OrderController` and `ApiErrors`. These relationships are stated on the cards. Tool commands remain in [tooling.md](../playground/java/tooling.md).

## Before/after and independent outcome assertions

Overview IDs below link conceptually to Reference navigation; practical IDs are stable catalog keys. Before counts are from the starter catalog on main. Each assertion group is inspected independently of source registration. `catalog-checks.json` keys become JUnit methods in `CatalogBehaviorTest`; generated test cards carry their own annotated assertions. Controller/advice cards are called through generated MockMvc tests. All fixtures consume exact catalog text, including imports.

| Overview ID / group | Examples before → after; practical IDs | Source / requirement | Asserted happy, boundary and rejection/recovery outcomes |
| --- | --- | --- | --- |
| `types` / Language foundations | 1 → 1; `types` | [Java 21](https://dev.java/learn/language-basics/) | Formatted passing/retry scores; zero is the lower boundary; null names/negative scores reject. |
| `control-flow` / Language foundations | 1 → 1; `control-flow` | [Java 21](https://dev.java/learn/language-basics/) | Even totals; empty and signed/zero values; null arrays reject. |
| `methods` / Language foundations | 1 → 1; `methods` | [Java 21](https://dev.java/learn/classes-objects/) | Interior and clamped values; exact bounds; reversed bounds reject. |
| `classes` / Language foundations | 1 → 1; `classes` | [Java 21](https://dev.java/learn/classes-objects/) | Visits increment per instance; a new counter starts at zero; absent names reject. |
| `interfaces` / Language foundations | 1 → 1; `interfaces` | [Java 21](https://dev.java/learn/interfaces/) | Injected greeting; an empty strategy result remains empty; a failing strategy propagates. |
| `records` / Data and transformations | 1 → 1; `records` | [Java 21](https://dev.java/learn/records/) | Equal/accessed order values; quantity one; blank/null/nonpositive construction rejects. |
| `generics` / Data and transformations | 1 → 1; `generics` | [Java 21](https://dev.java/learn/generics/) | Integers copied into Number list; empty producer leaves target unchanged; unmodifiable consumer rejects. |
| `collections` / Data and transformations | 1 → 1; `collections` | [Java 21](https://dev.java/learn/api/collections-framework/) | Word frequencies and insertion order; whitespace/tab/newline separation; null text rejects. |
| `stream-filter` / Data and transformations | 1 → 1; `stream-filter` | [Java 21](https://dev.java/learn/api/collections-and-streams/streams/) | Sorted positives without input mutation; no positives returns empty; output mutation rejects. |
| `stream-group` / Data and transformations | 1 → 1; `stream-group` | [Java 21](https://dev.java/learn/api/collections-and-streams/streams/) | Duplicate totals in sorted key order; empty list; null grouping key rejects. |
| `optional` / Data and transformations | 1 → 3; `optional`, `optional-lookup`, `optional-lazy` | [Java 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html) | Present/trimmed values; null/blank/missing data; required lookup rejects and failing lazy fallback propagates. Fallback invocation count asserts laziness. |
| `exceptions` / Errors, resources and I/O | 1 → 1; `exceptions` | [Java 21](https://dev.java/learn/exceptions/) | Positive parse; zero rejects domain rule; malformed integers preserve NumberFormatException as cause. |
| `resources` / Errors, resources and I/O | 1 → 1; `resources` | [Java 21](https://docs.oracle.com/javase/tutorial/essential/exceptions/tryResourceClose.html) | First line; empty file returns null; missing file rejects and paths are removed after reader closure. |
| `files` / Errors, resources and I/O | 1 → 1; `files` | [Java 21](https://dev.java/learn/java-io/) | UTF-8 round trip; empty overwrite; missing parent directory rejects. Temp paths are cleaned. |
| `async` / Concurrency | 1 → 3; `async`, `future-compose`, `future-recover` | [Java 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html) | Doubled result and dependent lookup; zero/blank stages; original causes preserved by compose and explicit recovery returns absence. All waits bounded. |
| `threads` / Concurrency | 1 → 3; `threads`, `interrupt-worker`, `executor-failures` | [Java 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html) | Worker total; null task result; failed worker cause observed. Interrupted queue worker exits with flag restored and bounded join; owned executor terminates. |
| `packages` / Language foundations | 1 → 1; `packages` | [Java 21](https://dev.java/learn/packages/) | Static import sorting; empty list; null element rejects. |
| `junit` / Testing and JSON libraries | 1 → 2; `junit`, `junit-lifecycle` | [Java 21 / JUnit 5.13.4](https://docs.junit.org/5.13.4/user-guide/) | Clamp assertions and isolated UTF-8 fixture; empty/new temporary files; reversed bounds and deleted-file read reject. |
| `junit-parameterized` / Testing and JSON libraries | 1 → 2; `junit-parameterized`, `junit-async` | [Java 21 / JUnit 5.13.4](https://docs.junit.org/5.13.4/user-guide/) | Five clamp rows and three MethodSource async parses; exact boundaries/zero; two reversed-bound rows and original async NumberFormatException. |
| `jackson-json` / Testing and JSON libraries | 1 → 2; `jackson-json`, `jackson-tree` | [Java 21 / Jackson 2.19.4](https://github.com/FasterXML/jackson-databind) | Record round trip and typed tree extraction; null values and absent-field default/maximum; malformed/root/type/range rejection via tree card. |
| `jackson-errors` / Testing and JSON libraries | 1 → 2; `jackson-errors`, `jackson-required` | [Java 21 / Jackson 2.19.4](https://github.com/FasterXML/jackson-databind) | Valid record/creator input; minimum quantity and missing/explicit null; malformed, unknown, invalid and null-root rejection. |
| `spring-endpoint` / Spring Boot web APIs | 1 → 1; `spring-endpoint` | [Java 21 / Boot 3.5.7](https://docs.spring.io/spring-boot/3.5/reference/web/servlet.html) | GET body/POST 201; minimum quantity; malformed/constraint failure 400 and reserved-name 409 through exact controller/advice. |
| `spring-validation` / Spring Boot web APIs | 1 → 2; `spring-validation`, `spring-batch` | [Java 21 / Boot 3.5.7](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html) | Bean validation succeeds; quantity one and three nested items; null/missing/empty/oversized batches and invalid/oversized nested elements reject before handler. |
| `spring-errors` / Spring Boot web APIs | 1 → 1; `spring-errors` | [Java 21 / Boot 3.5.7](https://docs.spring.io/spring-boot/3.5/reference/web/servlet.html) | Known error translation; malformed body versus field validation; reserved-name conflict has stable body. Successful requests remain unaffected. |
| `spring-tests` / Spring Boot web APIs | 1 → 2; `spring-tests`, `spring-batch-tests` | [Java 21 / Boot 3.5.7](https://docs.spring.io/spring-boot/3.5/reference/testing/spring-boot-applications.html) | In-process request success/status/body; minimum and maximum batch sizes; malformed/nested invalid 400 and successful request after rejection. |
| `enums-switch` / Language foundations | 0 → 2; `shipping-switch`, `status-switch` | [Java 21](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.11) | Both finite shipping modes and status family labels; statuses 100/599; null enum and out-of-range status reject. |
| `patterns` / Language foundations | 0 → 2; `pattern-name`, `pattern-payload` | [Java 21](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.30) | Type binding and guarded labels; blank/null/zero branches; nontext/negative/unsupported payload rejection. |
| `arrays-varargs` / Data and transformations | 0 → 2; `array-window`, `varargs-total` | [Java 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html) | Copied window and checked invoice total; empty/end-exclusive/zero arguments; oversized window, negative input and overflow reject. Copy mutation leaves source unchanged. |
| `equality` / Data and transformations | 0 → 2; `customer-key`, `array-key` | [Java 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html) | Normalized keys retrieve the same map value and byte digests compare by content; empty digest/non-key comparisons; null/blank inputs reject. Mutating original bytes cannot change key. |
| `comparators` / Data and transformations | 0 → 2; `nullable-sort`, `priority-sort` | [Java 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Comparator.html) | Null-last names and descending priorities; duplicate-name ID ties and empty/single lists; null customers and invalid priorities reject. |
| `immutable` / Data and transformations | 0 → 2; `roster-snapshot`, `read-only-feed` | [Java 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html) | Frozen roster and live view; later source mutations distinguish the policies; structural modification, null snapshot elements and blank publication reject. |
| `generic-bounds` / Data and transformations | 0 → 2; `bounded-largest`, `wildcard-drain` | [Java 21](https://dev.java/learn/generics/) | Largest comparable and wider-consumer drain; singleton/empty queue; empty maximum and rejecting target. Failed destination addition preserves queue head. |
| `nested-types` / Language foundations | 0 → 2; `nested-builder`, `inner-cursor` | [Java 21](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.1.3) | Static configuration builder and enclosing text cursor; defaults/empty text/independent positions; invalid ports and exhausted cursor reject. |
| `functions` / Data and transformations | 0 → 2; `function-pipeline`, `predicate-policy` | [Java 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/Function.html) | Username composition and short-circuit predicates; blank output/too-short name; null transform throws, null/invalid registration rejects without dereference. |
| `stream-reduce` / Data and transformations | 0 → 2; `flatten-tags`, `reduce-cart` | [Java 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Collectors.html) | Flatten/deduplicate and sum/merge totals; empty groups, duplicate SKU and sorted keys; null groups and checked integer overflow reject. |
| `strings-regex` / Data and transformations | 0 → 2; `regex-ticket`, `literal-replace` | [Java 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/regex/Pattern.html) | Whole ticket match and literal replacement; leading zeros and no literal match; oversized/junk tickets and empty needle reject. Dollar replacement remains literal. |
| `decimal` / Data and transformations | 0 → 2; `money-share`, `decimal-key` | [Java 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html) | Rounded share and scale-normalized keys; zero and HALF_EVEN tie; malformed/negative/zero divisor and nonterminating exact division reject. |
| `datetime` / Data and transformations | 0 → 2; `instant-zone`, `strict-date` | [Java 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/ZonedDateTime.html) | UTC-to-zone output and date distance; DST transition, leap day and same-date range; invalid date/zone/reversed range reject. |
| `uuid` / Data and transformations | 0 → 2; `uuid-parse`, `uuid-name` | [Java 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/UUID.html) | Canonical parse and deterministic UTF-8 name IDs; uppercase/zero UUID and label case differences; shortened/invalid UUID and blank label reject. |
| `file-walk` / Errors, resources and I/O | 0 → 2; `walk-reports`, `utf8-lines` | [Java 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html) | Sorted nested reports and UTF-8 line count; empty directory/file; missing paths and malformed lazy UTF-8 reject, streams close on all paths. |
| `http-client` / Errors, resources and I/O | 0 → 2; `http-text`, `http-json` | [Java 21 / Jackson for JSON task](https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpClient.html) | Loopback UTF-8/JSON responses; empty text; 503, malformed/domain-invalid JSON and pre-interrupted synchronous send reject. Server/client/executor closed. |

## Evidence ownership and repeatable checks

[`catalog-fixtures.json`](../playground/java/catalog-fixtures.json) explicitly routes six test cards to test sources and three controller/advice cards to application sources. The other 60 cards have matching entries in [`catalog-checks.json`](../playground/java/catalog-checks.json). [`check-java-pack.cjs`](../scripts/check-java-pack.cjs) rejects missing/stale/duplicate ownership and removes prior generated classes before compiling. [`LocalHttpFixture`](../playground/java/src/test/java/syntaxiser/playground/LocalHttpFixture.java) serves only fixed local responses on an ephemeral loopback port. Its server and worker pool are stopped in cleanup. The helper supplies responses, never substitute catalog implementations.

`pnpm check:java` compiles all 69 exact cards and runs **80 JUnit invocations**. They include 60 generated behavior methods, seven original clamp rows, a clamp unit test, two lifecycle tests, four async/MethodSource tests and six MockMvc methods. Assertions within methods include further independent situations; invocation counts are inventory, not semantic coverage. `pnpm test` includes the new depth/ownership tests, eleven natural searches and nine cursor probes plus lexical/recent-edit regressions. The common audit adds six searches/two cursor probes, registers parse/typecheck/execution for all cards and only the inspected behavioral situations. It retains findings for other languages.

Run with the pinned Java/Maven tools:

```sh
pnpm check:java
pnpm test
pnpm audit:coverage --check
node scripts/lesson-coverage.cjs --check
pnpm audit:runtime java > /tmp/syntaxiser-runtime-java.json
```

## Content review and limits

Overviews are authored independently of solved tasks and describe schematic forms, rules, versions and official APIs. Review against the linked Java 21 specifications rather than the latest JDK pages. No primitive patterns, string templates, preview structured concurrency or newer implicit-class syntax is used. Java has no import alias declaration; static imports and qualified API names have explicit cursor regressions. The adapter remains lexical and does not resolve receiver types or misleading exact type-name shadows.

Financial shares round for display and do not allocate all remaining cents. Equality normalization is application policy; regex and usernames deliberately use bounded/simple formats. UTF-16 cursors do not iterate full Unicode code points. Traversal is bounded and resource-safe but not a security sandbox. The live collection view is single-threaded. Async fallback intentionally loses causes; composition retains them. Executor tasks must cooperate with cancellation. HTTP strings buffer response bodies; the sample does not implement streaming, authentication, retries or public-service access. Jackson examples distinguish mapping policy from domain validation. Spring batch validation is an in-process transport boundary without persistence. Batch quantities are bounded to keep aggregate sums within int. No dependency upgrades or additional frameworks are needed for this scope.

The existing whitespace word counter contained an overescaped regex; exact runtime checks exposed it. It now splits Java whitespace correctly, with tab/newline assertions. Score labels and visit counters now reject absent names (and negative scores for labels) rather than render invalid domain input; their stable IDs remain. Content/depth review is a separate judgment from the deterministic checks above.

For manual search/cursor/reference/copy/pin/language switching, use the expanded [playground walkthrough](../playground/java/README.md).
