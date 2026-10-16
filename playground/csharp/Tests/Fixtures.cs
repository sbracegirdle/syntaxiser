using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using Xunit;
namespace Syntaxiser.Catalog;
public sealed class TestHostHandler : DelegatingHandler {
    private readonly WebApplicationFactory<Program> factory = new();
    public TestHostHandler() { InnerHandler = factory.Server.CreateHandler(); }
    protected override void Dispose(bool disposing) {
        base.Dispose(disposing);
        if (disposing) factory.Dispose();
    }
}
public sealed class StubHandler : HttpMessageHandler {
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,CancellationToken token) {
        token.ThrowIfCancellationRequested();
        return Task.FromResult(new HttpResponseMessage(request.RequestUri!.AbsolutePath == "/ok" ? HttpStatusCode.OK : HttpStatusCode.ServiceUnavailable) {
            Content = new StringContent("local")
        });
    }
}
public class RequestErrors {
    [Theory]
    [InlineData("{")]
    [InlineData("null")]
    [InlineData("{\"name\":\"tea\",\"quantity\":\"bad\"}")]
    public async Task InvalidJsonReturns400(string json) {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();
        using var response = await client.PostAsync("/orders",new StringContent(json,System.Text.Encoding.UTF8,"application/json"));
        Assert.Equal(HttpStatusCode.BadRequest,response.StatusCode);
    }
    [Fact]
    public async Task OrderResponseRoundTrips() {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();
        using var response = await client.PostAsync("/orders",new StringContent("{\"name\":\"tea\",\"quantity\":3}",System.Text.Encoding.UTF8,"application/json"));
        Assert.Equal(HttpStatusCode.Created,response.StatusCode);
        Assert.Equal(new OrderExample("tea",3),JsonExample.Parse(await response.Content.ReadAsStringAsync()));
    }
}
