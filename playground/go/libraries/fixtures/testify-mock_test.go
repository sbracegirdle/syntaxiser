package catalog
import (
 "errors"
 "testing"
 "github.com/stretchr/testify/mock"
)
func TestStoreBoundaries(t *testing.T) {
 for _,tc:=range []struct{name,value string;first,second error;calls int}{
  {"immediate-success","Ada",nil,nil,1},
  {"empty-valid-value","",nil,nil,1},
  {"persistent-failure","",errors.New("first"),errors.New("still unavailable"),2},
 } {t.Run(tc.name,func(t *testing.T){
  store:=new(StoreMock)
  store.On("Load","profile").Return(tc.value,tc.first).Once()
  if tc.calls==2 {store.On("Load","profile").Return(tc.value,tc.second).Once()}
  got,err:=LoadTwice(store,"profile")
  if got!=tc.value || !errors.Is(err,tc.second) {t.Fatalf("got %q %v",got,err)}
  if !store.AssertNumberOfCalls(t,"Load",tc.calls) || !store.AssertExpectations(t) {t.Fatal("expectations failed")}
 })}
}
type mockRecorder struct{failures int}
func(r *mockRecorder) Logf(string,...interface{}){}
func(r *mockRecorder) Errorf(string,...interface{}){r.failures++}
func(r *mockRecorder) FailNow(){panic("unexpected mock call")}
func TestMockRejectsMissingAndUnexpectedCalls(t *testing.T) {
 missing:=new(StoreMock);missing.On("Load","never").Return("",nil).Once()
 report:=new(mockRecorder)
 if missing.AssertExpectations(report) || report.failures==0 {t.Fatal("missing call accepted")}
 t.Run("unexpected-call",func(t *testing.T){
  store:=new(StoreMock);store.Mock.Test(new(mockRecorder))
  defer func(){if recover()==nil {t.Fatal("unexpected call accepted")}}()
  store.Load("unconfigured")
 })
 // Verify the actual mock package is being used, not a hand-written substitute.
 var _ mock.TestingT = (*mockRecorder)(nil)
}
