import { api } from '../api/client';
import { endpoints } from '../config/endpoints';
import type {
  ActivityLog,
  Booking,
  Paginated,
  Payment,
  Review,
  PublicReview,
  Role,
  User,
  Vehicle,
  Agency,
  ContactMessage,
  ContactStatus,
  PublicGlobalReview,
} from '../types';
async function allPages<T>(url: string, params?: Record<string, string | number>): Promise<T[]> {
  const first = (await api.get<Paginated<T> | T[]>(url, { params })).data;
  if (Array.isArray(first)) return first;
  const items = [...first.results];
  let next = first.next;
  while (next) {
    const page = (await api.get<Paginated<T>>(next)).data;
    items.push(...page.results);
    next = page.next;
  }
  return items;
}
export const authService = {
  login: (data: { email: string; password: string }) =>
    api.post<{ access: string; refresh: string; user: User }>(endpoints.auth.login, data),
  register: (data: Record<string, string>) => api.post<User>(endpoints.auth.register, data),
  profile: () => api.get<User>(endpoints.auth.profile),
  updateProfile: (data: Partial<User>) => api.patch<User>(endpoints.auth.profile, data),
  changePassword: (data: { old_password: string; new_password: string }) =>
    api.post(endpoints.auth.password, data),
  logout: (refresh: string | null) => api.post(endpoints.auth.logout, { refresh }),
};
export const dataService = {
  vehicles: async (params?: Record<string, string | number>) =>
    allPages<Vehicle>(endpoints.vehicles, params),
  vehicle: (id: number) => api.get<Vehicle>(`${endpoints.vehicles}${id}/`),
  saveVehicle: (data: Partial<Vehicle>, id?: number) =>
    id ? api.patch(`${endpoints.vehicles}${id}/`, data) : api.post(endpoints.vehicles, data),
  deleteVehicle: (id: number) => api.delete(`${endpoints.vehicles}${id}/`),
  bookings: async () => allPages<Booking>(endpoints.bookings),
  booking: (id: number) => api.get<Booking>(`${endpoints.bookings}${id}/`).then((r) => r.data),
  createBooking: (data: { vehicle_id: number; start_date: string; end_date: string }) =>
    api.post(endpoints.bookings, data),
  bookingStatus: (id: number, status: Booking['status']) =>
    api.post(`${endpoints.bookings}${id}/set_status/`, { status }),
  cancelBooking: (id: number) => api.post(`${endpoints.bookings}${id}/cancel/`),
  payments: async () => allPages<Payment>(endpoints.payments),
  payment: (id: number) => api.get<Payment>(`${endpoints.payments}${id}/`).then((r) => r.data),
  createPayment: (data: { booking_id: number; method: Payment['method']; amount: string }) =>
    api.post(endpoints.payments, data),
  confirmPayment: (id: number) =>
    api.post(`${endpoints.payments}${id}/confirm/`, { simulate_success: true }),
  reviews: async () => allPages<Review>(endpoints.reviews),
  createReview: (data: { booking: number; rating: number; comment: string }) =>
    api.post(endpoints.reviews, data),
  publicReviews: (vehicleId: number) =>
    api
      .get<PublicReview[]>(`${endpoints.reviews}for-vehicle/`, {
        params: { vehicle_id: vehicleId },
      })
      .then((r) => r.data),
  availability: (vehicle_id: number, start: string, end: string) =>
    api
      .get<{ available: boolean }>(`${endpoints.bookings}availability_check/`, {
        params: { vehicle_id, start, end },
      })
      .then((r) => r.data),
  users: async () => allPages<User>(endpoints.auth.users),
  updateUser: (id: number, data: Partial<User>) => api.patch(`${endpoints.auth.users}${id}/`, data),
  deleteUser: (id: number) => api.delete(`${endpoints.auth.users}${id}/`),
  logs: async () => allPages<ActivityLog>(endpoints.logs),
  dashboard: (role: Role) => api.get<Record<string, unknown>>(endpoints.dashboard(role)),
};

export const agencyService = {
  list: () => allPages<Agency>(endpoints.agencies),
  detail: (id: number) => api.get<Agency>(`${endpoints.agencies}${id}/`).then((r) => r.data),
};
export const contactService = {
  send: (data: { name: string; email: string; phone?: string; subject: string; message: string }) =>
    api.post<{ message: string; reference: string }>(endpoints.contact, data).then((r) => r.data),
  list: () => allPages<ContactMessage>(endpoints.adminContacts),
  detail: (id: number) =>
    api.get<ContactMessage>(`${endpoints.adminContacts}${id}/`).then((r) => r.data),
  updateStatus: (id: number, status: ContactStatus) =>
    api.patch<ContactMessage>(`${endpoints.adminContacts}${id}/`, { status }).then((r) => r.data),
};
export const publicReviewService = {
  list: (params?: Record<string, string | number>) =>
    allPages<PublicGlobalReview>(`${endpoints.reviews}public/`, params),
};
