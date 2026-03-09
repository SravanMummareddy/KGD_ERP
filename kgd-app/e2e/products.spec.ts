import { test, expect } from '@playwright/test'

test.describe('Products', () => {
    test('products page lists seeded products', async ({ page }) => {
        await page.goto('/products')
        await expect(page.locator('h1.page-title')).toHaveText('Products')
        await expect(page.getByText('10 inch Silver Plate 80 GSM').first()).toBeVisible()
    })

    test('creates a new product', async ({ page }) => {
        await page.goto('/products/new')

        // The form fields — use #id selectors or name selectors
        await page.locator('input[name="name"]').fill('E2E Test Plate')
        await page.locator('select[name="type"]').selectOption('PLATE')
        await page.locator('input[name="sizeInches"]').fill('8')
        await page.locator('input[name="gsm"]').fill('80')
        await page.locator('input[name="defaultRate"]').fill('75')

        await Promise.all([
            page.waitForURL(/\/products/, { timeout: 15000 }),
            page.getByRole('button', { name: /save|create/i }).click(),
        ])

        // Use .first() to avoid strict-mode violation if text appears in multiple table cells
        await expect(page.getByText('E2E Test Plate').first()).toBeVisible()
    })
})
