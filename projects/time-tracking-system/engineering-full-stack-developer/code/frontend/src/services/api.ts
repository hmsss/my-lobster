import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 请求拦截器 - 添加 Token
api.interceptors.request.use((config) => {
  const authStorage = localStorage.getItem('auth-storage')
  if (authStorage) {
    try {
      const { state } = JSON.parse(authStorage)
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`
      }
    } catch (e) {}
  }
  return config
})

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// 认证 API
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me'),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.put('/auth/password', { oldPassword, newPassword }),
}

// 工时 API
export const timesheetApi = {
  create: (data: any) => api.post('/timesheet', data),
  list: (params?: any) => api.get('/timesheet', { params }),
  get: (id: number) => api.get(`/timesheet/${id}`),
  update: (id: number, data: any) => api.put(`/timesheet/${id}`, data),
  delete: (id: number) => api.delete(`/timesheet/${id}`),
}

// 项目 API
export const projectApi = {
  list: (status?: string) => api.get('/projects', { params: { status } }),
  create: (data: any) => api.post('/projects', data),
  update: (id: number, data: any) => api.put(`/projects/${id}`, data),
  archive: (id: number) => api.post(`/projects/${id}/archive`, {}),
  activate: (id: number) => api.post(`/projects/${id}/activate`, {}),
}

// 统计 API
export const statsApi = {
  summary: () => api.get('/stats/summary'),
  personal: (type?: string, date?: string) =>
    api.get('/stats/personal', { params: { type, date } }),
  team: (params?: any) => api.get('/stats/team', { params }),
}

// 导出 API
export const exportApi = {
  export: (params?: any) => api.get('/export', { params, responseType: 'blob' }),
}
