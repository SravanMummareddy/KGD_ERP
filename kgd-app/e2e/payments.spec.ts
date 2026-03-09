import { test, expect } from '@playwright/test'

const CUST = `Payment Customer ${Date.now()}`

test.describe('Payments', () => {
    test.describe.configure({ mode: 'serial' })

    let customerId: string
    let invoiceId: string

    // ── SETUP: customer + unpaid invoice ──────────────────────────
    test.beforeAll(async ({ browser }) => {
        const ctx = await browser.newContext({ storageState: 'e2e/.auth/admin.json' })
        const page = await ctx.newPage()

        // Create customer
        await page.goto('/customers/new')
        await page.locator('#name').fill(CUST)
        await page.getByRole('button', { name: /save customer/i }).click()
        // Wait for the new customer heading to appear
        await expect(page.getByRole('heading', { name: CUST })).toBeVisible({ timeout: 15000 })
        const urlSegments = page.url().split(/[/?]/)
        customerId = urlSegments[urlSegments.indexOf('customers') + 1]

        // Create invoice 5 × ₹90 = ₹450
        await page.goto(`/invoices/new?customerId=${customerId}`)
        await page.waitForFunction(
            (id) => {
                const sel = document.querySelector('#customerId') as HTMLSelectElement
                return sel && sel.value === id
            },
            customerId,
            { timeout: 10000 }
        )
        await page.getByPlaceholder('Description *').fill('Silver Plates')
        const numberInputs = page.locator('form input[type="number"]')
        await numberInputs.nth(0).fill('5')
        await numberInputs.nth(1).fill('90')
        await page.getByRole('button', { name: /create invoice/i }).click()
        // Wait for KGD- prefix to appear indicating successful creation
        await expect(page.getByText(/KGD-/i).first()).toBeVisible({ timeout: 15000 })
        const invUrlSegs = page.url().split(/[/?]/)
        invoiceId = invUrlSegs[invUrlSegs.indexOf('invoices') + 1]

        await ctx.close()
    })

    // ── PAYMENT FORM ──────────────────────────────────────────────
    test('payment form pre-fills customer and shows open invoice', async ({ page }) => {
        await page.goto(`/payments/new?customerId=${customerId}&invoiceId=${invoiceId}`)
        await expect(page.getByRole('heading', { name: /record payment/i })).toBeVisible()

        // Customer pre-selected
        await expect(page.locator('#customerId')).toHaveValue(customerId)

        // Invoice checkbox visible
        const checkbox = page.locator('input[type="checkbox"][name="invoiceIds"]').first()
        await expect(checkbox).toBeVisible()
        await expect(checkbox).toBeChecked()
    })

    // ── PARTIAL PAYMENT ───────────────────────────────────────────
    test('records a partial payment → invoice becomes PARTIAL', async ({ page }) => {
        await page.goto(`/payments/new?customerId=${customerId}&invoiceId=${invoiceId}`)

        await page.locator('#amount').fill('250')
        await page.locator('#paymentDate').fill(new Date().toISOString().split('T')[0])
        await page.locator('#method').selectOption('CASH')

        const checkbox = page.locator('input[type="checkbox"][name="invoiceIds"]').first()
        await checkbox.check()

        await page.getByRole('button', { name: /record payment/i }).click()
        await page.waitForURL(url => !url.pathname.includes('/new'), { timeout: 15000 })

        await page.goto(`/invoices/${invoiceId}`)
        await expect(page.getByText(/partial/i).first()).toBeVisible({ timeout: 15000 })
    })

    // ── PAYMENT LIST ──────────────────────────────────────────────
    test('payment list shows the recorded payment', async ({ page }) => {
        await page.goto('/payments')
        await expect(page.getByRole('heading', { name: /payments/i })).toBeVisible()
        await expect(page.getByText(CUST)).toBeVisible()
    })

    // ── CUSTOMER LEDGER ───────────────────────────────────────────
    test('payment appears in customer ledger', async ({ page }) => {
        await page.goto(`/customers/${customerId}`)
        await expect(page.getByText(/payment via cash/i)).toBeVisible()
    })

    // ── FULL PAYMENT ──────────────────────────────────────────────
    test('records remaining payment → invoice becomes PAID', async ({ page }) => {
        await page.goto(`/payments/new?customerId=${customerId}&invoiceId=${invoiceId}`)

        await page.locator('#amount').fill('200')
        await page.locator('#paymentDate').fill(new Date().toISOString().split('T')[0])

        const checkbox = page.locator('input[type="checkbox"][name="invoiceIds"]').first()
        await checkbox.check()

        await page.getByRole('button', { name: /record payment/i }).click()
        await page.waitForURL(url => !url.pathname.includes('/new'), { timeout: 15000 })

        await page.goto(`/invoices/${invoiceId}`)
        await expect(page.getByText(/paid/i).first()).toBeVisible({ timeout: 15000 })
    })
})
