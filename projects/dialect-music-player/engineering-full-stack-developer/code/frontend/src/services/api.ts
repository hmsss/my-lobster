import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

export default api

// 方言相关 API
export const dialectApi = {
  getCascade: () => api.get('/regions/cascade'),
  getCities: (provinceId: string) => api.get(`/regions/cities?province_id=${provinceId}`),
  getList: (cityId: string, page = 1, pageSize = 20) => 
    api.get(`/dialect/list?city_id=${cityId}&page=${page}&page_size=${pageSize}`),
  getDetail: (id: string) => api.get(`/dialect/${id}`),
  search: (keyword: string) => api.get(`/dialect/search?keyword=${encodeURIComponent(keyword)}`),
}

// 音乐相关 API
export const musicApi = {
  getList: (page = 1, pageSize = 50) => 
    api.get(`/music/list?page=${page}&page_size=${pageSize}`),
  upload: (file: File, name?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (name) formData.append('name', name)
    return api.post('/music/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  update: (id: string, data: { name?: string; artist?: string; album?: string }) => 
    api.patch(`/music/${id}`, data),
  delete: (id: string) => api.delete(`/music/${id}`),
  search: (keyword: string) => api.get(`/music/search?keyword=${encodeURIComponent(keyword)}`),
}
