import api from './client'

export const getAssets = () => api.get('/assets').then(r => r.data)
export const createAsset = (data: { name: string, category: string, value: number }) => api.post('/assets', data).then(r => r.data)
export const updateAsset = (id: number, data: { name: string, category: string, value: number }) => api.put(`/assets/${id}`, data).then(r => r.data)
export const deleteAsset = (id: number) => api.delete(`/assets/${id}`)

export const getSnapshots = () => api.get('/snapshots').then(r => r.data)
export const createSnapshot = (data: any) => api.post('/snapshots', data).then(r => r.data)

export const getCategories = () => api.get('/categories').then(r => r.data)
export const createCategory = (data: { name: string, color: string, budget: number }) => api.post('/categories', data).then(r => r.data)
export const updateCategory = (id: number, data: { name: string, color: string, budget: number }) => api.put(`/categories/${id}`, data).then(r => r.data)
export const deleteCategory = (id: number) => api.delete(`/categories/${id}`)

export const getTransactions = (month?: string) => api.get('/transactions', { params: { month } }).then(r => r.data)
export const createTransaction = (data: { desc: string, amount: number, date: string, categoryId: number }) => api.post('/transactions', data).then(r => r.data)
export const deleteTransaction = (id: number) => api.delete(`/transactions/${id}`)