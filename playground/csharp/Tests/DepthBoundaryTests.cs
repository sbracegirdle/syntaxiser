using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Hosting;
using Xunit;
namespace Syntaxiser.Catalog;
public class DepthBoundaryTests {
    [Fact]
    public async Task ParallelWorkNeverExceedsConfiguredCeiling() {
        using var stop=new CancellationTokenSource(TimeSpan.FromSeconds(10));
        var entered=new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var release=new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        int active=0,maximum=0; object gate=new();
        async ValueTask<int> Work(int value,CancellationToken token) {
            lock(gate) { active++; maximum=Math.Max(maximum,active); if(active==2)entered.TrySetResult(); }
            try { await release.Task.WaitAsync(token); return value*2; }
            finally { lock(gate)active--; }
        }
        var running=BoundedBatch.Map([1,2,3,4,5],2,Work,stop.Token);
        try { await entered.Task.WaitAsync(stop.Token); lock(gate) Assert.Equal(2,active); }
        finally { release.TrySetResult(); }
        Assert.Equal(new[]{2,4,6,8,10},await running);
        Assert.Equal(2,maximum); Assert.Equal(0,active);
    }
    [Fact]
    public async Task MidEnumerationCancellationCompletesAChannelProducer() {
        using var stop=new CancellationTokenSource(TimeSpan.FromSeconds(10));
        int calls=0;
        await Assert.ThrowsAnyAsync<OperationCanceledException>(()=>ChannelRows.Transfer([1,2,3,4,5],n=>{ if(++calls==2) stop.Cancel(); return n; },stop.Token));
        Assert.InRange(calls,2,5);
        Assert.Equal(new[]{9},await ChannelRows.Transfer([9],n=>n,default));
        using var iteratorStop=new CancellationTokenSource();
        await using var iterator=AsyncRows.Read([1,2],iteratorStop.Token).GetAsyncEnumerator();
        Assert.True(await iterator.MoveNextAsync()); Assert.Equal(1,iterator.Current);
        iteratorStop.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(async()=>await iterator.MoveNextAsync());
    }
    [Fact]
    public async Task HttpNonSuccessDisposesBeforeRecovery() {
        using var handler=new PayloadHandler("private upstream error"){Status=System.Net.HttpStatusCode.ServiceUnavailable};
        using var client=new HttpClient(handler);
        await Assert.ThrowsAsync<HttpRequestException>(()=>HttpOrder.Read(client,new("https://fixture.test/"),default));
        Assert.True(handler.Last!.Closed);
        handler.Status=System.Net.HttpStatusCode.OK; handler.Body="{\"name\":\"ok\",\"quantity\":1}";
        Assert.Equal("ok",(await HttpOrder.Read(client,new("https://fixture.test/"),default)).Name);
        Assert.True(handler.Last!.Closed);
    }
    [Fact]
    public async Task MiddlewareRecordsStructuredOutcomesIncludingFailure() {
        using var logs=new RequestLogs();
        using var factory=new WebApplicationFactory<Program>().WithWebHostBuilder(builder=>builder.ConfigureLogging(logging=>{logging.ClearProviders();logging.AddProvider(logs);}));
        using var client=factory.CreateClient();
        using var failed=await client.GetAsync("/depth/report?fail=true");
        Assert.Equal(System.Net.HttpStatusCode.ServiceUnavailable,failed.StatusCode);
        Assert.Contains(logs.Outcomes,x=>x.Method=="GET"&&x.Status==503);
        using var good=await client.GetAsync("/health");
        Assert.Equal(System.Net.HttpStatusCode.OK,good.StatusCode);
        Assert.Contains(logs.Outcomes,x=>x.Method=="GET"&&x.Status==200);
    }
    [Fact]
    public async Task ReportAndRelationalCapstonesAreComposable() {
        var rows=JsonReport.Read("[{\"name\":\"tea\",\"quantity\":1},{\"name\":\"tea\",\"quantity\":2}]");
        Assert.Equal(3,Assert.Single(ValidTotals.Sum(rows)).Value);
        Assert.Throws<ArgumentException>(()=>JsonReport.Read("[null]"));
        Assert.Empty(ValidTotals.Sum(JsonReport.Read("[]")));
        using var f=new CheckDb(); await f.Seed();
        await Assert.ThrowsAsync<Microsoft.EntityFrameworkCore.DbUpdateException>(()=>InventoryPair.Add(f.Db,1,"import","import",default));
        Assert.Equal(new[]{"tea"},await InventoryQuery.Names(f.Db,0,default));
        await InventoryPair.Add(f.Db,1,"import-a","import-b",default);
        Assert.Equal(new[]{"import-a","import-b","tea"},await InventoryQuery.Names(f.Db,0,default));
    }
    [Fact]
    public async Task StreamingAndLifecycleCapstonesAreComposable() {
        var fixture=new DirectoryFixture(); await fixture.InitializeAsync();
        try {
            string path=Path.Combine(fixture.PathName,"report.txt");
            await File.WriteAllTextAsync(path,"1\n2\n3");
            await using var stream=new FileStream(path,FileMode.Open,FileAccess.Read);
            string text=await StrictText.ReadAsync(stream,default);
            var values=text.Split('\n').Select(ImportQuantity.Read).ToArray();
            var collected=new List<int>(); await foreach(var value in AsyncRows.Read(values))collected.Add(value);
            var result=await ChannelRows.Transfer(collected.ToArray(),x=>checked(x*2),default);
            Assert.Equal(12,await AsyncTotal.Add(result,default));
            await Assert.ThrowsAsync<FormatException>(()=>ChannelRows.Transfer([1],_=>throw new FormatException(),default));
            Assert.Empty(await ChannelRows.Transfer([],x=>x,default));
        } finally { await fixture.DisposeAsync(); }
        Assert.False(Directory.Exists(fixture.PathName));
    }
}
public sealed class RequestLogs:ILoggerProvider {
    public System.Collections.Concurrent.ConcurrentQueue<(string Method,int Status)> Outcomes { get; }=new();
    public ILogger CreateLogger(string name)=>new Recorder(this);
    public void Dispose() { }
    private sealed class Recorder(RequestLogs owner):ILogger {
        public IDisposable? BeginScope<TState>(TState state) where TState:notnull=>null;
        public bool IsEnabled(LogLevel level)=>true;
        public void Log<TState>(LogLevel level,EventId id,TState state,Exception? exception,Func<TState,Exception?,string> formatter) {
            if(state is IEnumerable<KeyValuePair<string,object?>> fields) {
                var map=fields.ToDictionary(x=>x.Key,x=>x.Value);
                if(map.TryGetValue("Method",out var method)&&map.TryGetValue("Status",out var status)&&method is string m&&status is int s) owner.Outcomes.Enqueue((m,s));
            }
        }
    }
}
