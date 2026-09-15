import { test, expect } from '@playwright/test';

test('participant completes a bilingual, country-aware professional assessment', async ({ page }) => {
  await page.route('**/api/assessments', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.country).toBe('PY');
    expect(body.phone).toBe('0981 234 567');
    expect(body.consent).toBe(true);
    expect(body.answers).toHaveLength(24);
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({
      id: 'result-1',
      participant: { name: 'Ana López', phone: '+595981234567', country: 'PY' },
      scores: { raw: { D: 18, I: 18, S: 18, C: 18 }, intensity: { D: 67, I: 67, S: 67, C: 67 }, composition: { D: 25, I: 25, S: 25, C: 25 }, ranking: ['D', 'I', 'S', 'C'], dominant: ['D', 'I', 'S', 'C'], isTie: true },
      profile: { isTie: true, primary: { code: 'D', name: 'Dominancia', label: 'Ejecutor' }, secondary: { code: 'I', name: 'Influencia', label: 'Influenciador' }, strengths: ['Decisión', 'Foco', 'Coraje'], watchOuts: ['Escucha', 'Detalles'], communication: 'Directa y objetiva.', decisionMaking: 'Rápida.', teamwork: 'Asume responsabilidad.', actions: ['Escuchar', 'Revisar riesgos'] },
      whatsappUrl: 'https://wa.me/595981234567?text=Resultado',
      completedAt: '2026-09-15T12:00:00.000Z'
    }) });
  });

  await page.goto('/');
  await page.getByRole('button', { name: /español/i }).click();
  await expect(page.getByLabel(/país/i)).toHaveValue('PY');
  await page.getByLabel(/nombre completo/i).fill('Ana López');
  await page.getByLabel(/whatsapp/i).fill('0981 234 567');
  await page.getByLabel(/autorizo/i).check();
  await page.getByRole('button', { name: /comenzar/i }).click();

  await expect(page.getByText(/perfil [disc]/i)).toHaveCount(0);
  for (let index = 0; index < 24; index += 1) {
    await page.getByRole('radio', { name: /parcialmente de acuerdo/i }).check();
    await page.getByRole('button', { name: index === 23 ? /ver resultado/i : /siguiente/i }).click();
  }

  await expect(page.getByRole('heading', { name: /tu mapa conductual/i })).toBeVisible();
  await expect(page.getByText(/empate/i)).toBeVisible();
  await expect(page.getByText(/composición.*100%/i)).toBeVisible();
  await expect(page.locator('#result')).toHaveAttribute('data-profile', 'D');
  await expect(page.locator('.score-d')).toContainText('25%');
  await expect(page.locator('.score-i')).toContainText('25%');
  await expect(page.locator('.score-s')).toContainText('25%');
  await expect(page.locator('.score-c')).toContainText('25%');
  await expect(page.getByRole('link', { name: /whatsapp/i })).toHaveAttribute('href', /wa\.me\/595981234567/);
});

test('country choice overrides language default and invalid phones stay blocked', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel(/país/i)).toHaveValue('BR');
  await page.getByLabel(/país/i).selectOption('PY');
  await page.getByLabel(/nome completo/i).fill('João Teste');
  await page.getByLabel(/whatsapp/i).fill('123');
  await page.getByLabel(/autorizo/i).check();
  await page.getByRole('button', { name: /começar/i }).click();
  await expect(page.getByRole('alert')).toContainText(/paraguaio|9 dígitos/i);
  await expect(page.getByRole('heading', { name: /questão/i })).toHaveCount(0);
});
