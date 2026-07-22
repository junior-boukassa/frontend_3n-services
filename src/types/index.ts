export type Role = 'CLIENT' | 'AGENCY' | 'ADMIN';
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
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  duration_days: number;
  total_price: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  created_at: string;
  updated_at: string;
}
export interface Review {
  id: number;
  booking: number;
  client: number;
  client_email: string;
  vehicle_plate: string;
  agency_email: string;
  rating: number;
  comment: string;
  created_at: string;
}
export interface PublicReview {
  id: number;
  client_first_name: string;
  rating: number;
  comment: string;
  created_at: string;
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
export interface PublicGlobalReview {
  id: number;
  rating: number;
  comment: string;
  vehicle: { id: number; brand: string; model: string };
  agency: { id: number; name: string };
  author_display_name: string;
  created_at: string;
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
