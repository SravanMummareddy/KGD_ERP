import { test, expect } from '@playwright/test'

const CUST = `Payment Customer ${Date.now()}`

test.describe('Payments', () => {
    test.describe.configure({ mode: 'serial' })

    let customerId: string
    let invoiceId: string

    // ── SETUP: create customer + invoice ──────────────────────────
    test.beforeAll(async ({ browser }) => {
        const page = await browser.newPage()

        // Create customer
        await page.goto('/customers/new')
        await page.getByLabel(/customer name/i).fill(CUST)
        await page.getByRole('button', { name: /save|create/i }).click()
        await page.waitForURL(/\/customers\/[a-z0-9]+$/)
        customerId = page.url().split('/customers/')[1]

        // Create invoice for that customer
        await page.goto(`/invoices/new?customerId=${customerId}`)
        await page.getByPlaceholder(/description/i).first().fill('Silver Plates')
        await page.locator('input[name="quantity"]').first().fill('5')
        await page.locator('input[name="rate"]').first().fill('90')
        await page.getByRole('button', { name: /create invoice|save/i }).click()
        await page.waitForURL(/\/invoices\/[a-z0-9]+$/)
        invoiceId = page.url().split('/invoices/')[1]

        await page.close()
    })

    // ── RECORD PAYMENT ────────────────────────────────────────────
    test('payment form pre-fills customer and open invoices', async ({ page }) => {
        await page.goto(`/payments/new?customerId=${customerId}&invoiceId=${invoiceId}`)
        await expect(page.getByRole('heading', { name: /record payment/i })).toBeVisible()

        // Customer dropdown should be pre-selected
        await expect(page.locator('#customerId')).toHaveValue(customerId)

        // Open invoice checkbox should appear
        await expect(page.locator('input[type="checkbox"][name="invoiceIds"]')).toBeChecked()
    })

    test('records a partial payment and updates invoice status', async ({ page }) => {
        await page.goto(`/payments/new?customerId=${customerId}&invoiceId=${invoiceId}`)

        await page.locator('#amount').fill('250')
        await page.locator('#paymentDate').fill(new Date().toISOString().split('T')[0])
        await page.locator('#method').selectOption('CASH')

        // Make sure the invoice checkbox is checked
        await page.locator('input[type="checkbox"][name="invoiceIds"]').check()

        await page.getByRole('button', { name: /record payment/i }).click()

        // Should redirect — likely to payments list or customer page
        await page.waitForURL(/\/(payments|customers|dashboard)/)

        // Invoice should now show PARTIAL
        await page.goto(`/invoices/${invoiceId}`)
        await expect(page.getByText(/PARTIAL/i)).toBeVisible()
    })

    test('payment list shows the recorded payment', async ({ page }) => {
        await page.goto('/payments')
        await expect(page.getByRole('heading', { name: /payments/i })).toBeVisible()
        // Filter by customer name visible in the table
        await expect(page.getByText(CUST)).toBeVisible()
    })

    test('payment appears in customer ledger', async ({ page }) => {
        await page.goto(`/customers/${customerId}`)
        await expect(page.getByText(/payment via cash/i)).toBeVisible()
    })

    test('records a full payment to settle invoice', async ({ page }) => {
        await page.goto(`/payments/new?customerId=${customerId}&invoiceId=${invoiceId}`)

        // Remaining balance is 450 - 250 = 200 (5 × 90 - 250)
        await page.locator('#amount').fill('200')
        await page.locator('#paymentDate').fill(new Date().toISOString().split('T')[0])
        await page.locator('input[type="checkbox"][name="invoiceIds"]').check()
        await page.getByRole('button', { name: /record payment/i }).click()

        await page.waitForURL(/\/(payments|customers|dashboard)/)
        await page.goto(`/invoices/${invoiceId}`)
        await expect(page.getByText(/PAID/i)).toBeVisible()
    })
})
