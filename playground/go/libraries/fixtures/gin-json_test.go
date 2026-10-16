package catalog
import (
 "encoding/json"
 "net/http"
 "net/http/httptest"
 "strings"
 "testing"
)
func TestGinJSONContract(t *testing.T) {
 router:=NewGinOrders()
 for _,tc:=range []struct{name,body string; status,quantity int}{
  {"happy",`{"item":"book","quantity":3}`,201,3},
  {"lower-bound",`{"item":"book","quantity":1}`,201,1},
  {"upper-bound",`{"item":"book","quantity":10}`,201,10},
  {"unknown-field-default",`{"item":"book","quantity":1,"extra":true}`,201,1},
  {"empty",``,400,0}, {"missing-item",`{"quantity":1}`,400,0},
  {"missing-quantity",`{"item":"book"}`,400,0},
  {"zero",`{"item":"book","quantity":0}`,400,0},
  {"over-limit",`{"item":"book","quantity":11}`,400,0},
  {"negative",`{"item":"book","quantity":-1}`,400,0},
  {"wrong-type",`{"item":"book","quantity":"one"}`,400,0},
  {"malformed",`{`,400,0},
 } {
  t.Run(tc.name,func(t *testing.T){
   rec:=httptest.NewRecorder();req:=httptest.NewRequest("POST","/orders",strings.NewReader(tc.body));req.Header.Set("Content-Type","application/json")
   router.ServeHTTP(rec,req)
   if rec.Code!=tc.status {t.Fatalf("status %d body %s, want %d",rec.Code,rec.Body.String(),tc.status)}
   if !strings.HasPrefix(rec.Header().Get("Content-Type"),"application/json") {t.Fatal("missing JSON content type")}
   var got map[string]any
   if err:=json.Unmarshal(rec.Body.Bytes(),&got);err!=nil {t.Fatal(err)}
   if tc.status==201 {
    if got["item"]!="book" || got["quantity"]!=float64(tc.quantity) {t.Fatalf("unexpected payload: %v",got)}
   } else if got["error"]!="invalid order" || len(got)!=1 {t.Fatalf("unstable error contract: %v",got)}
  })
 }
 for _,tc:=range []struct{method,path string;want int}{{"GET","/orders",404},{"POST","/missing",404}} {
  rec:=httptest.NewRecorder();router.ServeHTTP(rec,httptest.NewRequest(tc.method,tc.path,nil));if rec.Code!=tc.want {t.Fatalf("%s %s: %d",tc.method,tc.path,rec.Code)}
 }
 // The same router recovers after rejected requests; no global validator settings change.
 rec:=httptest.NewRecorder();router.ServeHTTP(rec,httptest.NewRequest(http.MethodPost,"/orders",strings.NewReader(`{"item":"book","quantity":2}`)))
 if rec.Code!=201 {t.Fatalf("valid request after rejection: %d",rec.Code)}
}
