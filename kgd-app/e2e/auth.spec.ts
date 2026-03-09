import { test, expect } from '@playwright/test'

// ─────────────────────────────────────────────────────────────────
// AUTH TESTS  (unauthenticated browser — no stored session)
// ─────────────────────────────────────────────────────────────────
// NOTE: these are excluded from the chromium project (which uses stored auth).
// Run with:  npx playwright test auth.spec.ts --project=setup
test.use({ storageState: undefined as unknown as string })

test.describe('Login page', () => {
    test('redirects unauthenticated users from /dashboard to /login', async ({ page }) => {
        await page.goto('/dashboard')
        await page.waitForURL(/login/)
        await expect(page).toHaveURL(/login/)
    })

    test('shows error on wrong credentials', async ({ page }) => {
        await page.goto('/login')
        await page.getByLabel('Email').fill('admin@kgd.local')
        await page.getByLabel('Password').fill('wrongpassword')
        await page.getByRole('button', { name: /sign in/i }).click()

        await expect(page.getByText(/invalid email or password/i)).toBeVisible()
        await expect(page).toHaveURL(/login/)
    })

    test('logs in successfully as admin', async ({ page }) => {
        await page.goto('/login')
        await page.getByLabel('Email').fill('admin@kgd.local')
        await page.getByLabel('Password').fill('admin123')
        await page.getByRole('button', { name: /sign in/i }).click()

        await page.waitForURL(/dashboard/)
        await expect(page).toHaveURL(/dashboard/)
        await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    })

    test('logs in successfully as staff', async ({ page }) => {
        await page.goto('/login')
        await page.getByLabel('Email').fill('staff@kgd.local')
        await page.getByLabel('Password').fill('staff123')
        await page.getByRole('button', { name: /sign in/i }).click()

        await page.waitForURL(/dashboard/)
        await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    })
})
