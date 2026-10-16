using Syntaxiser.Catalog;
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();
EndpointExample.Map(app);
ValidationExample.Map(app);
ErrorExample.Map(app);
app.Run();
public partial class Program { }
