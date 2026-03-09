import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '.auth/admin.json')

/**
 * auth.setup.ts — runs once before all tests.
 * Logs in as admin and saves the browser storage state so every
 * subsequent test can skip the login page entirely.
 */
setup('authenticate as admin', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('admin@kgd.local')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Wait until we land on dashboard
    await page.waitForURL('**/dashboard')
    await expect(page).toHaveURL(/dashboard/)

    // Save cookies + localStorage to disk
    await page.context().storageState({ path: authFile })
})
