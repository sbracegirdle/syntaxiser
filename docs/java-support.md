# Java language and ecosystem support

Open `.java` files for Java Context, Search, Reference and Pins. The extension bundles text and an offline grammar; it never installs Java libraries or executes examples. Java has **69 practical examples**, **41 independently authored overviews**, six reference groups and ten progressive lesson tasks. Each overview includes official learning references.

| Area | Topics and practical coverage |
| --- | --- |
| Language foundations | Typed values, control flow, methods, classes/constructors, interfaces/lambdas, packages/static imports |
| Data and transformations | Records, generics/wildcards, collections/insertion order, stream filter/sort, grouped totals, Optional |
| Errors, resources and I/O | Checked/unchecked failures, cause preservation, try-with-resources, UTF-8 Path/Files operations |
| Concurrency | CompletableFuture composition/failure, executor submission/results and owned lifecycle |
| Testing and JSON | JUnit Jupiter assertions, parameterized CsvSource cases, Jackson record round-trip and mapping failures |
| Spring Boot web APIs | GET/POST JSON, Jakarta field constraints, stable 400/409 responses and in-process MockMvc tests |

Search **close resource**, **stream group**, **optional value**, **jackson json**, **junit parameterized**, **spring boot endpoint**, **spring validation**, **spring error handling** or **spring request test**. Practical examples remain the primary contextual results; each concept has a separately browsable syntax/API overview. Tooling recipes live in the [Maven tooling guide](../playground/java/tooling.md), outside the Java syntax catalog.

See the [before/after depth and assertion matrix](java-depth.md) for 16 new units, semantic variants, pinned requirements and every topic's success/boundary/rejection evidence. Added areas include pattern switches, arrays/varargs, equality, comparators, snapshots, generic bounds, nested types, functional pipelines, reductions, regex, decimal, java.time, UUID, NIO traversal and local HTTP. Existing library units now cover nested validation, strict creator policies and JUnit lifecycle/async data cases.

## Supported baseline and checks

The runnable [playground and manual walkthrough](../playground/java/README.md) record Temurin **21.0.8+9**, Java **21**, Maven **3.9.11**, Spring Boot **3.5.7**, Jackson **2.19.4** and JUnit Jupiter **5.13.4**. No preview features are used. Records and Stream.toList need Java 16+, String.formatted needs Java 15+, and AutoCloseable ExecutorService needs Java 19+; compiling all examples requires the documented Java 21 baseline.

`pnpm check:java` compiles all 69 actual catalog snippets, then runs 80 real JUnit invocations, including Jackson success/failure, temporary-file/UTF-8 checks, executor results and failure causes, Bean Validation field errors, and MockMvc request status/body assertions. It makes no external HTTP requests. `pnpm test` covers Java lexical extraction, search/context retrieval, reference groups, highlighting/literal copy, qualified pins, language switching, lesson progress/custom state and all existing extension regressions.

The ten built-in lessons progress through greeting/clamp, records/word counts, JUnit/files, streams/async and an API/report capstone. Instructions name prerequisites and runnable checks; snippets are deliberately empty. Stable `java-*` IDs allow #36 to expand the path without discarding progress. Existing language IDs/lesson IDs are preserved.

## Context extraction and limitations

The lexical fallback hides line/block comments, strings, escaped character literals and Java text blocks while preserving offsets. It recognizes package/import/static-import declarations, class/interface/enum/record bodies, methods, constructors, initializers and block lambdas, including incomplete edits. When available, VS Code document symbols refine scope. Imported type/static-member paths reinforce a topic when the matching identifier appears on the current line; an unused import does not become the focus. Wildcard imports are recorded, while explicit API names and annotation patterns drive local matches.

This is a tolerant lexical helper, not a Java parser or type checker. It does not resolve variable types/overloads, wildcard-import members, reflective calls, embedded languages or Unicode-escape preprocessing. Document symbols can improve scope but cannot resolve those semantic cues. Some examples are small compilation units intended for a caller or test, rather than standalone main programs. Jackson uses 2.x imports; Jackson 3 and Spring Boot 4 are outside this pinned catalog. Spring examples deliberately omit persistence/authentication, and concurrency coverage does not include structured-concurrency preview APIs. Android/Kotlin, advanced persistence and exhaustive framework coverage remain follow-ups.

## Official learning sources

- [Java language basics](https://dev.java/learn/language-basics/), [classes](https://dev.java/learn/classes-objects/), [interfaces](https://dev.java/learn/interfaces/), [records](https://dev.java/learn/records/), [generics](https://dev.java/learn/generics/) and [packages](https://dev.java/learn/packages/).
- [Collections](https://dev.java/learn/api/collections-framework/), [streams](https://dev.java/learn/api/collections-and-streams/streams/), [Optional](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html), [exceptions](https://dev.java/learn/exceptions/), [try-with-resources](https://docs.oracle.com/javase/tutorial/essential/exceptions/tryResourceClose.html) and [I/O](https://dev.java/learn/java-io/).
- [CompletableFuture](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html) and [ExecutorService](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html).
- [JUnit 5.13.4](https://docs.junit.org/5.13.4/user-guide/) and [Jackson databind](https://github.com/FasterXML/jackson-databind).
- [Spring Boot 3.5 servlet web applications](https://docs.spring.io/spring-boot/3.5/reference/web/servlet.html), [MVC validation](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html) and [Boot application testing](https://docs.spring.io/spring-boot/3.5/reference/testing/spring-boot-applications.html).
