import { test, expect } from '@playwright/test'

/**
 * auth.spec.ts
 * 
 * These tests need a FRESH browser context with NO stored auth state.
 * We override storageState per-test by creating new browser contexts.
 */

test.describe('Login page', () => {
    test('redirects unauthenticated users from /dashboard to /login', async ({ browser }) => {
        // Fresh context — no cookies, no auth
        const ctx = await browser.newContext({ storageState: undefined })
        const page = await ctx.newPage()

        await page.goto('/dashboard')
        await page.waitForURL(/login/, { timeout: 15000 })
        await expect(page).toHaveURL(/login/)
        await ctx.close()
    })

    test('shows error on wrong credentials', async ({ browser }) => {
        const ctx = await browser.newContext({ storageState: undefined })
        const page = await ctx.newPage()

        await page.goto('/login')
        await page.locator('#email').fill('admin@kgd.local')
        await page.locator('#password').fill('wrongpassword')
        await page.getByRole('button', { name: /sign in/i }).click()

        await expect(page.getByText(/invalid email or password/i)).toBeVisible()
        await expect(page).toHaveURL(/login/)
        await ctx.close()
    })

    test('logs in successfully as admin', async ({ browser }) => {
        const ctx = await browser.newContext({ storageState: undefined })
        const page = await ctx.newPage()

        await page.goto('/login')
        await page.locator('#email').fill('admin@kgd.local')
        await page.locator('#password').fill('admin123')
        await page.getByRole('button', { name: /sign in/i }).click()

        await page.waitForURL(/dashboard/, { timeout: 15000 })
        await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
        await ctx.close()
    })

    test('logs in successfully as staff', async ({ browser }) => {
        const ctx = await browser.newContext({ storageState: undefined })
        const page = await ctx.newPage()

        await page.goto('/login')
        await page.locator('#email').fill('staff@kgd.local')
        await page.locator('#password').fill('staff123')
        await page.getByRole('button', { name: /sign in/i }).click()

        await page.waitForURL(/dashboard/, { timeout: 15000 })
        await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
        await ctx.close()
    })
})
