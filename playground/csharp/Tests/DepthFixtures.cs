using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
namespace Syntaxiser.Catalog;
// Only infrastructure lives here: all domain behavior comes from exact generated cards.
public sealed class CheckDb:IDisposable {
    private readonly SqliteConnection connection=new("Data Source=:memory:;Foreign Keys=True");
    private readonly DbContextOptions<CatalogDb> options;
    public CatalogDb Db { get; }
    public CheckDb() { connection.Open(); options=new DbContextOptionsBuilder<CatalogDb>().UseSqlite(connection).Options; Db=new(options); Db.Database.EnsureCreated(); }
    public CatalogDb NewContext()=>new(options);
    public async Task Seed() { Db.Customers.Add(new(){Id=1,Name="Ada"}); Db.Items.Add(new(){Name="tea",Quantity=2,CustomerId=1}); await Db.SaveChangesAsync(); }
    public void Dispose() { Db.Dispose(); connection.Dispose(); }
}
public sealed class ObservedContent(string body):StringContent(body,System.Text.Encoding.UTF8,"application/json") {
    public bool Closed { get; private set; }
    protected override void Dispose(bool disposing) { if(disposing) Closed=true; base.Dispose(disposing); }
}
public sealed class PayloadHandler(string body):HttpMessageHandler {
    public string Body { get; set; }=body;
    public System.Net.HttpStatusCode Status { get; set; }=System.Net.HttpStatusCode.OK;
    public ObservedContent? Last { get; private set; }
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,CancellationToken token) { token.ThrowIfCancellationRequested(); Last=new(Body); return Task.FromResult(new HttpResponseMessage(Status){Content=Last}); }
}
public sealed class WaitingHandler:HttpMessageHandler {
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,CancellationToken token) { await Task.Delay(Timeout.InfiniteTimeSpan,token); return new(System.Net.HttpStatusCode.OK); }
}
public static class BehaviorHelpers { public static StringContent JsonBody(string json)=>new(json,System.Text.Encoding.UTF8,"application/json"); }
