import api from './client'

export const getAssets = () => api.get('/assets').then(r => r.data)
export const createAsset = (data: { name: string, category: string, value: number }) => api.post('/assets', data).then(r => r.data)
export const updateAsset = (id: number, data: { name: string, category: string, value: number }) => api.put(`/assets/${id}`, data).then(r => r.data)
export const deleteAsset = (id: number) => api.delete(`/assets/${id}`)

export const getSnapshots = () => api.get('/snapshots').then(r => r.data)
export const createSnapshot = (data: any) => api.post('/snapshots', data).then(r => r.data)
