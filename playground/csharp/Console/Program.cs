using Syntaxiser.Catalog;
Console.WriteLine(ScoreExample.Format("Ada", 5));
foreach (var pair in LinqExample.Totals([new("tea", 1), new("coffee", 4), new("tea", 2)]))
    Console.WriteLine($"{pair.Key}: {pair.Value}");
Console.WriteLine(JsonExample.Write(new("tea", 3)));
