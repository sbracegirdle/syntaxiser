package libraries

// The checker generates exact catalog packages and independent assertion fixtures.
// This file keeps go mod tidy aware of dependencies without copying examples.
import (
 _ "github.com/gin-gonic/gin"
 _ "github.com/go-chi/chi/v5"
 _ "github.com/stretchr/testify/assert"
 _ "github.com/stretchr/testify/require"
 _ "github.com/stretchr/testify/mock"
)
