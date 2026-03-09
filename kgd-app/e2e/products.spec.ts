import { test, expect } from '@playwright/test'

test.describe('Products', () => {
    test('products page lists seeded products', async ({ page }) => {
        await page.goto('/products')
        await expect(page.getByRole('heading', { name: /products/i })).toBeVisible()
        await expect(page.getByText(/10 inch Silver Plate/i)).toBeVisible()
    })

    test('creates a new product', async ({ page }) => {
        await page.goto('/products/new')
        await expect(page.getByRole('heading', { name: /new product|add product/i })).toBeVisible()

        await page.getByLabel(/product name/i).fill('E2E Test Plate')
        await page.locator('select[name="type"]').selectOption('PLATE')
        await page.getByLabel(/size.*inch/i).fill('8')
        await page.getByLabel(/gsm/i).fill('80')
        await page.getByLabel(/unit/i).selectOption('packet')
        await page.getByLabel(/default rate/i).fill('75')

        await page.getByRole('button', { name: /save|create/i }).click()

        // Should appear in the list
        await page.waitForURL(/\/products/)
        await expect(page.getByText(/E2E Test Plate/i)).toBeVisible()
    })
})
