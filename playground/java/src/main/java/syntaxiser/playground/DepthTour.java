package syntaxiser.playground;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.net.http.HttpClient;
import java.nio.file.Files;
import java.nio.file.Path;

/** Cursor tour; runnable after the catalog generator supplies the demonstrated classes. */
final class DepthTour {
    public static void main(String[] args) throws Exception {
        System.out.println(switch (Shipping.Speed.EXPRESS) {
            case STANDARD -> "standard";
            case EXPRESS -> "express";
        });
        Object value = "Ada";
        if (value instanceof String text) System.out.println(text.strip());
        System.out.println(new BigDecimal("1.00").stripTrailingZeros());
        System.out.println(Instant.parse("2025-01-01T00:00:00Z").atZone(ZoneId.of("Australia/Perth")));
        System.out.println(List.of("Cy","Ada").stream().sorted(Comparator.nullsLast(Comparator.naturalOrder())).toList());
        Path directory = Files.createTempDirectory("depth-tour-");
        try (var paths = Files.walk(directory)) { System.out.println(paths.count()); }
        finally { Files.delete(directory); }
        try (HttpClient client = HttpClient.newHttpClient()) {
            System.out.println("HTTP client ready; this tour makes no requests");
        }
    }
}
