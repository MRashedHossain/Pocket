// Package cache is a tiny in-memory TTL cache used to shave repeated
// aggregate queries (dashboard, settings, category lists) off the hot path.
//
// It is intentionally minimal: a map guarded by a mutex, per-entry expiry,
// and prefix-based invalidation so a single user's data can be dropped after
// any write. Values are stored as already-serialisable Go values (typically a
// gin.H) and handed back as-is.
package cache

import (
	"sync"
	"time"
)

type entry struct {
	value   any
	expires time.Time
}

var (
	mu    sync.RWMutex
	store = make(map[string]entry)
)

// Get returns the cached value for key if present and not expired.
func Get(key string) (any, bool) {
	mu.RLock()
	e, ok := store[key]
	mu.RUnlock()
	if !ok {
		return nil, false
	}
	if time.Now().After(e.expires) {
		mu.Lock()
		// Re-check: another goroutine may have refreshed it.
		if cur, still := store[key]; still && time.Now().After(cur.expires) {
			delete(store, key)
		}
		mu.Unlock()
		return nil, false
	}
	return e.value, true
}

// Set stores value under key for the given ttl.
func Set(key string, value any, ttl time.Duration) {
	mu.Lock()
	store[key] = entry{value: value, expires: time.Now().Add(ttl)}
	mu.Unlock()
}

// Invalidate drops every entry whose key starts with prefix.
func Invalidate(prefix string) {
	mu.Lock()
	for k := range store {
		if len(k) >= len(prefix) && k[:len(prefix)] == prefix {
			delete(store, k)
		}
	}
	mu.Unlock()
}

// BustUser drops all cached data belonging to a single user. Every cache key
// in this app is namespaced as "<userID>:<...>", so this is a prefix wipe.
func BustUser(userID string) {
	if userID == "" {
		return
	}
	Invalidate(userID + ":")
}
