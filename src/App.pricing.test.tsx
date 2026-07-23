import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('./contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 9, email: 'client@example.test', first_name: 'Client', role: 'CLIENT' },
    loading: false,
    logout: vi.fn(),
  }),
}));

describe('route de tarification protégée', () => {
  it('redirige un client vers la page 403 sans charger l’interface ML', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/app/pricing']}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('heading', { name: 'Accès interdit' })).toBeInTheDocument();
    expect(screen.queryByText('Demander une recommandation')).not.toBeInTheDocument();
  });
});
