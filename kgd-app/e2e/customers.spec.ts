import { test, expect } from '@playwright/test'

const CUSTOMER_NAME = `E2E Customer ${Date.now()}`

test.describe('Customers', () => {
    test.describe.configure({ mode: 'serial' })

    let customerId: string

    // ── CREATE ────────────────────────────────────────────────────
    test('creates a new customer', async ({ page }) => {
        test.setTimeout(60_000)

        await page.goto('/customers/new')
        await expect(page.getByRole('heading', { name: 'New Customer', exact: true })).toBeVisible()

        await page.locator('#name').fill(CUSTOMER_NAME)
        await page.locator('#businessName').fill('E2E Shop')
        await page.locator('#city').fill('Hyderabad')
        await page.locator('#defaultDiscount').fill('5')

        await Promise.all([
            page.waitForURL(/\/customers\/(?!new(?:\/)?$)[^/?#]+/, { timeout: 30000 }),
            page.getByRole('button', { name: /save customer/i }).click(),
        ])

        // Wait for the customer name heading on the detail page
        await expect(page.getByRole('heading', { name: CUSTOMER_NAME })).toBeVisible({ timeout: 30000 })

        const urlSegs = page.url().split(/[/?]/)
        customerId = urlSegs[urlSegs.indexOf('customers') + 1]
        expect(customerId).not.toBe('new')
    })

    // ── READ ─────────────────────────────────────────────────────
    test('shows customer in listing', async ({ page }) => {
        await page.goto('/customers')
        await expect(page.getByText(CUSTOMER_NAME)).toBeVisible()
    })

    test('detail page shows stats and empty ledger', async ({ page }) => {
        await page.goto(`/customers/${customerId}`)
        await expect(page.getByText('Total Billed')).toBeVisible()
        await expect(page.getByText('Outstanding Balance')).toBeVisible()
        await expect(page.getByText('No transactions yet.')).toBeVisible()
    })

    // ── CONTACT ──────────────────────────────────────────────────
    test('can add a contact', async ({ page }) => {
        await page.goto(`/customers/${customerId}`)

        // The Add Contact card: <div class="card"> contains <h3>Add Contact</h3> and <form>
        // Use the card div as container (h3 is outside the form tag)
        const contactCard = page.locator('div.card').filter({ hasText: /add contact/i })
        await contactCard.locator('input[name="name"]').fill('Ravi Kumar')
        await contactCard.locator('input[name="phone"]').fill('9876543210')
        await contactCard.locator('input[name="role"]').fill('Owner')

        // Wait a moment for React hydration to bind the server action
        await page.waitForTimeout(1000)
        await contactCard.getByRole('button', { name: /add contact/i }).click()

        // Just wait for the text to appear. revalidatePath doesn't trigger URL change.
        await expect(page.getByText('Ravi Kumar')).toBeVisible({ timeout: 15000 })
    })

    // ── EDIT ─────────────────────────────────────────────────────
    test('can edit customer details', async ({ page }) => {
        await page.goto(`/customers/${customerId}/edit`)
        await expect(page.getByRole('heading', { name: /edit customer/i })).toBeVisible()

        await page.locator('#city').fill('Mumbai')

        await page.getByRole('button', { name: /save changes/i }).click()

        // Wait for Mumbai to appear on the detail page (heading/text)
        await expect(page.getByText('Mumbai')).toBeVisible({ timeout: 15000 })
        // Ensure we are back on the detail page
        expect(page.url().includes('/edit')).toBe(false)
    })

    // ── NAV ──────────────────────────────────────────────────────
    test('New Invoice button links to invoice creation pre-filled', async ({ page }) => {
        await page.goto(`/customers/${customerId}`)
        await page.getByRole('link', { name: '+ New Invoice' }).click()
        // Here we can just wait for the New Invoice heading
        await expect(page.getByRole('heading', { name: /new invoice/i })).toBeVisible({ timeout: 15000 })
        await expect(page.url()).toContain(customerId)
    })
})
