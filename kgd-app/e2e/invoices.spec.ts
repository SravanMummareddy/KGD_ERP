import { test, expect } from '@playwright/test'

/**
 * Invoice E2E tests.
 *
 * InvoiceForm: React client component — inputs have no `name` attrs.
 * Selectors: #customerId, placeholder="Description *", nth() for qty/rate number inputs.
 */

const CUST = `Invoice Customer ${Date.now()}`

test.describe('Invoices', () => {
    test.describe.configure({ mode: 'serial' })

    let customerId: string
    let invoiceId: string

    // ── SETUP: create a customer ──────────────────────────────────
    test.beforeAll(async ({ browser }) => {
        const ctx = await browser.newContext({ storageState: 'e2e/.auth/admin.json' })
        const page = await ctx.newPage()

        await page.goto('/customers/new')
        await page.locator('#name').fill(CUST)

        await page.getByRole('button', { name: /save customer/i }).click()
        await expect(page.getByRole('heading', { name: CUST })).toBeVisible({ timeout: 15000 })
        const urlSegs = page.url().split(/[/?]/)
        customerId = urlSegs[urlSegs.indexOf('customers') + 1]

        await ctx.close()
    })

    // ── CREATE ────────────────────────────────────────────────────
    test('creates a new invoice via the line-item form', async ({ page }) => {
        await page.goto(`/invoices/new?customerId=${customerId}`)
        await expect(page.getByRole('heading', { name: 'New Invoice', exact: true })).toBeVisible()

        // Wait for React to hydrate and populate the select
        await page.waitForFunction(
            (id) => {
                const sel = document.querySelector('#customerId') as HTMLSelectElement
                return sel && sel.value === id
            },
            customerId,
            { timeout: 10000 }
        )

        // Description input (no name attr — placeholder is the selector)
        await page.getByPlaceholder('Description *').fill('10 inch Silver Plate 80 GSM')

        // qty = 1st number input in the line-item row; rate = 2nd
        const numberInputs = page.locator('form input[type="number"]')
        await numberInputs.nth(0).fill('10')   // qty
        await numberInputs.nth(1).fill('90')   // rate

        await page.getByRole('button', { name: /create invoice/i }).click()

        // Ensure successful navigation away from the 'new' form
        await page.waitForURL(url => url.pathname.includes('/invoices/') && !url.pathname.includes('/new'), { timeout: 15000 })
        const invUrlSegs = page.url().split(/[/?]/)
        invoiceId = invUrlSegs[invUrlSegs.indexOf('invoices') + 1]

        await expect(page.getByText(/unpaid/i).first()).toBeVisible({ timeout: 15000 })
    })

    // ── READ ─────────────────────────────────────────────────────
    test('invoice appears in the invoices list', async ({ page }) => {
        await page.goto('/invoices')
        await expect(page.getByText(/KGD-/).first()).toBeVisible()
    })

    test('invoice detail shows correct total', async ({ page }) => {
        await page.goto(`/invoices/${invoiceId}`)
        // 10 × 90 = 900
        await expect(page.getByText(/900/).first()).toBeVisible()
        await expect(page.getByText(/unpaid/i).first()).toBeVisible()
    })

    test('invoice detail has a Print link', async ({ page }) => {
        await page.goto(`/invoices/${invoiceId}`)
        const printLink = page.getByRole('link', { name: /print/i })
        await expect(printLink).toBeVisible()
        await expect(printLink).toHaveAttribute('href', `/invoices/${invoiceId}/print`)
    })

    test('print page renders without showing dialog', async ({ page }) => {
        await page.addInitScript(() => { window.print = () => { } })
        await page.goto(`/invoices/${invoiceId}/print`)
        await expect(page.getByText(/KGD/).first()).toBeVisible()
        await expect(page.getByText(/10 inch Silver Plate/i)).toBeVisible()
    })

    test('admin can cancel an invoice', async ({ page }) => {
        await page.goto(`/invoices/${invoiceId}`)
        page.on('dialog', dialog => dialog.accept())
        await page.getByRole('button', { name: /cancel/i }).click()
        await expect(page.getByText(/cancelled/i).first()).toBeVisible({ timeout: 15000 })
    })
})
