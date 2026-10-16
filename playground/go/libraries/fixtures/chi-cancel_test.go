package catalog
import (
 "context"
 "errors"
 "net/http/httptest"
 "testing"
 "time"
)
func TestChiWorkContract(t *testing.T) {
 checkChiWork(t,context.Background(),nil,204,"")
 checkChiWork(t,context.Background(),errors.New("internal"),502,"work failed\n")
 canceled,cancel:=context.WithCancel(context.Background());cancel()
 checkChiWork(t,canceled,nil,408,"request canceled\n")
 expired,cancelDeadline:=context.WithDeadline(context.Background(),time.Unix(0,0));defer cancelDeadline()
 checkChiWork(t,expired,nil,504,"work deadline\n")
 calls:=0;router:=NewChiWork(func(context.Context)error{calls++;return nil})
 for _,tc:=range []struct{method,path string;status int}{{"GET","/work/more",404},{"POST","/work",405}} {
  rec:=httptest.NewRecorder();router.ServeHTTP(rec,httptest.NewRequest(tc.method,tc.path,nil))
  if rec.Code!=tc.status || calls!=0 {t.Fatalf("routing %d calls %d",rec.Code,calls)}
  if rec.Header().Get("X-Content-Type-Options")!="nosniff" {t.Fatal("middleware missing on route rejection")}
 }
}
func checkChiWork(t *testing.T,ctx context.Context,upstream error,status int,body string) {
 t.Helper();type key struct{};ctx=context.WithValue(ctx,key{},"request-value")
 active,calls:=0,0
 router:=NewChiWork(func(got context.Context)error{
  calls++;active++;defer func(){active--}()
  if got.Value(key{})!="request-value" {t.Fatal("context lost")}
  if err:=got.Err();err!=nil{return err};return upstream
 })
 rec:=httptest.NewRecorder();router.ServeHTTP(rec,httptest.NewRequest("GET","/work",nil).WithContext(ctx))
 if calls!=1 || active!=0 {t.Fatalf("calls/active %d/%d",calls,active)}
 if rec.Code!=status || rec.Body.String()!=body {t.Fatalf("got %d %q, want %d %q",rec.Code,rec.Body.String(),status,body)}
 if rec.Header().Get("X-Content-Type-Options")!="nosniff" {t.Fatal("middleware missing")}
}
