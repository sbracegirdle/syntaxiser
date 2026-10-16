package syntaxiser.playground;

import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.TimeUnit;

/** Loopback-only integration boundary for the exact HttpClient catalog examples. */
final class LocalHttpFixture implements AutoCloseable {
    private final HttpServer server;
    private final ExecutorService executor = Executors.newFixedThreadPool(2);
    LocalHttpFixture() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.setExecutor(executor);
        server.createContext("/", exchange -> {
            String path = exchange.getRequestURI().getPath();
            int status = path.equals("/error") ? 503 : 200;
            String body = switch (path) {
                case "/text" -> "café";
                case "/empty" -> "";
                case "/json" -> "{\"name\":\"tea\",\"quantity\":2}";
                case "/invalid" -> "{\"name\":\"tea\",\"quantity\":0}";
                case "/malformed" -> "{";
                default -> "unavailable";
            };
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            try (exchange) {
                exchange.sendResponseHeaders(status, bytes.length == 0 ? -1 : bytes.length);
                if (bytes.length > 0) exchange.getResponseBody().write(bytes);
            }
        });
        server.start();
    }
    URI uri(String path) { return URI.create("http://127.0.0.1:" + server.getAddress().getPort() + path); }
    @Override public void close() throws InterruptedException {
        server.stop(0);
        executor.shutdownNow();
        if (!executor.awaitTermination(2, TimeUnit.SECONDS)) throw new IllegalStateException("HTTP fixture did not stop");
    }
}
