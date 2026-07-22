import { lazy, Suspense, type ComponentType } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { PageLoader } from './components/ui';
import { useAuth } from './contexts/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { PublicLayout } from './components/public/PublicLayout';
import type { Role } from './types';
const named = <T,>(loader: () => Promise<T>, key: keyof T) =>
  lazy(async () => ({ default: (await loader())[key] as ComponentType }));
const LoginPage = named(() => import('./pages/auth/AuthPages'), 'LoginPage'),
  RegisterPage = named(() => import('./pages/auth/AuthPages'), 'RegisterPage'),
  ForgotPage = named(() => import('./pages/auth/AuthPages'), 'ForgotPage');
const DashboardPage = named(() => import('./pages/DashboardPage'), 'DashboardPage'),
  VehiclesPage = named(() => import('./pages/VehiclesPage'), 'VehiclesPage');
const PricingRecommendationsPage = named(
  () => import('./pages/PricingRecommendationsPage'),
  'PricingRecommendationsPage',
);
const BookingsPage = named(() => import('./pages/DataPages'), 'BookingsPage'),
  ReviewsPage = named(() => import('./pages/DataPages'), 'ReviewsPage'),
  UsersPage = named(() => import('./pages/DataPages'), 'UsersPage'),
  LogsPage = named(() => import('./pages/DataPages'), 'LogsPage');
const ProfilePage = named(() => import('./pages/ProfilePage'), 'ProfilePage'),
  SettingsPage = named(() => import('./pages/ProfilePage'), 'SettingsPage'),
  HelpPage = named(() => import('./pages/ProfilePage'), 'HelpPage');
const ForbiddenPage = named(() => import('./pages/StatusPages'), 'ForbiddenPage'),
  NotFoundPage = named(() => import('./pages/StatusPages'), 'NotFoundPage'),
  ServerErrorPage = named(() => import('./pages/StatusPages'), 'ServerErrorPage');
const HomePage = named(() => import('./pages/public/HomePage'), 'HomePage'),
  VehiclesPublicPage = named(
    () => import('./pages/public/VehiclesPublicPage'),
    'VehiclesPublicPage',
  ),
  VehicleDetailPage = named(() => import('./pages/public/VehicleDetailPage'), 'VehicleDetailPage');
const AboutPage = named(() => import('./pages/public/ContentPages'), 'AboutPage'),
  ContactPage = named(() => import('./pages/public/ContactPage'), 'ContactPage'),
  FaqPage = named(() => import('./pages/public/ContentPages'), 'FaqPage'),
  TermsPage = named(() => import('./pages/public/ContentPages'), 'TermsPage'),
  PrivacyPage = named(() => import('./pages/public/ContentPages'), 'PrivacyPage'),
  AgenciesPage = named(() => import('./pages/public/AgencyPages'), 'AgenciesPage'),
  AgencyDetailPage = named(() => import('./pages/public/AgencyPages'), 'AgencyDetailPage');
const ContactMessagesPage = named(
    () => import('./pages/admin/ContactMessagesPage'),
    'ContactMessagesPage',
  ),
  ContactMessageDetailPage = named(
    () => import('./pages/admin/ContactMessagesPage'),
    'ContactMessageDetailPage',
  );
const VehicleBookingPage = named(() => import('./pages/BookingFlowPages'), 'VehicleBookingPage'),
  BookingDetailPage = named(() => import('./pages/BookingFlowPages'), 'BookingDetailPage');
function Protected() {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <PageLoader />;
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: loc.pathname }} />;
}
function PublicOnly() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? <Navigate to="/app/dashboard" replace /> : <Outlet />;
}
function RoleRoute({ roles }: { roles: Role[] }) {
  const { user } = useAuth();
  return user && roles.includes(user.role) ? <Outlet /> : <Navigate to="/forbidden" replace />;
}
export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="vehicles" element={<VehiclesPublicPage />} />
          <Route path="vehicles/:id" element={<VehicleDetailPage />} />
          <Route path="agencies" element={<AgenciesPage />} />
          <Route path="agencies/:id" element={<AgencyDetailPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
        </Route>
        <Route element={<PublicOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPage />} />
          <Route path="/reset-password" element={<ForgotPage />} />
        </Route>
        <Route element={<Protected />}>
          <Route element={<RoleRoute roles={['CLIENT']} />}>
            <Route path="/vehicles/:id/book" element={<VehicleBookingPage />} />
          </Route>
          <Route path="/bookings/:id" element={<BookingDetailPage />} />
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/bookings" element={<Navigate to="/app/bookings" replace />} />
          <Route path="/reviews" element={<Navigate to="/app/reviews" replace />} />
          <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
          <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
          <Route
            path="/agency/dashboard"
            element={<RoleAlias roles={['AGENCY']} to="/app/dashboard" />}
          />
          <Route
            path="/agency/vehicles"
            element={<RoleAlias roles={['AGENCY']} to="/app/vehicles" />}
          />
          <Route
            path="/agency/vehicles/new"
            element={<RoleAlias roles={['AGENCY']} to="/app/vehicles" />}
          />
          <Route
            path="/agency/bookings"
            element={<RoleAlias roles={['AGENCY']} to="/app/bookings" />}
          />
          <Route
            path="/agency/reviews"
            element={<RoleAlias roles={['AGENCY']} to="/app/reviews" />}
          />
          <Route
            path="/admin/dashboard"
            element={<RoleAlias roles={['ADMIN']} to="/app/dashboard" />}
          />
          <Route path="/admin/users" element={<RoleAlias roles={['ADMIN']} to="/app/users" />} />
          <Route
            path="/admin/vehicles"
            element={<RoleAlias roles={['ADMIN']} to="/app/vehicles" />}
          />
          <Route
            path="/admin/bookings"
            element={<RoleAlias roles={['ADMIN']} to="/app/bookings" />}
          />
          <Route
            path="/admin/reviews"
            element={<RoleAlias roles={['ADMIN']} to="/app/reviews" />}
          />
          <Route
            path="/admin/activity-logs"
            element={<RoleAlias roles={['ADMIN']} to="/app/logs" />}
          />
          <Route element={<RoleRoute roles={['ADMIN']} />}>
            <Route path="/admin" element={<AppLayout />}>
              <Route path="contact-messages" element={<ContactMessagesPage />} />
              <Route path="contact-messages/:id" element={<ContactMessageDetailPage />} />
            </Route>
          </Route>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route element={<RoleRoute roles={['AGENCY', 'ADMIN']} />}>
              <Route path="pricing" element={<PricingRecommendationsPage />} />
            </Route>
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route element={<RoleRoute roles={['ADMIN']} />}>
              <Route path="users" element={<UsersPage />} />
              <Route path="logs" element={<LogsPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="/server-error" element={<ServerErrorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
function RoleAlias({ roles, to }: { roles: Role[]; to: string }) {
  const { user } = useAuth();
  return user && roles.includes(user.role) ? (
    <Navigate to={to} replace />
  ) : (
    <Navigate to="/forbidden" replace />
  );
}
