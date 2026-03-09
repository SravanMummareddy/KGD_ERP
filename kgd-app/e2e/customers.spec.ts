import { test, expect } from '@playwright/test'

const CUSTOMER_NAME = `E2E Customer ${Date.now()}`

test.describe('Customers', () => {
    test.describe.configure({ mode: 'serial' }) // share created customer across tests

    let customerId: string

    // ── CREATE ────────────────────────────────────────────────────
    test('creates a new customer', async ({ page }) => {
        await page.goto('/customers/new')
        await expect(page.getByRole('heading', { name: /new customer/i })).toBeVisible()

        await page.getByLabel(/customer name/i).fill(CUSTOMER_NAME)
        await page.getByLabel(/business/i).fill('E2E Shop')
        await page.getByLabel(/city/i).fill('Hyderabad')
        await page.getByLabel(/default discount/i).fill('5')
        await page.getByRole('button', { name: /save|create/i }).click()

        // Should redirect to the customer detail page
        await page.waitForURL(/\/customers\/[a-z0-9]+$/)
        await expect(page.getByRole('heading', { name: CUSTOMER_NAME })).toBeVisible()
        customerId = page.url().split('/customers/')[1]
    })

    // ── READ ─────────────────────────────────────────────────────
    test('shows customer in listing', async ({ page }) => {
        await page.goto('/customers')
        await expect(page.getByText(CUSTOMER_NAME)).toBeVisible()
    })

    test('detail page shows stats and empty ledger', async ({ page }) => {
        await page.goto(`/customers/${customerId}`)
        await expect(page.getByText(/total billed/i)).toBeVisible()
        await expect(page.getByText(/outstanding balance/i)).toBeVisible()
        await expect(page.getByText(/no transactions yet/i)).toBeVisible()
    })

    // ── CONTACT ──────────────────────────────────────────────────
    test('can add a contact', async ({ page }) => {
        await page.goto(`/customers/${customerId}`)
        await page.getByLabel('Name *').fill('Ravi Kumar')
        await page.getByLabel('Phone').fill('9876543210')
        await page.getByLabel('Role').fill('Owner')
        await page.getByRole('button', { name: /add contact/i }).click()

        // Page reloads; contact should appear
        await page.waitForURL(`**/customers/${customerId}`)
        await expect(page.getByText('Ravi Kumar')).toBeVisible()
    })

    // ── EDIT ─────────────────────────────────────────────────────
    test('can edit customer details', async ({ page }) => {
        await page.goto(`/customers/${customerId}/edit`)
        await expect(page.getByRole('heading', { name: /edit customer/i })).toBeVisible()

        await page.getByLabel(/city/i).fill('Mumbai')
        await page.getByRole('button', { name: /save changes/i }).click()

        await page.waitForURL(`**/customers/${customerId}`)
        await expect(page.getByText('Mumbai')).toBeVisible()
    })

    // ── NAV ──────────────────────────────────────────────────────
    test('New Invoice button links to invoice creation pre-filled', async ({ page }) => {
        await page.goto(`/customers/${customerId}`)
        await page.getByRole('link', { name: /\+ new invoice/i }).click()
        await page.waitForURL(/\/invoices\/new/)
        await expect(page.url()).toContain(customerId)
    })
})
