import axios from 'axios'

const api = axios.create({ baseURL: '/api/v1' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── In-memory GET cache ──────────────────────────────────────────────────────
// Section data barely changes between navigations, so hold successful GET
// responses briefly and serve repeat views from memory instead of re-hitting
// the network. Any write (POST/PATCH/PUT/DELETE) clears the whole cache, and
// entries expire after TTL_MS regardless.
const TTL_MS = 15000
const cache = new Map() // url -> { at, data }

function cacheKey(url, config) {
  const params = config?.params
  if (!params) return url
  const qs = new URLSearchParams(params).toString()
  return qs ? `${url}?${qs}` : url
}

export function clearApiCache() {
  cache.clear()
}

const rawGet = api.get.bind(api)

api.get = (url, config) => {
  const key = cacheKey(url, config)
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) {
    return Promise.resolve({ data: hit.data, cached: true })
  }
  return rawGet(url, config).then(res => {
    cache.set(key, { at: Date.now(), data: res.data })
    return res
  })
}

for (const method of ['post', 'put', 'patch', 'delete']) {
  const raw = api[method].bind(api)
  api[method] = (...args) => raw(...args).then(res => { clearApiCache(); return res })
}

export default api
