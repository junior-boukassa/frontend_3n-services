import demoNoahImage from '../assets/demo/vehicles/toyota-noah-white.webp';
import type { Vehicle } from '../types';

export const DEMO_VEHICLE_ID = 900001;

export const demoVehicles: Vehicle[] = [{
  id: DEMO_VEHICLE_ID,
  owner: 900001,
  owner_email: '',
  owner_city: 'Kinshasa',
  brand: 'Toyota',
  model: 'Noah',
  year: null,
  registration_plate: 'DEMO',
  color: 'Blanc',
  category: 'VAN',
  seats: null,
  fuel_type: null,
  transmission: null,
  daily_price: '80',
  status: 'AVAILABLE',
  description: 'Véhicule confortable adapté aux déplacements professionnels, familiaux et événementiels.',
  has_gps: false,
  has_baby_seat: false,
  unlimited_mileage: false,
  average_rating: null,
  review_count: 0,
  created_at: '2026-07-11T00:00:00Z',
  images: [{ id: 900001, image: demoNoahImage, caption: 'Toyota Noah blanc' }],
}];

export const demoVehicleTerms = [
  'Service de 07h30 à 20h',
  'Carburant à la charge du client',
  'Heure supplémentaire après 20h : 15 USD',
  'Hors Kinshasa : 200 USD',
  'Chauffeur hors Kinshasa : 50 USD',
];
