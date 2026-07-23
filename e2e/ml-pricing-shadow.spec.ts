import { mkdir } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

const artifacts = 'e2e-artifacts';
const password = 'E2ePricing3n!';

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Adresse e-mail').fill(email);
  await page.getByLabel('Mot de passe').fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/app\/dashboard/);
}

async function logout(page: Page) {
  await page.getByTitle('Déconnexion').click();
  await expect(page).toHaveURL(/\/login/);
}

async function requestRecommendation(page: Page, start: string, end: string) {
  await page.getByRole('button', { name: /Demander une recommandation/ }).click();
  const dialog = page.getByRole('heading', { name: 'Nouvelle recommandation' }).locator('..').locator('..');
  const vehicleOption = dialog.getByLabel('Véhicule').locator('option', { hasText: 'Toyota Hiace E2E' });
  await dialog.getByLabel('Véhicule').selectOption((await vehicleOption.getAttribute('value')) || '');
  await expect(dialog.getByRole('option', { name: 'Alice Locale' })).toHaveCount(1);
  await dialog.locator('select').nth(2).selectOption({ label: 'Alice Locale' });
  await dialog.getByLabel('Date de début').fill(start);
  await dialog.getByLabel('Date de fin').fill(end);
  await expect(dialog.getByText('Durée inclusive')).toBeVisible();
  await dialog.getByRole('button', { name: /Demander la recommandation/ }).click();
  await expect(page.getByText('Version du modèle')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Mode expérimental/).last()).toBeVisible();
}

async function closeDialog(page: Page) {
  await page.getByRole('button', { name: '×' }).click();
}

test.beforeAll(async () => {
  await mkdir(artifacts, { recursive: true });
});

test('parcours réel agence, décisions distinctes, filtres et contrôles visuels', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page, 'agence.a.e2e@3n.test');
  await page.goto('/app/pricing');
  await expect(page.getByRole('heading', { name: 'Tarification intelligente', level: 2 })).toBeVisible();
  await expect(page.getByText(/aucun prix n’est appliqué automatiquement/)).toBeVisible();
  await page.screenshot({ path: `${artifacts}/desktop-light-history.png`, fullPage: true });

  await requestRecommendation(page, '2026-08-10', '2026-08-14');
  await page.getByRole('button', { name: 'Accepter' }).click();
  await expect(page.getByText(/ne modifie pas le prix facturé/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Accepter' })).toHaveCount(0);
  await page.screenshot({ path: `${artifacts}/desktop-accepted.png`, fullPage: true });
  await closeDialog(page);

  await requestRecommendation(page, '2026-08-15', '2026-08-18');
  await page.getByRole('button', { name: 'Modifier' }).click();
  await page.getByLabel('Nouveau prix journalier en CDF').fill('300000.55');
  await page.getByLabel('Justification obligatoire').fill('Ajustement commercial E2E documenté');
  await page.getByRole('button', { name: 'Enregistrer la décision' }).click();
  await expect(page.getByText('300 000,55 CDF')).toBeVisible();
  await closeDialog(page);

  await requestRecommendation(page, '2026-08-19', '2026-08-22');
  await page.getByRole('button', { name: 'Refuser' }).click();
  await page.getByLabel('Justification obligatoire').fill('Recommandation refusée pendant le test E2E');
  await page.getByRole('button', { name: 'Enregistrer la décision' }).click();
  await expect(page.locator('.fixed.inset-0').getByText('Refusée', { exact: true })).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  });
  await page.screenshot({ path: `${artifacts}/desktop-dark-rejected.png`, fullPage: true });
  await closeDialog(page);

  await page.getByLabel('Filtrer par statut').selectOption('ACCEPTED');
  await expect(page.locator('article').getByText('Acceptée', { exact: true })).toBeVisible();
  await page.getByLabel('Filtrer par statut').selectOption('');
  await expect(page.getByRole('button', { name: 'Page suivante' })).toBeEnabled();
  await page.getByRole('button', { name: 'Page suivante' }).click();
  await expect(page.getByText(/page 2/)).toBeVisible();

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${artifacts}/tablet-dark-history.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${artifacts}/mobile-dark-history.png`, fullPage: true });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await logout(page);
  await login(page, 'agence.b.e2e@3n.test');
  await page.goto('/app/pricing');
  await expect(page.locator('article').getByText('Nissan Patrol E2E')).toBeVisible();
  await expect(page.locator('article').getByText('Toyota Hiace E2E')).toHaveCount(0);

  await logout(page);
  await login(page, 'admin.e2e@3n.test');
  await page.goto('/app/pricing');
  await expect(page.getByLabel('Filtrer par agence')).toBeVisible();
  await page.getByLabel('Filtrer par agence').selectOption({ label: 'Agence Beta' });
  await expect(page.locator('article').getByText('Nissan Patrol E2E')).toBeVisible();
  await expect(page.locator('article').getByText('Toyota Hiace E2E')).toHaveCount(0);

  await logout(page);
  await login(page, 'client.a.e2e@3n.test');
  await page.goto('/app/pricing');
  await expect(page.getByRole('heading', { name: 'Accès interdit' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${artifacts}/client-forbidden-mobile.png`, fullPage: true });
});

test('sélection client minimale et états visuels vide, chargement et erreur', async ({ page }) => {
  await login(page, 'agence.a.e2e@3n.test');
  await page.goto('/app/pricing');
  await page.getByRole('button', { name: /Demander une recommandation/ }).click();
  const dialog = page.getByRole('heading', { name: 'Nouvelle recommandation' }).locator('..').locator('..');
  await dialog.getByLabel('Rechercher un client autorisé').fill('Bob');
  await expect(dialog.getByRole('option', { name: /Bob/ })).toHaveCount(0);
  await dialog.getByLabel('Rechercher un client autorisé').fill('Alice');
  await expect(dialog.getByRole('option', { name: 'Alice Locale' })).toHaveCount(1);
  await closeDialog(page);

  await page.route('**/api/ai/pricing-recommendations/**', async (route) => {
    if (route.request().method() === 'GET') {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }) });
    } else await route.continue();
  });
  await page.reload();
  await page.screenshot({ path: `${artifacts}/desktop-loading.png`, fullPage: true });
  await expect(page.getByText('Aucune recommandation')).toBeVisible();
  await page.screenshot({ path: `${artifacts}/desktop-empty.png`, fullPage: true });
  await page.unroute('**/api/ai/pricing-recommendations/**');

  await page.route('**/api/ai/pricing-recommendations/**', (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ detail: 'Service temporairement indisponible' }) }),
  );
  await page.reload();
  await expect(page.getByText('Service temporairement indisponible')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${artifacts}/mobile-error.png`, fullPage: true });
});
