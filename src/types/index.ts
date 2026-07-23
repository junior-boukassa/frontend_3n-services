export type Role = 'CLIENT' | 'AGENCY' | 'ADMIN';
export type AgencyApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export interface Profile {
  company_name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
}
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_phone_verified: boolean;
  role: Role;
  role_display: string;
  is_active: boolean;
  agency_approval_status: AgencyApprovalStatus;
  agency_approval_status_display: string;
  profile: Profile;
}
export interface Vehicle {
  id: number;
  owner: number;
  agency_name: string;
  owner_city: string;
  location_city?: string | null;
  brand: string;
  model: string;
  year: number | null;
  registration_plate: string;
  color: string;
  category: 'CITY' | 'SEDAN' | 'SUV' | 'VAN' | 'PICKUP' | 'LUXURY' | null;
  seats: number | null;
  fuel_type: 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | null;
  transmission: 'MANUAL' | 'AUTOMATIC' | null;
  daily_price: string;
  status: 'AVAILABLE' | 'RESERVED' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  description?: string;
  has_gps: boolean;
  has_baby_seat: boolean;
  unlimited_mileage: boolean;
  average_rating: string | null;
  review_count: number;
  created_at: string;
  images: { id: number; image: string | null; caption: string; order: number }[];
}
export interface Booking {
  id: number;
  vehicle: number;
  vehicle_detail: Vehicle;
  client: number;
  client_email: string;
  client_name: string;
  client_phone: string;
  agency_email: string;
  agency_phone: string;
  payments: Payment[];
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  duration_days: number;
  total_price: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'FAILED' | 'COMPLETED';
  created_at: string;
  updated_at: string;
}
export type PaymentMethod = 'MOBILE_MONEY' | 'CARD' | 'CASH';
export interface Payment {
  id: number;
  booking: number;
  booking_vehicle: string;
  amount: string;
  method: PaymentMethod;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED';
  transaction_reference: string;
  provider_order_number: string;
  provider_reference: string;
  checkout_url: string;
  customer_phone: string;
  provider_message: string;
  created_at: string;
  updated_at: string;
}
export interface Agency {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  is_active: boolean;
  vehicles_count: number;
  average_rating: number | null;
  reviews_count: number;
  created_at: string;
  available_vehicles?: Vehicle[];
}
export type ContactStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'SPAM';
export interface ContactMessage {
  id: number;
  reference: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: ContactStatus;
  ip_address: string | null;
  created_at: string;
  updated_at: string;
}
export interface ActivityLog {
  id: number;
  user: number | null;
  user_email: string | null;
  action: string;
  module: string;
  description: string;
  ip_address: string | null;
  created_at: string;
}
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type PricingRecommendationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'MODIFIED'
  | 'REJECTED'
  | 'FALLBACK'
  | 'FAILED';
export type PricingTechnicalStatus = 'SUCCESS' | 'FALLBACK' | 'FAILED';
export interface PricingFactor {
  nom?: string;
  name?: string;
  direction?: string;
  impact_usd?: number | string;
  impact?: number | string;
  [key: string]: unknown;
}
export interface PricingRecommendation {
  id: string;
  vehicle: number;
  vehicle_label: string;
  agency_id: number;
  booking_id: number | null;
  start_date: string;
  end_date: string;
  rental_days: number;
  currency: 'CDF';
  base_daily_price: string;
  recommended_daily_price: string;
  manually_proposed_daily_price: string | null;
  status: PricingRecommendationStatus;
  technical_status: PricingTechnicalStatus;
  decision: 'NONE' | 'ACCEPT' | 'MODIFY' | 'REJECT';
  decision_reason: string;
  prediction_id: string;
  model_version: string;
  main_factors: PricingFactor[];
  input_snapshot: Record<string, unknown>;
  guardrails: Record<string, unknown>;
  error_reason: string;
  decided_by_id: number | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PricingClient {
  id: number;
  display_name: string;
}
