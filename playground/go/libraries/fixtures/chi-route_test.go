package catalog
import (
 "net/http/httptest"
 "testing"
)
func TestChiRouteContract(t *testing.T) {
 router:=NewChiItems()
 for _,tc:=range []struct{name,method,path,body string;status int}{
  {"happy","GET","/items/42","item:42",200},
  {"lower-bound","GET","/items/1","item:1",200},
  {"zero","GET","/items/0","invalid item id\n",400},
  {"negative","GET","/items/-1","invalid item id\n",400},
  {"malformed","GET","/items/no","invalid item id\n",400},
  {"overflow","GET","/items/999999999999999999999999999999","invalid item id\n",400},
  {"missing-segment","GET","/items/","404 page not found\n",404},
  {"route-boundary","GET","/items/1/extra","404 page not found\n",404},
  {"wrong-method","POST","/items/1","",405},
 } {t.Run(tc.name,func(t *testing.T){
  rec:=httptest.NewRecorder();router.ServeHTTP(rec,httptest.NewRequest(tc.method,tc.path,nil))
  if rec.Code!=tc.status || rec.Body.String()!=tc.body {t.Fatalf("got %d %q, want %d %q",rec.Code,rec.Body.String(),tc.status,tc.body)}
  if tc.status==405 && rec.Header().Get("Allow")!="GET" {t.Fatalf("Allow: %q",rec.Header().Get("Allow"))}
 })}
}
