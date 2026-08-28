package middleware

import (
	"bytes"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/MRashedHossain/pocket/internal/cache"
	"github.com/MRashedHossain/pocket/internal/models"
)

type cachedResponse struct {
	contentType string
	body        []byte
}

// bodyCapture tees everything written to the response into a buffer so a
// successful GET can be replayed from cache on the next request.
type bodyCapture struct {
	gin.ResponseWriter
	buf *bytes.Buffer
}

func (w *bodyCapture) Write(b []byte) (int, error) {
	w.buf.Write(b)
	return w.ResponseWriter.Write(b)
}

func (w *bodyCapture) WriteString(s string) (int, error) {
	w.buf.WriteString(s)
	return w.ResponseWriter.WriteString(s)
}

// ResponseCache serves GET responses for authenticated users straight from the
// in-memory cache, keyed by user id + full request URI. Entries share the
// per-user namespace CacheBust wipes on that user's next write, so a user always
// sees their own edits immediately; ttl bounds staleness for data changed by
// other users (shared projects, user lookups).
//
// Must be mounted AFTER the Auth middleware so the user is in context.
func ResponseCache(ttl time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		if ttl <= 0 || c.Request.Method != http.MethodGet {
			c.Next()
			return
		}

		u, ok := c.Get("user")
		if !ok {
			c.Next()
			return
		}
		user, ok := u.(*models.User)
		if !ok {
			c.Next()
			return
		}

		key := user.ID + ":resp:" + c.Request.URL.RequestURI()
		if v, hit := cache.Get(key); hit {
			if r, ok := v.(cachedResponse); ok {
				c.Data(http.StatusOK, r.contentType, r.body)
				c.Abort()
				return
			}
		}

		cw := &bodyCapture{ResponseWriter: c.Writer, buf: &bytes.Buffer{}}
		c.Writer = cw
		c.Next()

		if !c.IsAborted() && c.Writer.Status() == http.StatusOK {
			cache.Set(key, cachedResponse{
				contentType: c.Writer.Header().Get("Content-Type"),
				body:        append([]byte(nil), cw.buf.Bytes()...),
			}, ttl)
		}
	}
}
