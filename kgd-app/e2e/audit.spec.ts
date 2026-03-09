import { test, expect } from '@playwright/test'

test.describe('Audit Log (admin only)', () => {
    test('audit page is accessible to admin', async ({ page }) => {
        await page.goto('/audit')
        await expect(page.getByRole('heading', { name: /audit log/i })).toBeVisible()
        await expect(page.getByText(/all key changes/i)).toBeVisible()
    })

    test('shows audit entries after activity', async ({ page }) => {
        await page.goto('/audit')
        // Table headers should appear
        await expect(page.getByText(/date \/ time/i)).toBeVisible()
        await expect(page.getByText(/entity/i)).toBeVisible()
        await expect(page.getByText(/action/i)).toBeVisible()
    })

    test('staff user is redirected away from audit log', async ({ browser }) => {
        test.setTimeout(60_000)

        // Create a fresh context with no saved state
        const ctx = await browser.newContext()
        const page = await ctx.newPage()

        // Log in as staff
        await page.goto('/login')
        await page.getByLabel('Email').fill('staff@kgd.local')
        await page.getByLabel('Password').fill('staff123')
        await page.getByRole('button', { name: /sign in/i }).click()
        await expect(page).toHaveURL(/dashboard/, { timeout: 15000 })

        // Try to access audit log
        await page.goto('/audit', { waitUntil: 'domcontentloaded' })
        // Should be redirected to dashboard
        await expect(page).toHaveURL(/dashboard/, { timeout: 15000 })

        await ctx.close()
    })
})
