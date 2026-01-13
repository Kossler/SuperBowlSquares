import axios from 'axios'
import { getToken } from '../utils/auth'

// Ensure VITE_API_URL always has protocol and no trailing slash
let baseURL = import.meta.env.VITE_API_URL;
if (baseURL && baseURL.endsWith('/')) {
  baseURL = baseURL.slice(0, -1);
}
const api = axios.create({
  baseURL: baseURL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Debug: log API request details
    console.log('[API REQUEST]', config.method?.toUpperCase(), config.baseURL + config.url, config)
    return config
  },
  (error) => {
    console.error('[API REQUEST ERROR]', error)
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    // Debug: log API response details
    console.log('[API RESPONSE]', response.config.method?.toUpperCase(), response.config.baseURL + response.config.url, response)
    return response
  },
  (error) => {
    console.error('[API RESPONSE ERROR]', error)
    return Promise.reject(error)
  }
)
export default api
