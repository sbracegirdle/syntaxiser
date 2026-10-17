using Syntaxiser.Catalog;
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();
RequestLog.Use(app);
EndpointExample.Map(app);
RouteItems.Map(app);
QueryLimit.Map(app);
NameFilter.Map(app);
CancelEndpoint.Map(app);
BatchEndpoint.Map(app);
ReportEndpoint.Map(app);
ValidationExample.Map(app);
ErrorExample.Map(app);
app.Run();
public partial class Program { }
