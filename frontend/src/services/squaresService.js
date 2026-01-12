// Get all profiles with user email (for admin assignment)
export const getAllProfiles = async () => {
  const response = await api.get('/api/admin/profiles');
  return response.data;
}
import api from './api'
import { setToken, setUser } from '../utils/auth'

// Update a single cell in Google Sheets via backend
export const updateCellInSheet = async (spreadsheetId, poolName, row, col, value) => {
  const response = await api.post(`/sheets/${spreadsheetId}/${poolName}/cell?row=${row}&col=${col}&value=${encodeURIComponent(value)}`);
  return response.data;
}
export const getAfcScoresFromSheet = async (spreadsheetId, poolName) => {
  const response = await api.get(`/sheets/${spreadsheetId}/${poolName}/afc-scores`);
  return response.data;
}
export const getNfcScoresFromSheet = async (spreadsheetId, poolName) => {
  const response = await api.get(`/sheets/${spreadsheetId}/${poolName}/nfc-scores`);
  return response.data;
}
export const syncGridToSheet = async (spreadsheetId, sheetName, gridData) => {
  const response = await api.post(`/sheets/${spreadsheetId}/${sheetName}/grid`, gridData);
  return response.data;
}
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password })
  const { token, ...user } = response.data
  console.log('Login response token:', token)
  setToken(token)
  setUser(user)
  return response.data
}

export const signup = async (signupData) => {
  const response = await api.post('/auth/signup', signupData)
  return response.data
}

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
}
export const getActivePools = async () => {
  const response = await api.get('/api/pools/active')
  return response.data
}

export const getPoolById = async (poolId) => {
  const response = await api.get(`/api/pools/${poolId}`)
  return response.data
}

export const getSquaresByPool = async (poolId) => {
  const response = await api.get(`/api/squares/pool/${poolId}`)
  return response.data
}

export const claimSquare = async (claimData) => {
  const response = await api.post('/api/squares/claim', claimData)
  return response.data
}

export const unclaimSquare = async (poolId, rowPosition, colPosition) => {
  const response = await api.delete(`/api/squares/pool/${poolId}/${rowPosition}/${colPosition}`)
  return response.data
}

export const getPoolStats = async (poolId) => {
  const response = await api.get(`/api/squares/pool/${poolId}/stats`)
  return response.data
}

export const getAllScores = async () => {
  const response = await api.get('/api/scores')
  return response.data
}

export const createPool = async (poolData) => {
  const response = await api.post('/api/admin/pools', poolData)
  return response.data
}

export const getAllPools = async () => {
  const response = await api.get('/api/admin/pools')
  return response.data
}

export const togglePoolStatus = async (poolId) => {
  const response = await api.patch(`/api/admin/pools/${poolId}/toggle`)
  return response.data
}

export const updatePool = async (poolId, poolData) => {
  const response = await api.put(`/api/admin/pools/${poolId}`, poolData)
  return response.data
}

export const deletePool = (poolId) => api.delete(`/api/admin/pools/${poolId}`)

export const getAllUsers = () => api.get('/api/admin/users')

export const makeUserAdmin = (userId) => api.patch(`/api/admin/users/${userId}/make-admin`);

export const getUserById = (userId) => api.get(`/api/admin/users/${userId}`);

export const updateUser = (userId, userData) => api.put(`/api/admin/users/${userId}`, userData);

export const createProfile = (userId, profileData) => api.post(`/api/admin/users/${userId}/profiles`, profileData);

export const updateProfile = (profileId, profileData) => api.put(`/api/admin/profiles/${profileId}`, profileData);

export const deleteProfile = (profileId) => api.delete(`/api/admin/profiles/${profileId}`);

export const createPaymentInfo = (userId, paymentInfoData) => api.post(`/api/admin/users/${userId}/payment-infos`, paymentInfoData);

export const updatePaymentInfo = (paymentInfoId, paymentInfoData) => api.put(`/api/admin/payment-infos/${paymentInfoId}`, paymentInfoData);

export const deletePaymentInfo = (paymentInfoId) => api.delete(`/api/admin/payment-infos/${paymentInfoId}`);
