import axios, { AxiosInstance, AxiosError } from 'axios'

declare const importMeta: any
const API_URL = 'http://localhost:4000/api'

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('company')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth endpoints
export const authAPI = {
  registerCompany: (data: {
    company_name: string
    slug: string
    contact_email: string
    contact_phone?: string
    admin_name: string
    admin_email: string
    password: string
  }) => api.post('/auth/register-company', data),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  getMe: () => api.get('/auth/me'),
}

// Events endpoints
export const eventsAPI = {
  listMyEvents: () => api.get('/events'),

  listPublished: () => api.get('/events', { params: {} }),

  createEvent: (data: {
    title: string
    description?: string
    venue?: string
    city?: string
    event_start: string
    event_end: string
    sales_start: string
    sales_end: string
    cover_image_url?: string
  }) => api.post('/events', data),

  getEvent: (id: string) => api.get(`/events/${id}`),

  updateEvent: (
    id: string,
    data: {
      title?: string
      description?: string
      venue?: string
      city?: string
      event_start?: string
      event_end?: string
      sales_start?: string
      sales_end?: string
      status?: string
      cover_image_url?: string
    }
  ) => api.patch(`/events/${id}`, data),

  publishEvent: (id: string) => api.post(`/events/${id}/publish`),

  getAvailability: (id: string) =>
    api.get(`/events/${id}/availability`),

  getStats: (id: string) => api.get(`/events/${id}/stats`),
}

// Ticket Types endpoints
export const ticketTypesAPI = {
  listByEvent: (eventId: string) =>
    api.get(`/events/${eventId}/ticket-types`),

  create: (eventId: string, data: {
    name: string
    price_etb: number
    quantity_total: number
    sales_start?: string
    sales_end?: string
    max_per_order?: number
    is_active?: boolean
  }) => api.post(`/events/${eventId}/ticket-types`, data),

  update: (id: string, data: {
    name?: string
    price_etb?: number
    quantity_total?: number
    sales_start?: string
    sales_end?: string
    max_per_order?: number
    is_active?: boolean
  }) => api.patch(`/ticket-types/${id}`, data),
}

// Orders endpoints
export const ordersAPI = {
  create: (data: {
    event_id: string
    buyer_name: string
    buyer_email: string
    buyer_phone: string
    items: Array<{
      ticket_type_id: string
      quantity: number
      holder_name?: string
    }>
  }) => api.post('/orders', data),

  getOrder: (id: string) => api.get(`/orders/${id}`),

  initiatePay: (orderId: string, gateway: string = 'chapa') =>
    api.post(`/orders/${orderId}/pay`, { gateway }),
}

// Payments endpoints
export const paymentsAPI = {
  verifyChapa: (tx_ref: string) =>
    api.get(`/payments/verify/chapa?tx_ref=${tx_ref}`),

  verifyTelebirr: (transactionId: string) =>
    api.get(`/payments/verify/telebirr?transactionId=${transactionId}`),

  verifyCBE: (transactionRef: string) =>
    api.get(`/payments/verify/cbe_birr?transactionRef=${transactionRef}`),
}

// Tickets endpoints
export const ticketsAPI = {
  getTicket: (code: string) => api.get(`/tickets/${code}`),

  checkIn: (code: string, staffId?: string) =>
    api.post(`/tickets/${code}/check-in`, { staff_id: staffId }),
}

// Companies endpoints
export const companiesAPI = {
  getCompany: (id: string) => api.get(`/companies/${id}`),
}

export default api
