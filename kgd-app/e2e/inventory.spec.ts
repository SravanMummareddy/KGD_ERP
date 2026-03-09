import { test, expect } from '@playwright/test'

test.describe('Inventory', () => {
    test('inventory page loads with correct h1 heading', async ({ page }) => {
        await page.goto('/inventory')
        // Use h1 only (exact), not h2 which says "Add New Inventory Item"
        await expect(page.locator('h1.page-title')).toHaveText('Inventory')

        // Seeded categories appear as h2 elements (uppercase text)
        const h2s = page.locator('h2')
        // At least one h2 should be a category (seeded: Brown Paper, Threads, etc.)
        await expect(h2s.filter({ hasText: /Brown Paper/i }).first()).toBeVisible()
    })

    test('records a stock purchase movement', async ({ page }) => {
        await page.goto('/inventory')

        // The "Record Stock Movement" card wraps the form
        // It's a <div class="card"> that contains <h2>Record Stock Movement</h2> + <form>
        const movementCard = page.locator('div.card').filter({ hasText: /record stock movement/i })

        // Select first real item (index 1 = skip placeholder)
        await movementCard.locator('select[name="inventoryItemId"]').selectOption({ index: 1 })
        await movementCard.locator('select[name="type"]').selectOption('PURCHASE')
        await movementCard.locator('input[name="quantity"]').fill('50')
        await movementCard.locator('input[name="rate"]').fill('45')
        await movementCard.locator('input[name="notes"]').fill('E2E test purchase')

        await movementCard.getByRole('button', { name: /record movement/i }).click()

        // Stock was 0, now 50.00 — visible in the table. Wait for 50.00 to appear.
        await expect(page.getByText('50.00').first()).toBeVisible({ timeout: 15000 })
    })

    test('adds a new inventory item', async ({ page }) => {
        await page.goto('/inventory')

        // The "Add New Inventory Item" card wraps the second form
        const addCard = page.locator('div.card').filter({ hasText: /add new inventory item/i })

        await addCard.locator('input[name="name"]').fill('E2E Test Material')
        await addCard.locator('input[name="category"]').fill('E2E Category')
        await addCard.locator('select[name="unit"]').selectOption('kg')
        await addCard.locator('input[name="currentStock"]').fill('0')

        await addCard.getByRole('button', { name: /add item/i }).click()

        // Wait for the new item to appear in the table
        await expect(page.getByRole('cell', { name: 'E2E Test Material' }).first()).toBeVisible({ timeout: 15000 })
    })
})
