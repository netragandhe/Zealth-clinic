import axios from 'axios'

const getRawApiUrl = () => {
  let envUrl = import.meta.env.VITE_API_URL
  if (envUrl && envUrl.trim() !== '') {
    envUrl = envUrl.trim().replace(/\/+$/, '')
    if (envUrl.startsWith('https://localhost') || envUrl.startsWith('https://127.0.0.1')) {
      envUrl = envUrl.replace(/^https:/, 'http:')
    }
    return envUrl
  }
  // Local Backend URL
  return 'http://localhost:5001'
}

const API_BASE_URL = getRawApiUrl()

const api = axios.create({
  baseURL: API_BASE_URL,
})

// ── REQUEST INTERCEPTOR: Attach accessToken from localStorage ────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── RESPONSE INTERCEPTOR: Auto-refresh on 401 ────────────────────────────────
let isRefreshing = false
let refreshQueue = []

const processQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  refreshQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Only intercept 401s and skip the refresh endpoint itself (prevent infinite loop)
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/api/auth/refresh')
    ) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')

      if (!refreshToken) {
        // No refresh token → must login again
        isRefreshing = false
        localStorage.removeItem('accessToken')
        localStorage.removeItem('token')
        localStorage.removeItem('userRole')
        const publicPaths = ['/', '/login', '/register', '/forgot-password']
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
        if (typeof window !== 'undefined' && !publicPaths.includes(currentPath)) {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }

      try {
        const res = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken })
        if (res.data?.success && res.data?.data?.accessToken) {
          const newToken = res.data.data.accessToken
          localStorage.setItem('accessToken', newToken)
          localStorage.setItem('token', newToken)

          // Store new refresh token if provided
          if (res.data.data.refreshToken) {
            localStorage.setItem('refreshToken', res.data.data.refreshToken)
          }

          api.defaults.headers.common.Authorization = `Bearer ${newToken}`
          originalRequest.headers.Authorization = `Bearer ${newToken}`

          processQueue(null, newToken)
          isRefreshing = false

          return api(originalRequest)
        } else {
          throw new Error('Refresh failed')
        }
      } catch (refreshError) {
        processQueue(refreshError, null)
        isRefreshing = false

        // Refresh failed → clear tokens and redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('userRole')

        const publicPaths = ['/', '/login', '/register', '/forgot-password']
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
        if (typeof window !== 'undefined' && !publicPaths.includes(currentPath)) {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
export { API_BASE_URL }
