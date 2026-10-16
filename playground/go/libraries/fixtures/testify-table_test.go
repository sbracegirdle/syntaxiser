package catalog
import (
 "errors"
 "strconv"
 "testing"
 "github.com/stretchr/testify/assert"
)
// A recorder lets a deliberately failing assert be tested without failing this test.
type recorder struct { failures int }
func(r *recorder) Errorf(string,...interface{}) {r.failures++}
func TestAssertionRejection(t *testing.T) {
 ok:=&recorder{}
 if !assert.Equal(ok,0,0) || ok.failures!=0 {t.Fatal("valid equality failed")}
 bad:=&recorder{}
 if assert.Equal(bad,0,1) || bad.failures!=1 {t.Fatal("inequality must report one failure")}
 _,err:=strconv.Atoi("")
 if !assert.ErrorIs(ok,err,strconv.ErrSyntax) {t.Fatal("wrapped parse error lost")}
 if assert.ErrorIs(bad,err,errors.New("different")) || bad.failures!=2 {t.Fatal("wrong error identity accepted")}
 if assert.NoError(bad,err) || bad.failures!=3 {t.Fatal("unexpected error accepted")}
}
