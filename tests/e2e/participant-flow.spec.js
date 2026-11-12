import { test, expect } from '@playwright/test';

test('participant completes a bilingual, country-aware professional assessment', async ({ page }) => {
  await page.route('**/api/assessments', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.country).toBe('PY');
    expect(body.phone).toBe('0981 234 567');
    expect(body.consent).toBe(true);
    expect(body.answers).toHaveLength(10);
    for (const group of body.answers) {
      expect([...group].sort()).toEqual([1, 2, 3, 4]);
    }
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({
      id: 'result-1',
      participant: { name: 'Ana López', phone: '+595981234567', country: 'PY' },
      scores: { raw: { D: 25, I: 25, S: 25, C: 25 }, intensity: { D: 50, I: 50, S: 50, C: 50 }, composition: { D: 25, I: 25, S: 25, C: 25 }, ranking: ['D', 'I', 'S', 'C'], dominant: ['D', 'I', 'S', 'C'], isTie: true },
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
  for (let index = 0; index < 10; index += 1) {
    // Alterna o padrão para produzir empate balanceado: pares [4,3,2,1], ímpares [1,2,3,4].
    const values = index % 2 === 0 ? [4, 3, 2, 1] : [1, 2, 3, 4];
    for (let option = 0; option < 4; option += 1) {
      await page.locator('.rank-row').nth(option).locator('label.rank-choice', { hasText: String(values[option]) }).click();
      await expect(page.locator('.rank-row').nth(option).locator(`input[value="${values[option]}"]`)).toBeChecked();
    }
    await page.getByRole('button', { name: index === 9 ? /ver resultado/i : /siguiente/i }).click();
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
  await expect(page.getByRole('heading', { name: /grupo/i })).toHaveCount(0);
});

test('shows red duplicate alert when repeating a number, allows deselecting, and clears group selections', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel(/nome completo/i).fill('Carlos Silva');
  await page.getByLabel(/whatsapp/i).fill('11999998888');
  await page.getByLabel(/autorizo/i).check();
  await page.getByRole('button', { name: /começar/i }).click();

  const row0 = page.locator('.rank-row').nth(0);
  const row1 = page.locator('.rank-row').nth(1);
  const clearBtn = page.locator('#clear-selection');

  await expect(clearBtn).toBeDisabled();

  // Select 4 on row 0
  await row0.locator('label.rank-choice', { hasText: '4' }).click();
  await expect(row0.locator('input[value="4"]')).toBeChecked();
  await expect(clearBtn).toBeEnabled();

  // Attempt to repeat 4 on row 1 -> blocked + red conflict warning
  const dupChoice = row1.locator('label.rank-choice', { hasText: '4' });
  await dupChoice.click();
  await expect(row1.locator('input[value="4"]')).not.toBeChecked();
  await expect(row0.locator('input[value="4"]')).toBeChecked();
  await expect(page.locator('#rank-error')).toBeVisible();
  await expect(page.locator('#rank-error')).toContainText(/já escolheu o número 4/i);
  await expect(dupChoice).toHaveClass(/is-conflict/);

  // Toggle row 0 off by clicking 4 again
  await row0.locator('label.rank-choice', { hasText: '4' }).click();
  await expect(row0.locator('input[value="4"]')).not.toBeChecked();
  await expect(clearBtn).toBeDisabled();

  // Fill all 4 options, then clear the entire group using Limpar seleção
  await row0.locator('label.rank-choice', { hasText: '4' }).click();
  await row1.locator('label.rank-choice', { hasText: '3' }).click();
  await page.locator('.rank-row').nth(2).locator('label.rank-choice', { hasText: '2' }).click();
  await page.locator('.rank-row').nth(3).locator('label.rank-choice', { hasText: '1' }).click();
  await expect(page.locator('#next')).toBeEnabled();

  await clearBtn.click();
  for (let i = 0; i < 4; i += 1) {
    await expect(page.locator('.rank-row').nth(i).locator('input:checked')).toHaveCount(0);
  }
  await expect(clearBtn).toBeDisabled();
  await expect(page.locator('#next')).toBeDisabled();
});
