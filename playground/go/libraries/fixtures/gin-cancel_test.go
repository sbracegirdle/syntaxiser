package catalog
import (
 "context"
 "encoding/json"
 "errors"
 "net/http/httptest"
 "testing"
 "time"
)
func TestGinLookupContract(t *testing.T) {
 for _,tc:=range []struct{name string;ctx context.Context; upstream error;status int; field,value string}{
  {"happy",context.Background(),nil,200,"name","book"},
  {"upstream-failure",context.Background(),errors.New("private detail"),502,"error","lookup failed"},
 } {t.Run(tc.name,func(t *testing.T){checkGinLookup(t,tc.ctx,tc.upstream,tc.status,tc.field,tc.value)})}
 ctx,cancel:=context.WithCancel(context.Background());cancel()
 checkGinLookup(t,ctx,nil,408,"error","request canceled")
 expired,done:=context.WithDeadline(context.Background(),time.Unix(0,0));defer done()
 checkGinLookup(t,expired,nil,504,"error","lookup deadline")
 router:=NewGinLookup(func(context.Context,string)(string,error){t.Fatal("lookup called on route miss");return "",nil})
 for _,path:=range []string{"/missing","/items/"} {
  rec:=httptest.NewRecorder();router.ServeHTTP(rec,httptest.NewRequest("GET",path,nil));if rec.Code!=404 {t.Fatalf("route miss %s: %d",path,rec.Code)}
 }
}
func checkGinLookup(t *testing.T,ctx context.Context,upstream error,status int,field,value string) {
 t.Helper();type key struct{};ctx=context.WithValue(ctx,key{},"preserved")
 calls,active:=0,0
 router:=NewGinLookup(func(got context.Context,id string)(string,error){
  calls++;active++;defer func(){active--}()
  if got.Value(key{})!="preserved" || id!="42" {t.Fatal("lost request context or path parameter")}
  if err:=got.Err();err!=nil{return "",err};return "book",upstream
 })
 rec:=httptest.NewRecorder();router.ServeHTTP(rec,httptest.NewRequest("GET","/items/42",nil).WithContext(ctx))
 if calls!=1 || active!=0 {t.Fatalf("calls/active %d/%d",calls,active)}
 if rec.Code!=status {t.Fatalf("status %d, want %d",rec.Code,status)}
 var got map[string]string;if err:=json.Unmarshal(rec.Body.Bytes(),&got);err!=nil{t.Fatal(err)}
 if got[field]!=value || len(got)!=1 {t.Fatalf("body %v",got)}
}
