import type { User } from '../types';

export const demoCredentials = {
  email: 'demo@3n-services.local',
  password: 'Demo3N2026!',
};

export const demoUser: User = {
  id: 900001,
  email: demoCredentials.email,
  first_name: 'Compte',
  last_name: 'Démo',
  phone: '',
  is_phone_verified: false,
  role: 'CLIENT',
  role_display: 'Client',
  is_active: true,
  profile: { company_name: '', address: '', city: 'Kinshasa', postal_code: '', country: 'RDC' },
};
