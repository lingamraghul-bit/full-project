import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401 / refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
          if (data.success) {
            localStorage.setItem('accessToken', data.data.accessToken);
            original.headers.Authorization = `Bearer ${data.data.accessToken}`;
            return api(original);
          }
        } catch {
          // Refresh failed
        }
      }

      // Clear tokens and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;

// ─── Auth API ───────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// ─── Patient API ────────────────────────────────────────
export const patientApi = {
  getAll: (params?: { search?: string; page?: number; limit?: number }) => api.get('/patients', { params }),
  getById: (id: string) => api.get(`/patients/${id}`),
  create: (data: any) => api.post('/patients', data),
  update: (id: string, data: any) => api.put(`/patients/${id}`, data),
  delete: (id: string) => api.delete(`/patients/${id}`),
};

// ─── Department API ─────────────────────────────────────
export const departmentApi = {
  getAll: () => api.get('/departments'),
  getById: (id: string) => api.get(`/departments/${id}`),
  create: (data: any) => api.post('/departments', data),
  update: (id: string, data: any) => api.put(`/departments/${id}`, data),
  delete: (id: string) => api.delete(`/departments/${id}`),
};

// ─── Doctor API ─────────────────────────────────────────
export const doctorApi = {
  getAll: (params?: { departmentId?: string; search?: string }) => api.get('/doctors', { params }),
  getById: (id: string) => api.get(`/doctors/${id}`),
  create: (data: any) => api.post('/doctors', data),
  update: (id: string, data: any) => api.put(`/doctors/${id}`, data),
  delete: (id: string) => api.delete(`/doctors/${id}`),
};

// ─── Staff API ──────────────────────────────────────────
export const staffApi = {
  getAll: () => api.get('/staff'),
  create: (data: any) => api.post('/staff', data),
  delete: (id: string) => api.delete(`/staff/${id}`),
};

// ─── Service API ────────────────────────────────────────
export const serviceApi = {
  getAll: (params?: { departmentId?: string }) => api.get('/services', { params }),
  create: (data: any) => api.post('/services', data),
  update: (id: string, data: any) => api.put(`/services/${id}`, data),
  delete: (id: string) => api.delete(`/services/${id}`),
};

// ─── Appointment API ────────────────────────────────────
export const appointmentApi = {
  getAll: (params?: any) => api.get('/appointments', { params }),
  getToday: () => api.get('/appointments/today'),
  getById: (id: string) => api.get(`/appointments/${id}`),
  create: (data: any) => api.post('/appointments', data),
  update: (id: string, data: any) => api.put(`/appointments/${id}`, data),
  cancel: (id: string) => api.patch(`/appointments/${id}/cancel`),
};

// ─── QR API ─────────────────────────────────────────────
export const qrApi = {
  generate: (patientId: string) => api.post('/qr/generate', { patientId }),
  verify: (qrToken: string) => api.post('/qr/verify', { qrToken }),
};

// ─── Queue API ──────────────────────────────────────────
export const queueApi = {
  getAll: () => api.get('/queues'),
  getByDepartment: (departmentId: string) => api.get(`/queues/department/${departmentId}`),
  getDisplay: (departmentId: string) => api.get(`/queues/display/${departmentId}`),
  checkin: (data: { qrToken: string; departmentId?: string }) => api.post('/queues/checkin', data),
  callNext: (departmentId: string, roomId?: string) => api.post(`/queues/call/${departmentId}`, { roomId }),
  startService: (entryId: string) => api.patch(`/queues/start/${entryId}`),
  completeService: (entryId: string, notes?: string) => api.patch(`/queues/complete/${entryId}`, { notes }),
  skip: (entryId: string) => api.patch(`/queues/skip/${entryId}`),
  cancel: (entryId: string) => api.patch(`/queues/cancel/${entryId}`),
  recall: (entryId: string) => api.patch(`/queues/recall/${entryId}`),
  transfer: (entryId: string, data: { targetDepartmentId: string; notes?: string }) => api.post(`/queues/transfer/${entryId}`, data),
};

// ─── Workflow API ───────────────────────────────────────
export const workflowApi = {
  create: (data: any) => api.post('/workflows', data),
  getByPatient: (patientId: string) => api.get(`/workflows/patient/${patientId}`),
  getStatus: (id: string) => api.get(`/workflows/${id}`),
  advance: (id: string) => api.post(`/workflows/${id}/advance`),
};

// ─── Dashboard API ──────────────────────────────────────
export const dashboardApi = {
  admin: () => api.get('/dashboard/admin'),
  reception: () => api.get('/dashboard/reception'),
  doctor: () => api.get('/dashboard/doctor'),
  patient: (patientId: string) => api.get(`/dashboard/patient/${patientId}`),
};

// ─── Analytics API ──────────────────────────────────────
export const analyticsApi = {
  overview: (days?: number) => api.get('/analytics/overview', { params: { days } }),
  department: (departmentId: string) => api.get(`/analytics/department/${departmentId}`),
  export: (params?: { type?: string; date?: string }) => api.get('/analytics/export', { params, responseType: 'blob' }),
};

// ─── AI API ─────────────────────────────────────────────
export const aiApi = {
  chat: (data: { message: string; conversationId?: string; context?: string; patientId?: string }) => api.post('/ai/chat', data),
  insights: () => api.get('/ai/insights'),
  conversations: (patientId: string) => api.get(`/ai/conversations/${patientId}`),
};

// ─── Notification API ───────────────────────────────────
export const notificationApi = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

// ─── Audit API ──────────────────────────────────────────
export const auditApi = {
  getAll: (params?: { page?: number; limit?: number; entity?: string; action?: string }) => api.get('/audit-logs', { params }),
};

// ─── Settings API ───────────────────────────────────────
export const settingsApi = {
  getAll: () => api.get('/settings'),
  update: (key: string, value: string) => api.put('/settings', { key, value }),
};
