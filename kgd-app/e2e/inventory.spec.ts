import { test, expect } from '@playwright/test'

test.describe('Inventory', () => {
    test('inventory page shows seeded items grouped by category', async ({ page }) => {
        await page.goto('/inventory')
        await expect(page.getByRole('heading', { name: /inventory/i })).toBeVisible()
        // Seeded categories
        await expect(page.getByText(/brown paper/i).first()).toBeVisible()
        await expect(page.getByText(/threads/i)).toBeVisible()
        await expect(page.getByText(/films/i)).toBeVisible()
    })

    test('records a stock movement (purchase)', async ({ page }) => {
        await page.goto('/inventory')

        // Select first item in dropdown
        const select = page.locator('select[name="inventoryItemId"]')
        await select.selectOption({ index: 1 })

        await page.locator('select[name="type"]').selectOption('PURCHASE')
        await page.locator('input[name="quantity"]').fill('50')
        await page.locator('input[name="rate"]').fill('45')
        await page.locator('input[name="notes"]').fill('E2E test purchase')

        await page.getByRole('button', { name: /record movement/i }).click()

        // Page reloads; stock should be updated (50 > 0)
        await page.waitForURL(/\/inventory/)
        // Find a cell with value > 0 (the 50 we just added)
        await expect(page.getByText(/50\.00/)).toBeVisible()
    })

    test('adds a new inventory item', async ({ page }) => {
        await page.goto('/inventory')

        await page.locator('input[name="name"]').fill('E2E Test Material')
        await page.locator('input[name="category"]').fill('E2E Category')
        await page.locator('select[name="unit"]').selectOption('kg')
        await page.locator('input[name="currentStock"]').fill('100')

        await page.getByRole('button', { name: /add item/i }).click()

        await page.waitForURL(/\/inventory/)
        await expect(page.getByText(/E2E Test Material/i)).toBeVisible()
    })
})
