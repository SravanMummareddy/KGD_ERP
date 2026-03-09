import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './e2e',
    timeout: 30_000,
    retries: 1,
    workers: 1,           // serial — app hits a single local DB
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        video: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        // Step 1: log in and save session to disk
        {
            name: 'setup',
            testMatch: /auth\.setup\.ts/,
        },
        // Step 2: run all tests reusing the stored session
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'e2e/.auth/admin.json',
            },
            dependencies: ['setup'],
        },
    ],
    // Start the dev server automatically
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 60_000,
    },
})
