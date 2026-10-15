# Java project and Maven tooling

Build tooling is separate from Java syntax/API learning cards. This fixture uses Maven only; Gradle configuration, Java modules and multi-module builds are follow-ups.

| Location | Purpose |
| --- | --- |
| `pom.xml` | Fixed Boot parent, Java release, dependency overrides and pinned build plugins |
| `src/main/java/syntaxiser/playground/PlaygroundApplication.java` | Public runnable console/API entry point |
| `src/main/java/syntaxiser/playground/ContextTour.java` | Runnable editor cursor tour |
| `target/catalog/main/syntaxiser/playground/` | Exact catalog library, controller, JSON and validation examples |
| `target/catalog/test/syntaxiser/playground/` | Exact JUnit/MockMvc cards plus generated behavior checks |
| `src/test/java/syntaxiser/playground/` | Your own optional practice tests |
| `target/surefire-reports/` | JUnit test reports |

All fixture sources share package `syntaxiser.playground`. The checker supplies that package declaration before each copied card so short examples can refer to one another. Examples describe any cross-card dependencies. Place a copied public class in its own matching filename; the examples mostly use package-private classes to keep their file names flexible.

From the repository root:

```sh
# Generate catalog sources and compile/run the real behavior tests.
pnpm check:java

# Refresh generated sources without running Maven (for cursor tours).
node scripts/check-java-pack.cjs --generate-only

# Run Maven again after editing personal tests, without regenerating cards.
mvn -f playground/java/pom.xml test

# Create an executable jar after generation, then run its console path.
mvn -f playground/java/pom.xml package
java -jar playground/java/target/java-playground-1.0.0.jar --console

# Inspect resolved versions and libraries.
mvn -f playground/java/pom.xml dependency:tree
```

`mvn clean` removes `target/catalog` too. After cleaning, use `pnpm check:java` to regenerate before compiling or running. The checker removes stale generated source files on each invocation. Generated sources are compiled with the real dependencies and Java 21 release checking, rather than handwritten stubs. Maven compilation itself does not execute a snippet; the JUnit tests exercise the results and failure paths.
