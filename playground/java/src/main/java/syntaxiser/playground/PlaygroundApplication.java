package syntaxiser.playground;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PlaygroundApplication {
    public static void main(String[] args) throws Exception {
        if (args.length > 0 && args[0].equals("--console")) {
            System.out.println(ScoreLabel.format("Ada", 5));
            System.out.println(WordCounts.count("red blue red"));
            System.out.println(DisplayNames.normalize(null));
            System.out.println(JsonOrders.roundTrip(new JsonOrders.Order("tea", 2)));
            System.out.println("worker total: " + WorkerTotals.sum());
            ContextTour.run();
            return;
        }
        SpringApplication.run(PlaygroundApplication.class, args);
    }
}
