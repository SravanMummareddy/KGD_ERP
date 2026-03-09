import { test, expect } from '@playwright/test'

// All dashboard tests run with stored admin session (see playwright.config.ts)
test.describe('Dashboard', () => {
    test('loads the dashboard with stat cards', async ({ page }) => {
        await page.goto('/dashboard')
        await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

        // Four stat cards should be visible
        await expect(page.getByText(/total outstanding/i)).toBeVisible()
        await expect(page.getByText(/today.s sales/i)).toBeVisible()
        await expect(page.getByText(/this month/i)).toBeVisible()
        await expect(page.getByText(/active customers/i)).toBeVisible()
    })

    test('shows Recent Invoices and Outstanding Balances sections', async ({ page }) => {
        await page.goto('/dashboard')
        await expect(page.getByText(/recent invoices/i).first()).toBeVisible()
        await expect(page.getByText(/outstanding balances/i)).toBeVisible()
        await expect(page.getByText(/recent payments/i)).toBeVisible()
    })

    test('New Invoice button navigates to /invoices/new', async ({ page }) => {
        await page.goto('/dashboard')
        await page.getByRole('link', { name: /\+ new invoice/i }).first().click()
        await page.waitForURL(/\/invoices\/new/)
        await expect(page).toHaveURL(/\/invoices\/new/)
    })

    test('Record Payment button navigates to /payments/new', async ({ page }) => {
        await page.goto('/dashboard')
        await page.getByRole('link', { name: /record payment/i }).first().click()
        await page.waitForURL(/\/payments\/new/)
        await expect(page).toHaveURL(/\/payments\/new/)
    })
})
