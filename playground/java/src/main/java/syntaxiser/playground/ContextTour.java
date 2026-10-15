package syntaxiser.playground;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Optional;
import java.util.TreeMap;
import java.util.stream.Collectors;

// Run via PlaygroundApplication --console; move the cursor through each operation.
final class ContextTour {
    record Line(String name, int quantity) {}

    static void run() throws Exception {
        List<Line> lines = List.of(new Line("tea", 1), new Line("coffee", 4), new Line("tea", 2));
        var totals = lines.stream().collect(Collectors.groupingBy(
            Line::name, TreeMap::new, Collectors.summingInt(Line::quantity)));
        System.out.println(totals);
        System.out.println(Optional.ofNullable((String) null).orElse("Guest"));
        ObjectMapper mapper = new ObjectMapper();
        String json = """
            {"name":"tea","quantity":2}
            """;
        System.out.println(mapper.readValue(json, Line.class));
    }
}
