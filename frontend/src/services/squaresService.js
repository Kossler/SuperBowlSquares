import api from './api'
import { setToken, setUser } from '../utils/auth'

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password })
  const { token, ...user } = response.data
  setToken(token)
  setUser(user)
  return response.data
}

export const signup = async (signupData) => {
  const response = await api.post('/auth/signup', signupData)
  const { token, ...user } = response.data
  setToken(token)
  setUser(user)
  return response.data
}

export const getActivePools = async () => {
  const response = await api.get('/pools/active')
  return response.data
}

export const getPoolById = async (poolId) => {
  const response = await api.get(`/pools/${poolId}`)
  return response.data
}

export const getSquaresByPool = async (poolId) => {
  const response = await api.get(`/squares/pool/${poolId}`)
  return response.data
}

export const claimSquare = async (claimData) => {
  const response = await api.post('/squares/claim', claimData)
  return response.data
}

export const unclaimSquare = async (poolId, rowPosition, colPosition) => {
  const response = await api.delete(`/squares/pool/${poolId}/${rowPosition}/${colPosition}`)
  return response.data
}

export const getPoolStats = async (poolId) => {
  const response = await api.get(`/squares/pool/${poolId}/stats`)
  return response.data
}

export const getAllScores = async () => {
  const response = await api.get('/scores')
  return response.data
}

export const createPool = async (poolData) => {
  const response = await api.post('/admin/pools', poolData)
  return response.data
}

export const getAllPools = async () => {
  const response = await api.get('/admin/pools')
  return response.data
}

export const togglePoolStatus = async (poolId) => {
  const response = await api.patch(`/admin/pools/${poolId}/toggle`)
  return response.data
}

export const updatePool = async (poolId, poolData) => {
  const response = await api.put(`/admin/pools/${poolId}`, poolData)
  return response.data
}

export const deletePool = async (poolId) => {
  const response = await api.delete(`/admin/pools/${poolId}`)
  return response.data
}
