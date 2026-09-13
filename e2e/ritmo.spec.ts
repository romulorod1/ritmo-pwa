import { expect, test, type Page } from '@playwright/test'

const openAtPlanStart = async (page: Page) => {
  await page.clock.install({ time: new Date('2026-09-11T12:00:00-03:00') })
  await page.goto('/')
}

test('fluxos principais persistem após recarregar', async ({ page }) => {
  await openAtPlanStart(page)
  await expect(page.getByRole('heading', { name: '11–12% até 30/10' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ponte de entrada' })).toBeVisible()

  await page.getByRole('button', { name: /Pré-treino/ }).click()
  await expect(page.getByRole('button', { name: /Pré-treino/ })).toHaveClass(/is-checked/)

  const weight = page.getByLabel('Peso de hoje')
  await weight.fill('65.2')
  await page.getByRole('button', { name: 'Registrar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Média 65.20 kg' })).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Peso de hoje')).toHaveValue('65.2')
  await expect(page.getByRole('button', { name: /Pré-treino/ })).toHaveClass(/is-checked/)

  await page.getByRole('button', { name: 'Treinos' }).click()
  await expect(page.getByRole('heading', { name: 'Treinos' })).toBeVisible()
  await expect(page.getByText('Boxe ou técnica leve + zona 2')).toBeVisible()

  await page.getByRole('button', { name: 'Evolução' }).click()
  await expect(page.getByRole('heading', { name: 'Evolução' })).toBeVisible()
  const latestRecord = page.getByRole('button', { name: 'Editar 2026-09-11' }).locator('..')
  await expect(latestRecord.getByText('65.20 kg', { exact: true })).toBeVisible()
})

test('modo treino conduz rounds e pausa cronometrada', async ({ page }) => {
  await openAtPlanStart(page)
  await page.getByRole('button', { name: 'Iniciar treino' }).click()
  await expect(page.getByRole('dialog', { name: 'Modo treino' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Sombra técnica' })).toBeVisible()
  await page.getByRole('button', { name: 'Iniciar round' }).click()
  await expect(page.getByText('Round em curso')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pausar' })).toBeVisible()
  await page.getByRole('button', { name: 'Pular' }).click()
  await expect(page.getByText('Descanso')).toBeVisible()
})

test('exporta e restaura backup validado', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Ajustes' }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /Exportar backup JSON/ }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^backup-ritmo-\d{4}-\d{2}-\d{2}\.json$/)
  const backupPath = await download.path()
  expect(backupPath).toBeTruthy()

  await page.getByLabel('Energia').fill('2100')
  await page.getByRole('button', { name: 'Salvar metas' }).click()
  await expect(page.getByText('Metas atualizadas no aparelho.')).toBeVisible()

  page.once('dialog', (dialog) => dialog.accept())
  await page.locator('input[type=file]').setInputFiles(backupPath!)
  await expect(page.getByText('Backup restaurado com sucesso.')).toBeVisible()
  await expect(page.getByLabel('Energia')).toHaveValue('2000')
})

test('carrega e opera sem rede após o primeiro acesso', async ({ page, context }) => {
  await openAtPlanStart(page)
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  await context.setOffline(true)
  try {
    await page.reload()
    await expect(page.getByText('Offline')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Ponte de entrada' })).toBeVisible()
    await page.getByRole('button', { name: 'Treinos' }).click()
    await expect(page.getByRole('heading', { name: 'Treinos' })).toBeVisible()
  } finally {
    await context.setOffline(false)
  }
})
