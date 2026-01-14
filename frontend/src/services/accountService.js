import api from './api'

export const getAccountMe = async () => {
  const response = await api.get('/api/user/me')
  return response.data
}

export const updateMyEmail = async ({ newEmail, currentPassword }) => {
  const response = await api.put('/api/user/email', { newEmail, currentPassword })
  return response.data
}

export const changeMyPassword = async ({ currentPassword, newPassword }) => {
  const response = await api.put('/api/user/password', { currentPassword, newPassword })
  return response.data
}

export const createMyProfile = async ({ fullName, profileNumber }) => {
  const response = await api.post('/api/user/profiles', { fullName, profileNumber })
  return response.data
}

export const updateMyProfile = async (profileId, { fullName, profileNumber }) => {
  const response = await api.put(`/api/user/profiles/${profileId}`, { fullName, profileNumber })
  return response.data
}

export const deleteMyProfile = async (profileId) => {
  const response = await api.delete(`/api/user/profiles/${profileId}`)
  return response.data
}

export const createMyPaymentInfo = async ({ paymentMethod, accountIdentifier, isPrimary }) => {
  const response = await api.post('/api/user/payment-infos', { paymentMethod, accountIdentifier, isPrimary })
  return response.data
}

export const updateMyPaymentInfo = async (paymentInfoId, { paymentMethod, accountIdentifier, isPrimary }) => {
  const response = await api.put(`/api/user/payment-infos/${paymentInfoId}`, {
    paymentMethod,
    accountIdentifier,
    isPrimary,
  })
  return response.data
}

export const deleteMyPaymentInfo = async (paymentInfoId) => {
  const response = await api.delete(`/api/user/payment-infos/${paymentInfoId}`)
  return response.data
}
