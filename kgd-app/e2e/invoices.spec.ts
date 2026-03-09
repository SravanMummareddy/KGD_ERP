import { test, expect } from '@playwright/test'

/**
 * Invoice E2E tests.
 * 
 * Strategy:
 * 1. Navigate to /customers/new, create a throw-away customer.
 * 2. Create an invoice for that customer via /invoices/new.
 * 3. Verify detail, print, and status update via payment.
 */

const CUST = `Invoice Customer ${Date.now()}`

test.describe('Invoices', () => {
    test.describe.configure({ mode: 'serial' })

    let customerId: string
    let invoiceId: string

    // ── SETUP: create a customer to bill ──────────────────────────
    test.beforeAll(async ({ browser }) => {
        const page = await browser.newPage()
        await page.goto('/customers/new')
        await page.getByLabel(/customer name/i).fill(CUST)
        await page.getByRole('button', { name: /save|create/i }).click()
        await page.waitForURL(/\/customers\/[a-z0-9]+$/)
        customerId = page.url().split('/customers/')[1]
        await page.close()
    })

    // ── CREATE ────────────────────────────────────────────────────
    test('creates a new invoice', async ({ page }) => {
        await page.goto(`/invoices/new?customerId=${customerId}`)
        await expect(page.getByRole('heading', { name: /new invoice/i })).toBeVisible()

        // Customer should be pre-selected from query param
        await expect(page.locator('select[name="customerId"]')).toHaveValue(customerId)

        // Add a line item — description + qty + rate  
        await page.getByPlaceholder(/description/i).first().fill('10 inch Silver Plate 80 GSM')
        await page.locator('input[name="quantity"]').first().fill('10')
        await page.locator('input[name="rate"]').first().fill('90')

        await page.getByRole('button', { name: /create invoice|save/i }).click()

        // Should land on invoice detail page
        await page.waitForURL(/\/invoices\/[a-z0-9]+$/)
        await expect(page.getByText(/KGD-/i).first()).toBeVisible()
        invoiceId = page.url().split('/invoices/')[1]
    })

    // ── READ ─────────────────────────────────────────────────────
    test('invoice list shows new invoice', async ({ page }) => {
        await page.goto('/invoices')
        await expect(page.getByText(/KGD-/i).first()).toBeVisible()
    })

    test('invoice detail shows correct amounts', async ({ page }) => {
        await page.goto(`/invoices/${invoiceId}`)
        // 10 × ₹90 = ₹900
        await expect(page.getByText(/900/)).toBeVisible()
        await expect(page.getByText(/UNPAID/i)).toBeVisible()
    })

    test('invoice detail has a Print button', async ({ page }) => {
        await page.goto(`/invoices/${invoiceId}`)
        await expect(page.getByRole('link', { name: /print/i })).toBeVisible()
    })

    // ── PRINT PAGE ───────────────────────────────────────────────
    test('print page renders invoice content', async ({ page }) => {
        // Intercept window.print to prevent dialog
        await page.addInitScript(() => { window.print = () => { } })
        await page.goto(`/invoices/${invoiceId}/print`)
        await expect(page.getByText(/KGD/)).toBeVisible()
        await expect(page.getByText(/10 inch Silver Plate/i)).toBeVisible()
    })

    // ── CANCEL (admin only) ───────────────────────────────────────
    test('admin can cancel an invoice', async ({ page }) => {
        await page.goto(`/invoices/${invoiceId}`)

        // Mock the confirm dialog to return true
        page.on('dialog', dialog => dialog.accept())
        await page.getByRole('button', { name: /cancel/i }).click()

        await page.waitForURL(`**/invoices/${invoiceId}`)
        await expect(page.getByText(/CANCELLED/i)).toBeVisible()
    })
})
